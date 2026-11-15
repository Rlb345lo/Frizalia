import type { RowDataPacket } from "mysql2";

import type {
  NuevoProducto,
  ActualizarProducto,
  NuevoMovimientoInventario,
} from "../types/inventario.js";

import {
  crearProducto,
  buscarProductoPorId,
  actualizarProducto,
} from "../repositories/productos.repository.js";

import {
  insertarMovimientoInventario,
  obtenerConexionInventario,
} from "../repositories/movimientosInventario.repository.js";

import { categoriaEstaActiva } from "../repositories/categorias.repository.js";

// ==========================================
// TIPOS DE RESULTADO
// ==========================================

export interface ResultadoCrearProducto {
  id_producto: number;
  mensaje: string;
}

export interface ResultadoEditarProducto {
  id_producto: number;
  mensaje: string;
}

export interface ResultadoMovimientoInventario {
  id_movimiento: number;
  id_producto: number;
  tipo: "ENTRADA" | "SALIDA" | "AJUSTE";
  stock_anterior: number;
  stock_actual: number;
  mensaje: string;
}

// ==========================================
// NUEVO: REABASTECIMIENTO MÚLTIPLE
// ==========================================

export interface ProductoReabastecimiento {
  id_producto: number;
  cantidad: number;
}

export interface NuevoReabastecimientoMultiple {
  productos: ProductoReabastecimiento[];
  motivo: string;
}

export interface DetalleReabastecimiento {
  id_movimiento: number;
  id_producto: number;
  cantidad: number;
  stock_anterior: number;
  stock_actual: number;
}

export interface ResultadoReabastecimientoMultiple {
  mensaje: string;
  productos_actualizados: number;
  unidades_agregadas: number;
  movimientos: DetalleReabastecimiento[];
}

const MAX_PRODUCTOS_POR_LOTE = 100;
const MAX_STOCK = 2147483647;

// ==========================================
// ERRORES CONTROLADOS
// ==========================================

export class ErrorInventario extends Error {
  constructor(
    mensaje: string,
    public readonly codigoHTTP: number = 400,
  ) {
    super(mensaje);
    this.name = "ErrorInventario";
  }
}

// ==========================================
// REGISTRAR PRODUCTO
// ==========================================

export async function registrarProductoInventario(
  datos: NuevoProducto,
  idUsuario: number,
): Promise<ResultadoCrearProducto> {
  const conexion = await obtenerConexionInventario();

  try {
    await conexion.beginTransaction();

    const [categorias] = await conexion.execute<RowDataPacket[]>(
      `
        SELECT id_categoria
        FROM categorias
        WHERE id_categoria = ?
          AND activa = 1
        LIMIT 1
      `,
      [datos.id_categoria],
    );

    if (categorias.length === 0) {
      throw new ErrorInventario(
        "La categoría seleccionada no existe o está desactivada.",
        400,
      );
    }

    const idProducto = await crearProducto(datos, conexion);

    if (datos.stock > 0) {
      await insertarMovimientoInventario(
        {
          id_producto: idProducto,
          id_usuario: idUsuario,
          id_solicitud: null,
          tipo: "ENTRADA",
          cantidad: datos.stock,
          motivo: "Registro de stock inicial del producto",
        },
        conexion,
      );
    }

    await conexion.commit();

    return {
      id_producto: idProducto,
      mensaje: "Producto registrado correctamente.",
    };
  } catch (error) {
    try {
      await conexion.rollback();
    } catch (errorRollback) {
      console.error("Error al revertir la transacción:", errorRollback);
    }

    throw error;
  } finally {
    conexion.release();
  }
}

// ==========================================
// EDITAR PRODUCTO
// ==========================================

export async function editarProductoInventario(
  idProducto: number,
  datos: ActualizarProducto,
): Promise<ResultadoEditarProducto> {
  const producto = await buscarProductoPorId(idProducto);

  if (!producto) {
    throw new ErrorInventario(
      "El producto que intentas editar no existe.",
      404,
    );
  }

  if (datos.id_categoria !== undefined) {
    const categoriaValida = await categoriaEstaActiva(datos.id_categoria);

    if (!categoriaValida) {
      throw new ErrorInventario(
        "La categoría seleccionada no existe o está desactivada.",
        400,
      );
    }
  }

  const actualizado = await actualizarProducto(idProducto, datos);

  if (!actualizado) {
    throw new ErrorInventario("No se pudo actualizar el producto.", 404);
  }

  return {
    id_producto: idProducto,
    mensaje: "Producto actualizado correctamente.",
  };
}

// ==========================================
// REGISTRAR MOVIMIENTO DE INVENTARIO
// ==========================================

export async function registrarMovimientoInventario(
  datos: NuevoMovimientoInventario,
  idUsuario: number,
): Promise<ResultadoMovimientoInventario> {
  const conexion = await obtenerConexionInventario();

  try {
    await conexion.beginTransaction();

    // Bloquear el producto durante la operación.
    const [productos] = await conexion.execute<RowDataPacket[]>(
      `
        SELECT id_producto, stock
        FROM productos
        WHERE id_producto = ?
        FOR UPDATE
      `,
      [datos.id_producto],
    );

    if (productos.length === 0) {
      throw new ErrorInventario("El producto no existe.", 404);
    }

    const stockAnterior = Number(productos[0].stock);

    let stockActual = stockAnterior;

    // ======================================
    // VALIDAR DATOS DEL MOVIMIENTO
    // ======================================

    if (
      !Number.isSafeInteger(idUsuario) ||
      idUsuario <= 0 ||
      !Number.isSafeInteger(datos.id_producto) ||
      datos.id_producto <= 0 ||
      !Number.isSafeInteger(datos.cantidad) ||
      datos.cantidad < 0 ||
      !["ENTRADA", "SALIDA", "AJUSTE"].includes(datos.tipo) ||
      typeof datos.motivo !== "string" ||
      datos.motivo.trim().length === 0 ||
      datos.motivo.trim().length > 255
    ) {
      throw new ErrorInventario(
        "Los datos del movimiento no son válidos.",
        400,
      );
    }

    // ======================================
    // CALCULAR NUEVO STOCK
    // ======================================

    switch (datos.tipo) {
      case "ENTRADA":
        if (datos.cantidad === 0) {
          throw new ErrorInventario(
            "La cantidad de entrada debe ser mayor a cero.",
            400,
          );
        }

        stockActual = stockAnterior + datos.cantidad;
        break;

      case "SALIDA":
        if (datos.cantidad === 0) {
          throw new ErrorInventario(
            "La cantidad de salida debe ser mayor a cero.",
            400,
          );
        }

        if (datos.cantidad > stockAnterior) {
          throw new ErrorInventario(
            "No hay existencias suficientes para realizar la salida.",
            400,
          );
        }

        stockActual = stockAnterior - datos.cantidad;
        break;

      case "AJUSTE":
        stockActual = datos.cantidad;
        break;
    }

    if (
      !Number.isSafeInteger(stockActual) ||
      stockActual < 0 ||
      stockActual > MAX_STOCK
    ) {
      throw new ErrorInventario(
        "El stock resultante está fuera del rango permitido.",
        400,
      );
    }

    // ======================================
    // ACTUALIZAR EXISTENCIAS
    // ======================================

    await conexion.execute(
      `
        UPDATE productos
        SET stock = ?
        WHERE id_producto = ?
      `,
      [stockActual, datos.id_producto],
    );

    // ======================================
    // REGISTRAR MOVIMIENTO EN HISTORIAL
    // ======================================

    const idMovimiento = await insertarMovimientoInventario(
      {
        id_producto: datos.id_producto,
        id_usuario: idUsuario,
        id_solicitud: null,
        tipo: datos.tipo,
        cantidad: datos.cantidad,
        motivo: datos.motivo.trim(),
      },
      conexion,
    );

    // ======================================
    // CONFIRMAR TRANSACCIÓN
    // ======================================

    await conexion.commit();

    return {
      id_movimiento: idMovimiento,
      id_producto: datos.id_producto,
      tipo: datos.tipo,
      stock_anterior: stockAnterior,
      stock_actual: stockActual,
      mensaje: "Movimiento de inventario registrado correctamente.",
    };
  } catch (error) {
    try {
      await conexion.rollback();
    } catch (errorRollback) {
      console.error("Error al revertir el movimiento:", errorRollback);
    }

    throw error;
  } finally {
    conexion.release();
  }
}

// ==========================================
// NUEVO: VALIDAR REABASTECIMIENTO MÚLTIPLE
// ==========================================

function validarReabastecimientoMultiple(
  datos: NuevoReabastecimientoMultiple,
  idUsuario: number,
): void {
  // Validar usuario.
  if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
    throw new ErrorInventario("El usuario no es válido.", 400);
  }

  // Validar estructura de la solicitud.
  if (
    !datos ||
    !Array.isArray(datos.productos) ||
    datos.productos.length === 0
  ) {
    throw new ErrorInventario("Debes seleccionar al menos un producto.", 400);
  }

  // Limitar cantidad de productos por operación.
  if (datos.productos.length > MAX_PRODUCTOS_POR_LOTE) {
    throw new ErrorInventario(
      `No puedes reabastecer más de ${MAX_PRODUCTOS_POR_LOTE} productos a la vez.`,
      400,
    );
  }

  // Validar motivo.
  if (
    typeof datos.motivo !== "string" ||
    datos.motivo.trim().length === 0 ||
    datos.motivo.trim().length > 255
  ) {
    throw new ErrorInventario(
      "El motivo debe contener entre 1 y 255 caracteres.",
      400,
    );
  }

  // Evitar seleccionar dos veces el mismo producto.
  const productosRegistrados = new Set<number>();

  for (const producto of datos.productos) {
    if (
      !producto ||
      !Number.isSafeInteger(producto.id_producto) ||
      producto.id_producto <= 0
    ) {
      throw new ErrorInventario(
        "Uno de los productos seleccionados no es válido.",
        400,
      );
    }

    if (
      !Number.isSafeInteger(producto.cantidad) ||
      producto.cantidad <= 0 ||
      producto.cantidad > MAX_STOCK
    ) {
      throw new ErrorInventario(
        "Todas las cantidades deben ser números enteros mayores a cero y estar dentro del rango permitido.",
        400,
      );
    }

    if (productosRegistrados.has(producto.id_producto)) {
      throw new ErrorInventario(
        `El producto #${producto.id_producto} está repetido.`,
        400,
      );
    }

    productosRegistrados.add(producto.id_producto);
  }
}

// ==========================================
// NUEVO: REGISTRAR REABASTECIMIENTO MÚLTIPLE
// ==========================================

export async function registrarReabastecimientoMultiple(
  datos: NuevoReabastecimientoMultiple,
  idUsuario: number,
): Promise<ResultadoReabastecimientoMultiple> {
  // ========================================
  // 1. VALIDAR ANTES DE ABRIR LA TRANSACCIÓN
  // ========================================

  validarReabastecimientoMultiple(datos, idUsuario);

  // Ordenamos por ID para adquirir los bloqueos
  // siempre en el mismo orden.
  const productosOrdenados = [...datos.productos].sort(
    (primero, segundo) => primero.id_producto - segundo.id_producto,
  );

  const motivo = datos.motivo.trim();

  const conexion = await obtenerConexionInventario();

  const movimientos: DetalleReabastecimiento[] = [];

  let unidadesAgregadas = 0;

  try {
    // ======================================
    // 2. INICIAR TRANSACCIÓN
    // ======================================

    await conexion.beginTransaction();

    // ======================================
    // 3. RECORRER PRODUCTOS SELECCIONADOS
    // ======================================

    for (const producto of productosOrdenados) {
      // ====================================
      // 3.1 BLOQUEAR PRODUCTO
      // ====================================

      const [productos] = await conexion.execute<RowDataPacket[]>(
        `
            SELECT id_producto, nombre, stock
            FROM productos
            WHERE id_producto = ?
            FOR UPDATE
          `,
        [producto.id_producto],
      );

      if (productos.length === 0) {
        throw new ErrorInventario(
          `El producto #${producto.id_producto} no existe.`,
          404,
        );
      }

      // ====================================
      // 3.2 CALCULAR NUEVO STOCK
      // ====================================

      const stockAnterior = Number(productos[0].stock);

      const stockActual = stockAnterior + producto.cantidad;

      if (
        !Number.isSafeInteger(stockActual) ||
        stockActual < 0 ||
        stockActual > MAX_STOCK
      ) {
        throw new ErrorInventario(
          `El stock del producto "${String(productos[0].nombre)}" supera el límite permitido.`,
          400,
        );
      }

      // ====================================
      // 3.3 ACTUALIZAR EXISTENCIAS
      // ====================================

      await conexion.execute(
        `
          UPDATE productos
          SET stock = ?
          WHERE id_producto = ?
        `,
        [stockActual, producto.id_producto],
      );

      // ====================================
      // 3.4 REGISTRAR EN EL HISTORIAL
      // ====================================

      const idMovimiento = await insertarMovimientoInventario(
        {
          id_producto: producto.id_producto,
          id_usuario: idUsuario,
          id_solicitud: null,
          tipo: "ENTRADA",
          cantidad: producto.cantidad,
          motivo,
        },
        conexion,
      );

      // ====================================
      // 3.5 GUARDAR RESULTADO
      // ====================================

      movimientos.push({
        id_movimiento: idMovimiento,
        id_producto: producto.id_producto,
        cantidad: producto.cantidad,
        stock_anterior: stockAnterior,
        stock_actual: stockActual,
      });

      unidadesAgregadas += producto.cantidad;
    }

    // ======================================
    // 4. CONFIRMAR TODOS LOS CAMBIOS
    // ======================================

    await conexion.commit();

    return {
      mensaje: "Reabastecimiento múltiple registrado correctamente.",
      productos_actualizados: movimientos.length,
      unidades_agregadas: unidadesAgregadas,
      movimientos,
    };
  } catch (error) {
    // ======================================
    // 5. CANCELAR TODO SI ALGO FALLA
    // ======================================

    try {
      await conexion.rollback();
    } catch (errorRollback) {
      console.error(
        "Error al revertir el reabastecimiento múltiple:",
        errorRollback,
      );
    }

    throw error;
  } finally {
    // ======================================
    // 6. LIBERAR CONEXIÓN
    // ======================================

    conexion.release();
  }
}
