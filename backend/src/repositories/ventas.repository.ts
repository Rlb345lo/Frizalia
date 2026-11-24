import type { ResultSetHeader, RowDataPacket } from "mysql2";

import type { PoolConnection } from "mysql2/promise";

import { pool } from "../config/database.js";

import type {
  DetalleVentaProducto,
  HistorialVentas,
  MetodoPagoVenta,
  Venta,
  VentaConDetalles,
} from "../types/ventas.js";

// ==========================================
// TIPOS INTERNOS
// ==========================================

export interface ProductoParaVenta extends RowDataPacket {
  id_producto: number;
  nombre: string;
  presentacion: string | null;
  precio: string;
  stock: number;
  disponible: number;
}

type VentaRow = Venta & RowDataPacket;

type DetalleVentaRow = DetalleVentaProducto & RowDataPacket;

// ==========================================
// OBTENER CONEXION PARA TRANSACCIONES
// ==========================================

export async function obtenerConexionVentas(): Promise<PoolConnection> {
  return pool.getConnection();
}

// ==========================================
// CONSULTAR Y BLOQUEAR PRODUCTO
// ==========================================

export async function consultarProductoParaVenta(
  idProducto: number,
  conexion: PoolConnection,
): Promise<ProductoParaVenta | null> {
  const [filas] = await conexion.execute<ProductoParaVenta[]>(
    `
      SELECT
        id_producto,
        nombre,
        presentacion,
        precio,
        stock,
        disponible
      FROM productos
      WHERE id_producto = ?
      FOR UPDATE
    `,
    [idProducto],
  );

  return filas[0] ?? null;
}

// ==========================================
// DESCONTAR STOCK DE UNA VENTA
// ==========================================

export async function descontarStockVenta(
  idProducto: number,
  cantidad: number,
  conexion: PoolConnection,
): Promise<boolean> {
  const [resultado] = await conexion.execute<ResultSetHeader>(
    `
      UPDATE productos
      SET stock = stock - ?
      WHERE
        id_producto = ?
        AND disponible = 1
        AND stock >= ?
    `,
    [cantidad, idProducto, cantidad],
  );

  return resultado.affectedRows === 1;
}

// ==========================================
// REGISTRAR NUEVA VENTA
// ==========================================

export async function insertarVenta(
  idCaja: number,
  idUsuario: number,
  folio: string,
  total: string,
  metodoPago: MetodoPagoVenta,
  montoRecibido: string,
  cambio: string,
  conexion: PoolConnection,
  idSolicitud: number | null = null,
): Promise<number> {
  const [resultado] = await conexion.execute<ResultSetHeader>(
    `
      INSERT INTO ventas (
        id_caja,
        id_usuario,
        id_solicitud,
        folio,
        total,
        metodo_pago,
        monto_recibido,
        cambio
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      idCaja,
      idUsuario,
      idSolicitud,
      folio,
      total,
      metodoPago,
      montoRecibido,
      cambio,
    ],
  );

  return resultado.insertId;
}

// ==========================================
// REGISTRAR DETALLE DE VENTA
// ==========================================

export async function insertarDetalleVenta(
  idVenta: number,
  idProducto: number,
  cantidad: number,
  precioUnitario: string,
  subtotal: string,
  conexion: PoolConnection,
): Promise<number> {
  const [resultado] = await conexion.execute<ResultSetHeader>(
    `
      INSERT INTO detalle_venta (
        id_venta,
        id_producto,
        cantidad,
        precio_unitario,
        subtotal
      )
      VALUES (?, ?, ?, ?, ?)
    `,
    [idVenta, idProducto, cantidad, precioUnitario, subtotal],
  );

  return resultado.insertId;
}

// ==========================================
// REGISTRAR SALIDA DE INVENTARIO
// ==========================================

export async function registrarSalidaInventarioVenta(
  idProducto: number,
  idUsuario: number,
  cantidad: number,
  folio: string,
  conexion: PoolConnection,
): Promise<number> {
  const [resultado] = await conexion.execute<ResultSetHeader>(
    `
      INSERT INTO movimientos_inventario (
        id_producto,
        id_usuario,
        id_solicitud,
        tipo,
        cantidad,
        motivo
      )
      VALUES (?, ?, NULL, 'SALIDA', ?, ?)
    `,
    [idProducto, idUsuario, cantidad, `Venta ${folio}`],
  );

  return resultado.insertId;
}

// ==========================================
// REGISTRAR INGRESO DE EFECTIVO EN CAJA
// ==========================================

export async function registrarIngresoCajaVenta(
  idCaja: number,
  idUsuario: number,
  idVenta: number,
  total: string,
  folio: string,
  conexion: PoolConnection,
): Promise<number> {
  const [resultado] = await conexion.execute<ResultSetHeader>(
    `
      INSERT INTO movimientos_caja (
        id_caja,
        id_usuario,
        id_venta,
        tipo,
        concepto,
        monto,
        motivo
      )
      VALUES (
        ?, ?, ?,
        'ENTRADA',
        'VENTA',
        ?, ?
      )
    `,
    [idCaja, idUsuario, idVenta, total, `Cobro de venta ${folio}`],
  );

  return resultado.insertId;
}

// ==========================================
// CONSULTAR VENTA POR ID
// ==========================================

export async function consultarVentaPorId(
  idVenta: number,
  conexion?: PoolConnection,
): Promise<Venta | null> {
  const db = conexion ?? pool;

  const [filas] = await db.execute<VentaRow[]>(
    `
      SELECT
        id_venta,
        id_caja,
        id_usuario,
        id_solicitud,
        folio,
        total,
        metodo_pago,
        monto_recibido,
        cambio,
        DATE_FORMAT(
          fecha_venta,
          '%Y-%m-%d %H:%i:%s'
        ) AS fecha_venta
      FROM ventas
      WHERE id_venta = ?
      LIMIT 1
    `,
    [idVenta],
  );

  return filas[0] ?? null;
}

// ==========================================
// CONSULTAR DETALLES DE UNA VENTA
// ==========================================

export async function consultarDetallesVenta(
  idVenta: number,
  conexion?: PoolConnection,
): Promise<DetalleVentaProducto[]> {
  const db = conexion ?? pool;

  const [filas] = await db.execute<DetalleVentaRow[]>(
    `
      SELECT
        d.id_detalle_venta,
        d.id_venta,
        d.id_producto,
        d.cantidad,
        d.precio_unitario,
        d.subtotal,
        p.nombre AS producto,
        p.presentacion
      FROM detalle_venta AS d
      INNER JOIN productos AS p
        ON d.id_producto = p.id_producto
      WHERE d.id_venta = ?
      ORDER BY d.id_detalle_venta ASC
    `,
    [idVenta],
  );

  return filas;
}

// ==========================================
// CONSULTAR VENTA COMPLETA
// ==========================================

export async function consultarVentaCompleta(
  idVenta: number,
  conexion?: PoolConnection,
): Promise<VentaConDetalles | null> {
  const venta = await consultarVentaPorId(idVenta, conexion);

  if (!venta) {
    return null;
  }

  const detalles = await consultarDetallesVenta(idVenta, conexion);

  return {
    venta,
    detalles,
  };
}

// ==========================================
// CONSULTAR HISTORIAL DE VENTAS
// ==========================================

export async function listarHistorialVentas(): Promise<HistorialVentas> {
  const [filas] = await pool.query<VentaRow[]>(
    `
      SELECT
        id_venta,
        id_caja,
        id_usuario,
        id_solicitud,
        folio,
        total,
        metodo_pago,
        monto_recibido,
        cambio,
        DATE_FORMAT(
          fecha_venta,
          '%Y-%m-%d %H:%i:%s'
        ) AS fecha_venta
      FROM ventas
      ORDER BY
        fecha_venta DESC,
        id_venta DESC
    `,
  );

  return {
    ventas: filas,
    total: filas.length,
  };
}
