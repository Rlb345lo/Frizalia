import { randomUUID } from "node:crypto";

import {
  consultarCajaAbierta,
  consultarCajaPorId,
} from "../repositories/caja.repository.js";

import {
  consultarProductoParaVenta,
  consultarVentaCompleta,
  descontarStockVenta,
  insertarDetalleVenta,
  insertarVenta,
  listarHistorialVentas,
  obtenerConexionVentas,
  registrarIngresoCajaVenta,
  registrarSalidaInventarioVenta,
} from "../repositories/ventas.repository.js";

import type {
  HistorialVentas,
  NuevaVenta,
  ProductoValidadoVenta,
  ResultadoRegistroVenta,
  VentaConDetalles,
} from "../types/ventas.js";

// ==========================================
// CONSTANTES
// ==========================================

const MAXIMO_CENTAVOS = 9_999_999_999;
const MAXIMO_PRODUCTOS = 100;

// ==========================================
// ERROR DE NEGOCIO
// ==========================================

export class ErrorVenta extends Error {
  constructor(
    mensaje: string,
    public readonly codigoHTTP = 400,
  ) {
    super(mensaje);
    this.name = "ErrorVenta";
  }
}

// ==========================================
// UTILIDADES MONETARIAS
// ==========================================

// Convierte un DECIMAL de MySQL a centavos.
// Ejemplo: "25.50" -> 2550

function decimalACentavos(valor: string): number {
  if (!/^\d+(?:\.\d{1,2})?$/.test(valor)) {
    throw new ErrorVenta(
      "Se encontró un precio inválido en el inventario.",
      500,
    );
  }

  const [parteEntera, parteDecimal = ""] = valor.split(".");

  const centavos =
    Number(parteEntera) * 100 + Number(parteDecimal.padEnd(2, "0"));

  if (!Number.isSafeInteger(centavos) || centavos > MAXIMO_CENTAVOS) {
    throw new ErrorVenta(
      "El precio del producto supera el límite permitido.",
      400,
    );
  }

  return centavos;
}

// Convierte centavos a formato DECIMAL para MySQL.
// Ejemplo: 2550 -> "25.50"

function centavosADecimal(centavos: number): string {
  return (centavos / 100).toFixed(2);
}

// Valida un importe recibido desde el frontend.

function numeroACentavos(valor: number): number {
  if (typeof valor !== "number" || !Number.isFinite(valor) || valor < 0) {
    throw new ErrorVenta("El monto recibido debe ser un número válido.");
  }

  const centavos = Math.round(valor * 100);

  if (!Number.isSafeInteger(centavos) || centavos > MAXIMO_CENTAVOS) {
    throw new ErrorVenta("El monto recibido supera el límite permitido.");
  }

  if (Math.abs(valor - centavos / 100) > 1e-9) {
    throw new ErrorVenta("El monto recibido solo puede tener dos decimales.");
  }

  return centavos;
}

// ==========================================
// VALIDAR CARRITO
// ==========================================

function validarCarrito(datos: NuevaVenta): void {
  if (!datos || typeof datos !== "object" || !Array.isArray(datos.productos)) {
    throw new ErrorVenta("Debes enviar un carrito de productos válido.");
  }

  if (datos.productos.length === 0) {
    throw new ErrorVenta("No puedes registrar una venta con el carrito vacío.");
  }

  if (datos.productos.length > MAXIMO_PRODUCTOS) {
    throw new ErrorVenta("El carrito supera la cantidad máxima de productos.");
  }

  const productosRegistrados = new Set<number>();

  for (const producto of datos.productos) {
    if (
      !producto ||
      !Number.isSafeInteger(producto.id_producto) ||
      producto.id_producto <= 0
    ) {
      throw new ErrorVenta(
        "El carrito contiene un identificador de producto inválido.",
      );
    }

    if (!Number.isSafeInteger(producto.cantidad) || producto.cantidad <= 0) {
      throw new ErrorVenta(
        "Las cantidades deben ser números enteros mayores que cero.",
      );
    }

    if (productosRegistrados.has(producto.id_producto)) {
      throw new ErrorVenta("El carrito contiene productos repetidos.");
    }

    productosRegistrados.add(producto.id_producto);
  }

  if (datos.metodo_pago !== "EFECTIVO" && datos.metodo_pago !== "TARJETA") {
    throw new ErrorVenta("El método de pago debe ser EFECTIVO o TARJETA.");
  }

  if (datos.metodo_pago === "EFECTIVO") {
    if (datos.monto_recibido === undefined) {
      throw new ErrorVenta(
        "Debes indicar el monto recibido para pagos en efectivo.",
      );
    }

    numeroACentavos(datos.monto_recibido);
  }
}

// ==========================================
// GENERAR FOLIO
// ==========================================

function generarFolioVenta(): string {
  const identificador = randomUUID()
    .replaceAll("-", "")
    .slice(0, 20)
    .toUpperCase();

  return `V-${identificador}`;
}

// ==========================================
// REGISTRAR VENTA
// ==========================================

export async function registrarVenta(
  datos: NuevaVenta,
  idUsuario: number,
): Promise<ResultadoRegistroVenta> {
  // ========================================
  // VALIDACIONES INICIALES
  // ========================================

  validarCarrito(datos);

  if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
    throw new ErrorVenta("No se pudo identificar al usuario.", 401);
  }

  // Ordenar productos para bloquearlos siempre
  // en el mismo orden y reducir interbloqueos.

  const carritoOrdenado = [...datos.productos].sort(
    (a, b) => a.id_producto - b.id_producto,
  );

  const conexion = await obtenerConexionVentas();

  let transaccionIniciada = false;

  try {
    // ======================================
    // INICIAR TRANSACCION
    // ======================================

    await conexion.beginTransaction();
    transaccionIniciada = true;

    // ======================================
    // VERIFICAR CAJA ABIERTA
    // ======================================

    const cajaActual = await consultarCajaAbierta(conexion);

    if (!cajaActual) {
      throw new ErrorVenta(
        "Debes abrir una caja antes de registrar ventas.",
        409,
      );
    }

    // Bloquear la caja para impedir que se cierre
    // mientras se registra esta venta.

    const cajaBloqueada = await consultarCajaPorId(
      cajaActual.id_caja,
      conexion,
      true,
    );

    if (!cajaBloqueada || cajaBloqueada.estado !== "ABIERTA") {
      throw new ErrorVenta("La caja ya no se encuentra abierta.", 409);
    }

    // ======================================
    // VALIDAR PRODUCTOS Y STOCK
    // ======================================

    const productosValidados: ProductoValidadoVenta[] = [];

    let totalCentavos = 0;

    for (const item of carritoOrdenado) {
      const producto = await consultarProductoParaVenta(
        item.id_producto,
        conexion,
      );

      if (!producto) {
        throw new ErrorVenta(
          `El producto #${item.id_producto} no existe.`,
          404,
        );
      }

      if (producto.disponible !== 1) {
        throw new ErrorVenta(
          `El producto "${producto.nombre}" no está disponible.`,
          409,
        );
      }

      if (producto.stock < item.cantidad) {
        throw new ErrorVenta(
          `Stock insuficiente para "${producto.nombre}". ` +
            `Disponibles: ${producto.stock}.`,
          409,
        );
      }

      const precioCentavos = decimalACentavos(producto.precio);

      if (precioCentavos <= 0) {
        throw new ErrorVenta(
          `El producto "${producto.nombre}" no tiene un precio válido.`,
          409,
        );
      }

      const subtotalCentavos = precioCentavos * item.cantidad;

      if (
        !Number.isSafeInteger(subtotalCentavos) ||
        subtotalCentavos > MAXIMO_CENTAVOS
      ) {
        throw new ErrorVenta(
          "El subtotal de la venta supera el límite permitido.",
        );
      }

      totalCentavos += subtotalCentavos;

      if (totalCentavos > MAXIMO_CENTAVOS) {
        throw new ErrorVenta(
          "El total de la venta supera el límite permitido.",
        );
      }

      productosValidados.push({
        id_producto: producto.id_producto,
        nombre: producto.nombre,
        presentacion: producto.presentacion,
        precio_unitario: centavosADecimal(precioCentavos),
        cantidad: item.cantidad,
        subtotal: centavosADecimal(subtotalCentavos),
      });
    }

    // ======================================
    // CALCULAR PAGO Y CAMBIO
    // ======================================

    let recibidoCentavos = totalCentavos;
    let cambioCentavos = 0;

    if (datos.metodo_pago === "EFECTIVO") {
      recibidoCentavos = numeroACentavos(datos.monto_recibido!);

      if (recibidoCentavos < totalCentavos) {
        throw new ErrorVenta(
          "El monto recibido es menor que el total de la venta.",
        );
      }

      cambioCentavos = recibidoCentavos - totalCentavos;
    }

    const total = centavosADecimal(totalCentavos);

    const montoRecibido = centavosADecimal(recibidoCentavos);

    const cambio = centavosADecimal(cambioCentavos);

    // ======================================
    // REGISTRAR VENTA
    // ======================================

    const folio = generarFolioVenta();

    const idVenta = await insertarVenta(
      cajaBloqueada.id_caja,
      idUsuario,
      folio,
      total,
      datos.metodo_pago,
      montoRecibido,
      cambio,
      conexion,
    );

    // ======================================
    // REGISTRAR DETALLES Y DESCONTAR STOCK
    // ======================================

    for (const producto of productosValidados) {
      await insertarDetalleVenta(
        idVenta,
        producto.id_producto,
        producto.cantidad,
        producto.precio_unitario,
        producto.subtotal,
        conexion,
      );

      const stockDescontado = await descontarStockVenta(
        producto.id_producto,
        producto.cantidad,
        conexion,
      );

      if (!stockDescontado) {
        throw new ErrorVenta(
          `No se pudo descontar el stock de "${producto.nombre}".`,
          409,
        );
      }

      await registrarSalidaInventarioVenta(
        producto.id_producto,
        idUsuario,
        producto.cantidad,
        folio,
        conexion,
      );
    }

    // ======================================
    // REGISTRAR INGRESO EN CAJA
    // ======================================

    if (datos.metodo_pago === "EFECTIVO") {
      // Solo entra a caja el total vendido.
      // El cambio entregado no es un ingreso.

      await registrarIngresoCajaVenta(
        cajaBloqueada.id_caja,
        idUsuario,
        idVenta,
        total,
        folio,
        conexion,
      );
    }

    // ======================================
    // CONSULTAR RESULTADO
    // ======================================

    const ventaCompleta = await consultarVentaCompleta(idVenta, conexion);

    if (!ventaCompleta) {
      throw new Error("No se pudo recuperar la venta registrada.");
    }

    // ======================================
    // CONFIRMAR TRANSACCION
    // ======================================

    await conexion.commit();
    transaccionIniciada = false;

    return {
      mensaje: "Venta registrada correctamente.",
      venta: ventaCompleta.venta,
      detalles: ventaCompleta.detalles,
    };
  } catch (error) {
    // ======================================
    // REVERTIR TRANSACCION
    // ======================================

    if (transaccionIniciada) {
      try {
        await conexion.rollback();
      } catch (errorRollback) {
        console.error(
          "No se pudo revertir la transacción de venta:",
          errorRollback,
        );
      }
    }

    throw error;
  } finally {
    // ======================================
    // LIBERAR CONEXION
    // ======================================

    conexion.release();
  }
}

// ==========================================
// CONSULTAR VENTA POR ID
// ==========================================

export async function obtenerVentaPorId(
  idVenta: number,
): Promise<VentaConDetalles> {
  if (!Number.isSafeInteger(idVenta) || idVenta <= 0) {
    throw new ErrorVenta("El identificador de venta no es válido.");
  }

  const resultado = await consultarVentaCompleta(idVenta);

  if (!resultado) {
    throw new ErrorVenta("La venta solicitada no existe.", 404);
  }

  return resultado;
}

// ==========================================
// CONSULTAR HISTORIAL DE VENTAS
// ==========================================

export async function obtenerHistorialVentas(): Promise<HistorialVentas> {
  return listarHistorialVentas();
}
