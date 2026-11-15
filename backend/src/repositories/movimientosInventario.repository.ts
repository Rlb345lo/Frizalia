import type { PoolConnection, ResultSetHeader } from "mysql2/promise";

import type { RowDataPacket } from "mysql2";

import { pool } from "../config/database.js";

import type { TipoMovimientoInventario } from "../types/inventario.js";

// ==========================================
// DATOS PARA REGISTRAR UN MOVIMIENTO
// ==========================================

export interface DatosMovimientoInventario {
  id_producto: number;
  id_usuario: number;
  id_solicitud?: number | null;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  motivo: string;
}

// ==========================================
// ESTRUCTURA DEL HISTORIAL
// ==========================================

export interface MovimientoInventarioDetalle extends RowDataPacket {
  id_movimiento: number;
  id_producto: number;
  producto: string;
  id_usuario: number;
  id_solicitud: number | null;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  motivo: string;
  fecha_movimiento: Date;
}

// ==========================================
// INSERTAR MOVIMIENTO
// ==========================================

export async function insertarMovimientoInventario(
  datos: DatosMovimientoInventario,
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
        VALUES (?, ?, ?, ?, ?, ?)
      `,
    [
      datos.id_producto,
      datos.id_usuario,
      datos.id_solicitud ?? null,
      datos.tipo,
      datos.cantidad,
      datos.motivo,
    ],
  );

  return resultado.insertId;
}

// ==========================================
// OBTENER CONEXIÓN PARA TRANSACCIONES
// ==========================================

export async function obtenerConexionInventario(): Promise<PoolConnection> {
  return pool.getConnection();
}

// ==========================================
// CONSULTAR HISTORIAL GENERAL
// ==========================================

export async function listarMovimientosInventario(): Promise<
  MovimientoInventarioDetalle[]
> {
  const [movimientos] = await pool.query<MovimientoInventarioDetalle[]>(
    `
        SELECT
          m.id_movimiento,
          m.id_producto,
          p.nombre AS producto,
          m.id_usuario,
          m.id_solicitud,
          m.tipo,
          m.cantidad,
          m.motivo,
          m.fecha_movimiento
        FROM movimientos_inventario AS m
        INNER JOIN productos AS p
          ON m.id_producto = p.id_producto
        ORDER BY
          m.fecha_movimiento DESC,
          m.id_movimiento DESC
      `,
  );

  return movimientos;
}

// ==========================================
// CONSULTAR HISTORIAL POR PRODUCTO
// ==========================================

export async function listarMovimientosPorProducto(
  idProducto: number,
): Promise<MovimientoInventarioDetalle[]> {
  const [movimientos] = await pool.execute<MovimientoInventarioDetalle[]>(
    `
        SELECT
          m.id_movimiento,
          m.id_producto,
          p.nombre AS producto,
          m.id_usuario,
          m.id_solicitud,
          m.tipo,
          m.cantidad,
          m.motivo,
          m.fecha_movimiento
        FROM movimientos_inventario AS m
        INNER JOIN productos AS p
          ON m.id_producto = p.id_producto
        WHERE m.id_producto = ?
        ORDER BY
          m.fecha_movimiento DESC,
          m.id_movimiento DESC
      `,
    [idProducto],
  );

  return movimientos;
}
