import type { RowDataPacket, ResultSetHeader } from "mysql2";
import type { PoolConnection } from "mysql2/promise";

import { pool } from "../config/database.js";

import type {
  Solicitud,
  DetalleSolicitudPublico,
  SolicitudConDetalles,
  SolicitudAdministrativa,
} from "../types/solicitudes.js";

// ==========================================
// FORMATEAR FECHA PARA MYSQL
// ==========================================

function formatearFechaMySQL(fecha: Date): string {
  const dosDigitos = (valor: number): string => String(valor).padStart(2, "0");

  const anio = fecha.getFullYear();
  const mes = dosDigitos(fecha.getMonth() + 1);
  const dia = dosDigitos(fecha.getDate());
  const horas = dosDigitos(fecha.getHours());
  const minutos = dosDigitos(fecha.getMinutes());
  const segundos = dosDigitos(fecha.getSeconds());

  return `${anio}-${mes}-${dia} ${horas}:${minutos}:${segundos}`;
}

// ==========================================
// TIPOS INTERNOS DEL REPOSITORIO
// ==========================================

export interface ProductoPedidoDB extends RowDataPacket {
  id_producto: number;
  nombre: string;
  precio: string;
  stock: number;
  disponible: number;
}

export interface ProductoCalculado {
  id_producto: number;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

type SolicitudRow = Solicitud & RowDataPacket;

type SolicitudAdministrativaRow = Omit<SolicitudAdministrativa, "productos"> & RowDataPacket;

type DetalleSolicitudRow = DetalleSolicitudPublico & RowDataPacket;

// ==========================================
// BUSCAR PRODUCTO POR ID
// ==========================================

export async function buscarProductoPedido(
  idProducto: number,
): Promise<ProductoPedidoDB | null> {
  const [filas] = await pool.execute<ProductoPedidoDB[]>(
    `
      SELECT
        id_producto,
        nombre,
        precio,
        stock,
        disponible
      FROM productos
      WHERE id_producto = ?
    `,
    [idProducto],
  );

  return filas[0] ?? null;
}

// ==========================================
// CONSULTAR PRODUCTOS PARA UN PEDIDO
// ==========================================

export async function consultarProductosPedido(
  productos: Array<{
    id_producto: number;
    cantidad: number;
  }>,
): Promise<ProductoCalculado[]> {
  const resultado: ProductoCalculado[] = [];

  for (const item of productos) {
    // Buscar el producto en MySQL
    const producto = await buscarProductoPedido(item.id_producto);

    // Comprobar que exista
    if (!producto) {
      throw new Error(`El producto ${item.id_producto} no existe`);
    }

    // Comprobar que esté disponible
    if (producto.disponible !== 1) {
      throw new Error(`El producto "${producto.nombre}" no está disponible`);
    }

    // Comprobar que la cantidad sea válida
    if (!Number.isSafeInteger(item.cantidad) || item.cantidad <= 0) {
      throw new Error(`Cantidad inválida para "${producto.nombre}"`);
    }

    // Comprobar existencias
    if (producto.stock < item.cantidad) {
      throw new Error(
        `Stock insuficiente para "${producto.nombre}". ` +
          `Disponibles: ${producto.stock}`,
      );
    }

    // Convertir precio a número
    const precio = Number(producto.precio);

    // Calcular subtotal
    const subtotal = Number((precio * item.cantidad).toFixed(2));

    resultado.push({
      id_producto: producto.id_producto,
      nombre: producto.nombre,
      cantidad: item.cantidad,
      precio_unitario: precio,
      subtotal,
    });
  }

  return resultado;
}

// ==========================================
// CREAR SOLICITUD EN MYSQL
// ==========================================

export async function crearSolicitudEnBD(
  idUsuario: number,
  productos: ProductoCalculado[],
  minutosLlegada: number,
): Promise<number> {
  // Validar identificador de usuario
  if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
    throw new Error("Identificador de usuario inválido");
  }

  // Validar que existan productos
  if (productos.length === 0) {
    throw new Error("La solicitud debe contener productos");
  }

  // Validar tiempo estimado de llegada
  if (!Number.isSafeInteger(minutosLlegada) || minutosLlegada <= 0) {
    throw new Error("El tiempo estimado de llegada debe ser positivo");
  }

  // Obtener conexión a MySQL
  const conexion = await pool.getConnection();

  try {
    // ======================================
    // INICIAR TRANSACCIÓN
    // ======================================

    await conexion.beginTransaction();

    // ======================================
    // CALCULAR TOTAL
    // ======================================

    const totalCentavos = productos.reduce((acumulado, producto) => {
      const precioCentavos = Math.round(producto.precio_unitario * 100);

      return acumulado + precioCentavos * producto.cantidad;
    }, 0);

    const total = totalCentavos / 100;

    // ======================================
    // CALCULAR FECHA ESTIMADA DE RECOGIDA
    // ======================================

    const fechaRecogida = formatearFechaMySQL(
      new Date(Date.now() + minutosLlegada * 60_000),
    );

    // ======================================
    // INSERTAR SOLICITUD
    // ======================================

    const [resultado] = await conexion.execute<ResultSetHeader>(
      `
          INSERT INTO solicitudes (
            id_usuario,
            estado,
            total,
            minutos_llegada,
            fecha_recogida_estimada
          )
          VALUES (?, 'PENDIENTE', ?, ?, ?)
        `,
      [idUsuario, total, minutosLlegada, fechaRecogida],
    );

    // Obtener ID generado por MySQL
    const idSolicitud = resultado.insertId;

    // ======================================
    // GENERAR FOLIO
    // ======================================

    const folio = `FRZ-${String(idSolicitud).padStart(6, "0")}`;

    await conexion.execute(
      `
        UPDATE solicitudes
        SET folio = ?
        WHERE id_solicitud = ?
      `,
      [folio, idSolicitud],
    );

    // ======================================
    // GUARDAR DETALLES DE LA SOLICITUD
    // ======================================

    for (const producto of productos) {
      await conexion.execute(
        `
          INSERT INTO detalle_solicitud (
            id_solicitud,
            id_producto,
            cantidad,
            precio_unitario
          )
          VALUES (?, ?, ?, ?)
        `,
        [
          idSolicitud,
          producto.id_producto,
          producto.cantidad,
          producto.precio_unitario,
        ],
      );
    }

    // ======================================
    // CONFIRMAR TRANSACCIÓN
    // ======================================

    await conexion.commit();

    // Devolver el ID de la solicitud creada
    return idSolicitud;
  } catch (error) {
    // ======================================
    // REVERTIR CAMBIOS SI OCURRE UN ERROR
    // ======================================

    await conexion.rollback();

    throw error;
  } finally {
    // ======================================
    // LIBERAR CONEXIÓN
    // ======================================

    conexion.release();
  }
}

// ==========================================
// CONSULTAR PEDIDOS DE UN CLIENTE
// ==========================================

export async function listarSolicitudesCliente(
  idUsuario: number,
): Promise<Solicitud[]> {
  const [filas] = await pool.execute<SolicitudRow[]>(
    `
      SELECT
        id_solicitud,
        id_usuario,
        folio,
        estado,
        total,
        minutos_llegada,
        fecha_recogida_estimada,
        motivo_rechazo,
        motivo_cancelacion,
        estado_cancelacion,
        fecha_solicitud,
        fecha_actualizacion
      FROM solicitudes
      WHERE id_usuario = ?
      ORDER BY fecha_solicitud DESC, id_solicitud DESC
    `,
    [idUsuario],
  );

  return filas;
}

// ==========================================
// CONSULTAR DETALLES DE UN PEDIDO
// ==========================================

export async function obtenerDetallesSolicitud(
  idSolicitud: number,
): Promise<DetalleSolicitudPublico[]> {
  const [filas] = await pool.execute<DetalleSolicitudRow[]>(
    `
        SELECT
          ds.id_detalle,
          ds.id_solicitud,
          ds.id_producto,
          ds.cantidad,
          ds.precio_unitario,
          ds.subtotal,
          p.nombre AS nombre_producto
        FROM detalle_solicitud AS ds
        INNER JOIN productos AS p
          ON ds.id_producto = p.id_producto
        WHERE ds.id_solicitud = ?
        ORDER BY ds.id_detalle ASC
      `,
    [idSolicitud],
  );

  return filas;
}

// ==========================================
// LISTAR PEDIDOS CON SUS PRODUCTOS
// ==========================================

export async function listarSolicitudesConDetalles(
  idUsuario: number,
): Promise<SolicitudConDetalles[]> {
  // Consultar únicamente los pedidos del cliente
  const solicitudes = await listarSolicitudesCliente(idUsuario);

  const resultado: SolicitudConDetalles[] = [];

  // Obtener los productos de cada solicitud
  for (const solicitud of solicitudes) {
    const productos = await obtenerDetallesSolicitud(solicitud.id_solicitud);

    resultado.push({
      ...solicitud,
      productos,
    });
  }

  return resultado;
}

// ==========================================
// CONSULTAR UN PEDIDO INDIVIDUAL DEL CLIENTE
// ==========================================

export async function buscarSolicitudPorIdYUsuario(
  idSolicitud: number,
  idUsuario: number,
): Promise<SolicitudConDetalles | null> {
  // Buscar la solicitud y comprobar que pertenezca
  // al usuario autenticado.
  const [filas] = await pool.execute<SolicitudRow[]>(
    `
       SELECT
         id_solicitud,
         id_usuario,
         folio,
         estado,
         total,
         minutos_llegada,
         fecha_recogida_estimada,
         motivo_rechazo,
         motivo_cancelacion,
         estado_cancelacion,
         fecha_solicitud,
         fecha_actualizacion
       FROM solicitudes
       WHERE id_solicitud = ?
         AND id_usuario = ?
       LIMIT 1
     `,
    [idSolicitud, idUsuario],
  );

  const solicitud = filas[0];

  // Si no existe o pertenece a otro cliente,
  // no devolvemos información.
  if (!solicitud) {
    return null;
  }

  // Obtener los productos de la solicitud encontrada.
  const productos = await obtenerDetallesSolicitud(solicitud.id_solicitud);

  return {
    ...solicitud,
    productos,
  };
}

// ==========================================
// CONSULTAR TODAS LAS SOLICITUDES
// ADMINISTRADOR Y EMPLEADO
// ==========================================

export async function listarTodasLasSolicitudes(): Promise<
  SolicitudAdministrativa[]
> {
  // Consultar todos los pedidos registrados
  const [filas] = await pool.execute<SolicitudAdministrativaRow[]>(
    `
       SELECT
         s.id_solicitud,
         s.id_usuario,
         s.folio,
         s.estado,
         s.total,
         s.minutos_llegada,
         s.fecha_recogida_estimada,
         s.motivo_rechazo,
         s.motivo_cancelacion,
         s.estado_cancelacion,
         s.fecha_solicitud,
         s.fecha_actualizacion,
         u.nombre AS nombre_cliente,
         u.correo AS correo_cliente,
         u.telefono AS telefono_cliente,
         v.id_venta
       FROM solicitudes AS s
       INNER JOIN usuarios AS u ON u.id_usuario = s.id_usuario
       LEFT JOIN ventas AS v ON v.id_solicitud = s.id_solicitud
       ORDER BY s.fecha_solicitud DESC, s.id_solicitud DESC
     `,
  );

  const resultado: SolicitudAdministrativa[] = [];

  // Obtener los productos de cada pedido
  for (const solicitud of filas) {
    const productos = await obtenerDetallesSolicitud(solicitud.id_solicitud);

    resultado.push({
      ...solicitud,
      productos,
    });
  }

  return resultado;
}

// ==========================================
// ACEPTAR SOLICITUD Y DESCONTAR INVENTARIO
// ==========================================

export async function aceptarSolicitudEnBD(
  idSolicitud: number,
  idUsuarioPersonal: number,
): Promise<void> {
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    // Bloquear la solicitud para evitar que
    // dos empleados la acepten simultáneamente.
    const [solicitudes] = await conexion.execute<RowDataPacket[]>(
      `
           SELECT id_solicitud, estado, estado_cancelacion
           FROM solicitudes
           WHERE id_solicitud = ?
           FOR UPDATE
         `,
      [idSolicitud],
    );

    const solicitud = solicitudes[0];

    if (!solicitud) {
      throw new Error("La solicitud no existe");
    }

    if (solicitud.estado !== "PENDIENTE") {
      throw new Error("Solo se pueden aceptar solicitudes pendientes");
    }

    if (
      solicitud.estado_cancelacion === "SOLICITADA" ||
      solicitud.estado_cancelacion === "APROBADA"
    ) {
      throw new Error("La solicitud tiene un proceso de cancelación");
    }

    // Consultar los productos solicitados.
    const [detalles] = await conexion.execute<RowDataPacket[]>(
      `
           SELECT id_producto, cantidad
           FROM detalle_solicitud
           WHERE id_solicitud = ?
           ORDER BY id_producto ASC
         `,
      [idSolicitud],
    );

    if (detalles.length === 0) {
      throw new Error("La solicitud no contiene productos");
    }

    // Bloquear cada producto y comprobar existencias.
    // El orden por ID reduce el riesgo de interbloqueos.
    for (const detalle of detalles) {
      const [productos] = await conexion.execute<RowDataPacket[]>(
        `
             SELECT id_producto, nombre, stock, disponible
             FROM productos
             WHERE id_producto = ?
             FOR UPDATE
           `,
        [detalle.id_producto],
      );

      const producto = productos[0];

      if (!producto) {
        throw new Error(`El producto ${detalle.id_producto} no existe`);
      }

      if (Number(producto.disponible) !== 1) {
        throw new Error(`El producto "${producto.nombre}" no está disponible`);
      }

      if (producto.stock < detalle.cantidad) {
        throw new Error(`Stock insuficiente para "${producto.nombre}"`);
      }

      // Descontar existencias.
      await conexion.execute(
        `
           UPDATE productos
           SET stock = stock - ?
           WHERE id_producto = ?
         `,
        [detalle.cantidad, detalle.id_producto],
      );

      // Registrar el movimiento de inventario.
      await conexion.execute(
        `
           INSERT INTO movimientos_inventario (
             id_producto,
             id_usuario,
             id_solicitud,
             tipo,
             cantidad,
             motivo
           )
           VALUES (?, ?, ?, 'SALIDA', ?, ?)
         `,
        [
          detalle.id_producto,
          idUsuarioPersonal,
          idSolicitud,
          detalle.cantidad,
          `Aceptación de solicitud #${idSolicitud}`,
        ],
      );
    }

    // Actualizar el estado del pedido.
    await conexion.execute(
      `
         UPDATE solicitudes
         SET estado = 'ACEPTADA'
         WHERE id_solicitud = ?
       `,
      [idSolicitud],
    );

    await conexion.commit();
  } catch (error) {
    // Si falla cualquier operación,
    // revertir todos los cambios.
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// ==========================================
// RECHAZAR SOLICITUD PENDIENTE
// ==========================================

export async function rechazarSolicitudEnBD(
  idSolicitud: number,
  motivoRechazo: string,
): Promise<void> {
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    // Bloquear el pedido para evitar cambios simultáneos.
    const [filas] = await conexion.execute<RowDataPacket[]>(
      `
         SELECT
           id_solicitud,
           estado,
           estado_cancelacion
         FROM solicitudes
         WHERE id_solicitud = ?
         FOR UPDATE
       `,
      [idSolicitud],
    );

    const solicitud = filas[0];

    if (!solicitud) {
      throw new Error("La solicitud no existe");
    }

    if (solicitud.estado !== "PENDIENTE") {
      throw new Error("Solo se pueden rechazar solicitudes pendientes");
    }

    if (
      solicitud.estado_cancelacion === "SOLICITADA" ||
      solicitud.estado_cancelacion === "APROBADA"
    ) {
      throw new Error("La solicitud tiene un proceso de cancelación");
    }

    // Cambiar el estado y guardar el motivo.
    await conexion.execute(
      `
         UPDATE solicitudes
         SET
           estado = 'RECHAZADA',
           motivo_rechazo = ?
         WHERE id_solicitud = ?
       `,
      [motivoRechazo, idSolicitud],
    );

    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// ==========================================
// ACTUALIZAR ESTADO DE PREPARACIÓN
// ==========================================

export async function actualizarEstadoPreparacionEnBD(
  idSolicitud: number,
  nuevoEstado: "EN_PREPARACION" | "LISTA" | "ENTREGADA",
): Promise<void> {
  // La entrega solo puede completarse mediante el cobro transaccional.
  // Conservamos la firma temporalmente para no romper el servicio actual.
  if (nuevoEstado === "ENTREGADA") {
    throw new Error("Para entregar la solicitud debes registrar su cobro");
  }

  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    // Bloquear el pedido para evitar
    // actualizaciones simultáneas.
    const [filas] = await conexion.execute<RowDataPacket[]>(
      `
           SELECT
             id_solicitud,
             estado,
             estado_cancelacion
           FROM solicitudes
           WHERE id_solicitud = ?
           FOR UPDATE
         `,
      [idSolicitud],
    );

    const solicitud = filas[0];

    if (!solicitud) {
      throw new Error("La solicitud no existe");
    }

    // Definir las transiciones permitidas.
    const transiciones: Record<string, string> = {
      ACEPTADA: "EN_PREPARACION",
      EN_PREPARACION: "LISTA",
    };

    const siguienteEstado = transiciones[solicitud.estado];

    // No permitir saltar estados ni retroceder.
    if (siguienteEstado !== nuevoEstado) {
      throw new Error(
        `No se puede cambiar de ${solicitud.estado} a ${nuevoEstado}`,
      );
    }

    // No avanzar si existe una cancelación pendiente.
    if (solicitud.estado_cancelacion === "SOLICITADA") {
      throw new Error("La solicitud tiene una cancelación pendiente");
    }

    // Actualizar únicamente el estado.
    await conexion.execute(
      `
         UPDATE solicitudes
         SET estado = ?
         WHERE id_solicitud = ?
       `,
      [nuevoEstado, idSolicitud],
    );

    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// ==========================================
// SOLICITAR CANCELACIÓN DE UN PEDIDO
// ==========================================

export async function solicitarCancelacionEnBD(
  idSolicitud: number,
  idUsuario: number,
  motivoCancelacion: string,
): Promise<void> {
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    // ======================================
    // BUSCAR Y BLOQUEAR EL PEDIDO
    // ======================================

    const [filas] = await conexion.execute<RowDataPacket[]>(
      `
           SELECT
             id_solicitud,
             id_usuario,
             estado,
             estado_cancelacion
           FROM solicitudes
           WHERE id_solicitud = ?
             AND id_usuario = ?
           FOR UPDATE
         `,
      [idSolicitud, idUsuario],
    );

    const solicitud = filas[0];

    // No revelar pedidos de otros clientes.
    if (!solicitud) {
      throw new Error("La solicitud no existe");
    }

    // ======================================
    // VALIDAR ESTADO DEL PEDIDO
    // ======================================

    if (solicitud.estado !== "PENDIENTE" && solicitud.estado !== "ACEPTADA") {
      throw new Error(
        "Solo puedes solicitar la cancelación de pedidos pendientes o aceptados",
      );
    }

    // ======================================
    // VALIDAR CANCELACIÓN EXISTENTE
    // ======================================

    if (solicitud.estado_cancelacion === "SOLICITADA") {
      throw new Error("Este pedido ya tiene una cancelación pendiente");
    }

    if (solicitud.estado_cancelacion === "APROBADA") {
      throw new Error("Este pedido ya fue cancelado");
    }

    // ======================================
    // REGISTRAR SOLICITUD DE CANCELACIÓN
    // ======================================

    await conexion.execute(
      `
         UPDATE solicitudes
         SET
           estado_cancelacion = 'SOLICITADA',
           motivo_cancelacion = ?
         WHERE id_solicitud = ?
           AND id_usuario = ?
       `,
      [motivoCancelacion, idSolicitud, idUsuario],
    );

    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// ==========================================
// APROBAR CANCELACIÓN DE UNA SOLICITUD
// ADMINISTRADOR / EMPLEADO
// ==========================================

export async function aprobarCancelacionEnBD(
  idSolicitud: number,
  idUsuarioPersonal: number,
): Promise<void> {
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    // ======================================
    // BLOQUEAR Y CONSULTAR LA SOLICITUD
    // ======================================

    const [filas] = await conexion.execute<RowDataPacket[]>(
      `
           SELECT
             id_solicitud,
             estado,
             estado_cancelacion
           FROM solicitudes
           WHERE id_solicitud = ?
           FOR UPDATE
         `,
      [idSolicitud],
    );

    const solicitud = filas[0];

    if (!solicitud) {
      throw new Error("La solicitud no existe");
    }

    // ======================================
    // VALIDAR CANCELACIÓN
    // ======================================

    if (solicitud.estado_cancelacion !== "SOLICITADA") {
      throw new Error("La solicitud no tiene una cancelación pendiente");
    }

    if (solicitud.estado !== "PENDIENTE" && solicitud.estado !== "ACEPTADA") {
      throw new Error("El pedido no se encuentra en un estado cancelable");
    }

    // ======================================
    // RESTAURAR INVENTARIO SI FUE ACEPTADA
    // ======================================

    if (solicitud.estado === "ACEPTADA") {
      const [detalles] = await conexion.execute<RowDataPacket[]>(
        `
             SELECT
               id_producto,
               cantidad
             FROM detalle_solicitud
             WHERE id_solicitud = ?
             ORDER BY id_producto
           `,
        [idSolicitud],
      );

      if (detalles.length === 0) {
        throw new Error("La solicitud no tiene productos registrados");
      }

      for (const detalle of detalles) {
        const idProducto = Number(detalle.id_producto);
        const cantidad = Number(detalle.cantidad);

        // Bloquear el producto antes de actualizarlo
        const [productos] = await conexion.execute<RowDataPacket[]>(
          `
               SELECT id_producto
               FROM productos
               WHERE id_producto = ?
               FOR UPDATE
             `,
          [idProducto],
        );

        if (productos.length === 0) {
          throw new Error("Uno de los productos del pedido no existe");
        }

        // Devolver las unidades al inventario
        await conexion.execute(
          `
             UPDATE productos
             SET stock = stock + ?
             WHERE id_producto = ?
           `,
          [cantidad, idProducto],
        );

        // Registrar la devolución
        await conexion.execute(
          `
             INSERT INTO movimientos_inventario (
               id_producto,
               id_usuario,
               id_solicitud,
               tipo,
               cantidad,
               motivo
             )
             VALUES (?, ?, ?, 'ENTRADA', ?, ?)
           `,
          [
            idProducto,
            idUsuarioPersonal,
            idSolicitud,
            cantidad,
            "Devolución por cancelación de pedido",
          ],
        );
      }
    }

    // ======================================
    // FINALIZAR CANCELACIÓN
    // ======================================

    await conexion.execute(
      `
         UPDATE solicitudes
         SET
           estado = 'CANCELADA',
           estado_cancelacion = 'APROBADA'
         WHERE id_solicitud = ?
       `,
      [idSolicitud],
    );

    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// ==========================================
// RECHAZAR CANCELACIÓN DE UN PEDIDO
// ADMINISTRADOR / EMPLEADO
// ==========================================

export async function rechazarCancelacionEnBD(
  idSolicitud: number,
): Promise<void> {
  const conexion = await pool.getConnection();

  try {
    await conexion.beginTransaction();

    // ======================================
    // CONSULTAR Y BLOQUEAR EL PEDIDO
    // ======================================

    const [filas] = await conexion.execute<RowDataPacket[]>(
      `
           SELECT
             id_solicitud,
             estado,
             estado_cancelacion
           FROM solicitudes
           WHERE id_solicitud = ?
           FOR UPDATE
         `,
      [idSolicitud],
    );

    const solicitud = filas[0];

    if (!solicitud) {
      throw new Error("La solicitud no existe");
    }

    // ======================================
    // VALIDAR CANCELACIÓN PENDIENTE
    // ======================================

    if (solicitud.estado_cancelacion !== "SOLICITADA") {
      throw new Error("La solicitud no tiene una cancelación pendiente");
    }

    // ======================================
    // VALIDAR ESTADO DEL PEDIDO
    // ======================================

    if (solicitud.estado !== "PENDIENTE" && solicitud.estado !== "ACEPTADA") {
      throw new Error("El pedido no se encuentra en un estado cancelable");
    }

    // ======================================
    // RECHAZAR LA CANCELACIÓN
    // ======================================

    await conexion.execute(
      `
         UPDATE solicitudes
         SET estado_cancelacion = 'RECHAZADA'
         WHERE id_solicitud = ?
       `,
      [idSolicitud],
    );

    await conexion.commit();
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}


// ==========================================
// TIPOS INTERNOS PARA COBRO DE SOLICITUDES
// ==========================================

export interface SolicitudParaCobro extends RowDataPacket {
  id_solicitud: number;
  id_usuario: number;
  folio: string | null;
  estado: Solicitud["estado"];
  estado_cancelacion: Solicitud["estado_cancelacion"];
  total: string;
}

export interface DetalleSolicitudParaCobro extends RowDataPacket {
  id_detalle: number;
  id_solicitud: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
}

interface VentaSolicitudRow extends RowDataPacket {
  id_venta: number;
}

// ==========================================
// CONSULTAR Y BLOQUEAR SOLICITUD PARA COBRO
// ==========================================

export async function consultarSolicitudParaCobro(
  idSolicitud: number,
  conexion: PoolConnection,
): Promise<SolicitudParaCobro | null> {
  const [filas] = await conexion.execute<SolicitudParaCobro[]>(
    `
      SELECT
        id_solicitud,
        id_usuario,
        folio,
        estado,
        estado_cancelacion,
        total
      FROM solicitudes
      WHERE id_solicitud = ?
      FOR UPDATE
    `,
    [idSolicitud],
  );

  return filas[0] ?? null;
}

// ==========================================
// CONSULTAR DETALLES CON PRECIOS ORIGINALES
// ==========================================

export async function consultarDetallesSolicitudParaCobro(
  idSolicitud: number,
  conexion: PoolConnection,
): Promise<DetalleSolicitudParaCobro[]> {
  const [filas] = await conexion.execute<DetalleSolicitudParaCobro[]>(
    `
      SELECT
        id_detalle,
        id_solicitud,
        id_producto,
        cantidad,
        precio_unitario,
        subtotal
      FROM detalle_solicitud
      WHERE id_solicitud = ?
      ORDER BY id_producto ASC, id_detalle ASC
      FOR UPDATE
    `,
    [idSolicitud],
  );

  return filas;
}

// ==========================================
// COMPROBAR SI LA SOLICITUD YA FUE COBRADA
// ==========================================

export async function consultarVentaPorSolicitud(
  idSolicitud: number,
  conexion: PoolConnection,
): Promise<number | null> {
  const [filas] = await conexion.execute<VentaSolicitudRow[]>(
    `
      SELECT id_venta
      FROM ventas
      WHERE id_solicitud = ?
      FOR UPDATE
    `,
    [idSolicitud],
  );

  return filas[0]?.id_venta ?? null;
}

// ==========================================
// MARCAR SOLICITUD ENTREGADA DESPUES DEL COBRO
// ==========================================

export async function marcarSolicitudEntregada(
  idSolicitud: number,
  conexion: PoolConnection,
): Promise<boolean> {
  // La venta y su movimiento de caja deben existir en la misma
  // transaccion antes de finalizar la entrega.
  const [resultado] = await conexion.execute<ResultSetHeader>(
    `
      UPDATE solicitudes AS s
      SET estado = 'ENTREGADA'
      WHERE s.id_solicitud = ?
        AND s.estado = 'LISTA'
        AND s.estado_cancelacion IN ('NINGUNA', 'RECHAZADA')
        AND EXISTS (
          SELECT 1
          FROM ventas AS v
          INNER JOIN movimientos_caja AS mc
            ON mc.id_venta = v.id_venta
            AND mc.id_caja = v.id_caja
          WHERE v.id_solicitud = s.id_solicitud
            AND v.metodo_pago = 'EFECTIVO'
            AND v.total = s.total
            AND mc.tipo = 'ENTRADA'
            AND mc.concepto = 'VENTA'
            AND mc.monto = v.total
        )
    `,
    [idSolicitud],
  );

  return resultado.affectedRows === 1;
}
