import type { PoolConnection, ResultSetHeader } from "mysql2/promise";

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
