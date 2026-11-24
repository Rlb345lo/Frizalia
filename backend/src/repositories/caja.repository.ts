
import type {
  PoolConnection,
  ResultSetHeader,
} from "mysql2/promise";

import type { RowDataPacket } from "mysql2";

import { pool } from "../config/database.js";

import type {
  Caja,
  MovimientoCaja,
} from "../types/caja.js";

// ==========================================
// TIPOS INTERNOS DEL REPOSITORIO
// ==========================================

type CajaRow = Caja & RowDataPacket;

type MovimientoCajaRow = MovimientoCaja & RowDataPacket;

interface TotalesCajaRow extends RowDataPacket {
  total_entradas: string;
  total_salidas: string;
}

interface ConteoCajasRow extends RowDataPacket {
  total: number;
}

interface BloqueoCajaRow extends RowDataPacket {
  adquirido: number | null;
}

interface LiberacionBloqueoRow extends RowDataPacket {
  liberado: number | null;
}

// ==========================================
// CAMPOS PARA CONSULTAR CAJAS
// ==========================================

const CAMPOS_CAJA = `
  id_caja,
  id_usuario_apertura,
  id_usuario_cierre,

  DATE_FORMAT(
    fecha_apertura,
    '%Y-%m-%d %H:%i:%s'
  ) AS fecha_apertura,

  DATE_FORMAT(
    fecha_cierre,
    '%Y-%m-%d %H:%i:%s'
  ) AS fecha_cierre,

  fondo_inicial,
  monto_esperado,
  monto_real,
  diferencia,
  estado,
  observaciones
`;

// ==========================================
// OBTENER CONEXION PARA TRANSACCIONES
// ==========================================

export async function obtenerConexionCaja():
  Promise<PoolConnection> {
  return pool.getConnection();
}

// ==========================================
// BLOQUEO PARA EVITAR APERTURAS SIMULTANEAS
// ==========================================

const NOMBRE_BLOQUEO = "frizalia_apertura_caja";

export async function adquirirBloqueoAperturaCaja(
  conexion: PoolConnection,
): Promise<boolean> {
  const [filas] = await conexion.execute<BloqueoCajaRow[]>(
    "SELECT GET_LOCK(?, 10) AS adquirido",
    [NOMBRE_BLOQUEO],
  );

  return filas[0]?.adquirido === 1;
}

export async function liberarBloqueoAperturaCaja(
  conexion: PoolConnection,
): Promise<void> {
  const [filas] = await conexion.execute<
    LiberacionBloqueoRow[]
  >(
    "SELECT RELEASE_LOCK(?) AS liberado",
    [NOMBRE_BLOQUEO],
  );

  if (filas[0]?.liberado !== 1) {
    throw new Error(
      "No se pudo liberar el bloqueo de apertura de caja.",
    );
  }
}

// ==========================================
// CONSULTAR CAJA ABIERTA
// ==========================================

export async function consultarCajaAbierta(
  conexion?: PoolConnection,
): Promise<Caja | null> {
  const db = conexion ?? pool;

  const [filas] = await db.query<CajaRow[]>(
    `
      SELECT ${CAMPOS_CAJA}
      FROM cajas
      WHERE estado = 'ABIERTA'
      ORDER BY id_caja DESC
      LIMIT 1
    `,
  );

  return filas[0] ?? null;
}

// ==========================================
// CONSULTAR CAJA POR ID
// ==========================================

export async function consultarCajaPorId(
  idCaja: number,
  conexion?: PoolConnection,
  bloquear = false,
): Promise<Caja | null> {
  const db = conexion ?? pool;

  const bloqueoSQL = bloquear ? "FOR UPDATE" : "";

  const [filas] = await db.execute<CajaRow[]>(
    `
      SELECT ${CAMPOS_CAJA}
      FROM cajas
      WHERE id_caja = ?
      ${bloqueoSQL}
    `,
    [idCaja],
  );

  return filas[0] ?? null;
}

// ==========================================
// REGISTRAR APERTURA DE CAJA
// ==========================================

export async function crearAperturaCaja(
  idUsuario: number,
  fondoInicial: number,
  conexion: PoolConnection,
): Promise<number> {
  const [resultado] =
    await conexion.execute<ResultSetHeader>(
      `
        INSERT INTO cajas (
          id_usuario_apertura,
          fondo_inicial,
          estado
        )
        VALUES (?, ?, 'ABIERTA')
      `,
      [idUsuario, fondoInicial],
    );

  return resultado.insertId;
}

// ==========================================
// CONSULTAR TOTALES DE MOVIMIENTOS
// ==========================================

export async function consultarTotalesCaja(
  idCaja: number,
  conexion?: PoolConnection,
): Promise<{
  total_entradas: string;
  total_salidas: string;
}> {
  const db = conexion ?? pool;

  const [filas] = await db.execute<TotalesCajaRow[]>(
    `
      SELECT
        COALESCE(
          SUM(
            CASE
              WHEN tipo = 'ENTRADA' THEN monto
              ELSE 0
            END
          ),
          0
        ) AS total_entradas,

        COALESCE(
          SUM(
            CASE
              WHEN tipo = 'SALIDA' THEN monto
              ELSE 0
            END
          ),
          0
        ) AS total_salidas

      FROM movimientos_caja
      WHERE id_caja = ?
    `,
    [idCaja],
  );

  return {
    total_entradas: filas[0]?.total_entradas ?? "0.00",
    total_salidas: filas[0]?.total_salidas ?? "0.00",
  };
}

// ==========================================
// LISTAR MOVIMIENTOS DE UNA CAJA
// ==========================================

export async function listarMovimientosCaja(
  idCaja: number,
  conexion?: PoolConnection,
): Promise<MovimientoCaja[]> {
  const db = conexion ?? pool;

  const [filas] = await db.execute<MovimientoCajaRow[]>(
    `
      SELECT
        id_movimiento_caja,
        id_caja,
        id_usuario,
        id_venta,
        tipo,
        concepto,
        monto,
        motivo,

        DATE_FORMAT(
          fecha_movimiento,
          '%Y-%m-%d %H:%i:%s'
        ) AS fecha_movimiento

      FROM movimientos_caja

      WHERE id_caja = ?

      ORDER BY
        fecha_movimiento DESC,
        id_movimiento_caja DESC
    `,
    [idCaja],
  );

  return filas;
}

// ==========================================
// REGISTRAR CIERRE DE CAJA
// ==========================================

export async function actualizarCierreCaja(
  idCaja: number,
  idUsuario: number,
  montoEsperado: string,
  montoReal: string,
  diferencia: string,
  observaciones: string | null,
  conexion: PoolConnection,
): Promise<boolean> {
  const [resultado] =
    await conexion.execute<ResultSetHeader>(
      `
        UPDATE cajas
        SET
          id_usuario_cierre = ?,
          fecha_cierre = CURRENT_TIMESTAMP,
          monto_esperado = ?,
          monto_real = ?,
          diferencia = ?,
          estado = 'CERRADA',
          observaciones = ?

        WHERE
          id_caja = ?
          AND estado = 'ABIERTA'
      `,
      [
        idUsuario,
        montoEsperado,
        montoReal,
        diferencia,
        observaciones,
        idCaja,
      ],
    );

  return resultado.affectedRows === 1;
}

// ==========================================
// CONSULTAR HISTORIAL DE CAJAS
// ==========================================

export async function listarHistorialCajas():
  Promise<Caja[]> {
  const [filas] = await pool.query<CajaRow[]>(
    `
      SELECT ${CAMPOS_CAJA}
      FROM cajas
      ORDER BY
        fecha_apertura DESC,
        id_caja DESC
    `,
  );

  return filas;
}

// ==========================================
// CONTAR CAJAS REGISTRADAS
// ==========================================

export async function contarCajas(): Promise<number> {
  const [filas] = await pool.query<ConteoCajasRow[]>(
    `
      SELECT COUNT(*) AS total
      FROM cajas
    `,
  );

  return filas[0]?.total ?? 0;
}
