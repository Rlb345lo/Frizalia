import type { RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";

// ==========================================
// TIPOS DE DATOS
// ==========================================

export interface ProductoStockBajo {
  id: number;
  nombre: string;
  presentacion: string;
  stockActual: number;
  stockMinimo: number;
}

export interface SolicitudReciente {
  id: number;
  cliente: string;
  fecha: string;
  estado: string;
}

export interface VentaDiaria {
  dia: string;
  total: number;
}

export interface CajaDashboard {
  idCaja: number;
  efectivoEsperado: number;
}

export interface ResumenDashboard {
  ventasHoy: number;
  ingresosHoy: number;
  ventasSemanales: VentaDiaria[];
  cajaActual: CajaDashboard | null;
  productosActivos: number;
  solicitudesPendientes: number;
  productosStockBajo: ProductoStockBajo[];
  solicitudesRecientes: SolicitudReciente[];
}

// ==========================================
// PRODUCTOS ACTIVOS
// ==========================================

export async function contarProductosActivos(): Promise<number> {
  const [rows] = await pool.execute<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total
     FROM productos
     WHERE disponible = 1`,
  );

  return Number(rows[0]?.total ?? 0);
}

// ==========================================
// SOLICITUDES PENDIENTES
// ==========================================

export async function contarSolicitudesPendientes(): Promise<number> {
  const [rows] = await pool.execute<(RowDataPacket & { total: number })[]>(
    `SELECT COUNT(*) AS total
     FROM solicitudes
     WHERE estado = 'PENDIENTE'`,
  );

  return Number(rows[0]?.total ?? 0);
}

// ==========================================
// PRODUCTOS CON STOCK BAJO
// ==========================================

export async function obtenerProductosStockBajo(): Promise<
  ProductoStockBajo[]
> {
  const [rows] = await pool.execute<(RowDataPacket & ProductoStockBajo)[]>(
    `SELECT id_producto AS id, nombre,
            COALESCE(NULLIF(TRIM(presentacion), ''), 'Sin presentación') AS presentacion,
            stock AS stockActual, stock_minimo AS stockMinimo
     FROM productos
     WHERE disponible = 1 AND stock <= stock_minimo
     ORDER BY stock ASC, nombre ASC, id_producto ASC
     LIMIT 5`,
  );

  return rows.map(({ id, nombre, presentacion, stockActual, stockMinimo }) => ({
    id, nombre, presentacion, stockActual, stockMinimo,
  }));
}

// ==========================================
// SOLICITUDES RECIENTES
// ==========================================

export async function obtenerSolicitudesRecientes(): Promise<
  SolicitudReciente[]
> {
  const [rows] = await pool.execute<(RowDataPacket & SolicitudReciente)[]>(
    `SELECT
       s.id_solicitud AS id,
       u.nombre AS cliente,
       s.fecha_solicitud AS fecha,
       s.estado
     FROM solicitudes AS s
     INNER JOIN usuarios AS u
       ON u.id_usuario = s.id_usuario
     ORDER BY s.fecha_solicitud DESC,
              s.id_solicitud DESC
     LIMIT 5`,
  );

  return rows;
}

// ==========================================
// VENTAS DE LOS ÚLTIMOS SIETE DÍAS
// ==========================================

async function obtenerVentasDashboard(): Promise<{
  ventasHoy: number;
  ingresosHoy: number;
  ventasSemanales: VentaDiaria[];
}> {
  const [rows] = await pool.execute<
    (RowDataPacket & { diaSemana: number; cantidad: number; total: string | number })[]
  >(
    `WITH RECURSIVE dias AS (
       SELECT CURRENT_DATE - INTERVAL 6 DAY AS fecha
       UNION ALL
       SELECT fecha + INTERVAL 1 DAY FROM dias WHERE fecha < CURRENT_DATE
     )
     SELECT WEEKDAY(d.fecha) AS diaSemana,
            COUNT(v.id_venta) AS cantidad,
            COALESCE(SUM(v.total), 0) AS total
     FROM dias AS d
     LEFT JOIN ventas AS v
       ON v.fecha_venta >= d.fecha
      AND v.fecha_venta < d.fecha + INTERVAL 1 DAY
     GROUP BY d.fecha
     ORDER BY d.fecha ASC`,
  );

  const nombresDias = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  const hoy = rows[rows.length - 1];

  return {
    ventasHoy: Number(hoy?.cantidad ?? 0),
    ingresosHoy: Number(hoy?.total ?? 0),
    ventasSemanales: rows.map((fila) => ({
      dia: nombresDias[fila.diaSemana] ?? "—",
      total: Number(fila.total),
    })),
  };
}

// ==========================================
// ESTADO DE CAJA Y EFECTIVO ESPERADO
// ==========================================

async function obtenerCajaDashboard(): Promise<CajaDashboard | null> {
  const [rows] = await pool.execute<
    (RowDataPacket & { idCaja: number; efectivoEsperado: string | number })[]
  >(
    `SELECT c.id_caja AS idCaja,
            c.fondo_inicial + COALESCE((
              SELECT SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.monto ELSE -m.monto END)
              FROM movimientos_caja AS m
              WHERE m.id_caja = c.id_caja
            ), 0) AS efectivoEsperado
     FROM cajas AS c
     WHERE c.estado = 'ABIERTA'
     ORDER BY c.fecha_apertura DESC, c.id_caja DESC
     LIMIT 1`,
  );

  const caja = rows[0];
  return caja ? { idCaja: caja.idCaja, efectivoEsperado: Number(caja.efectivoEsperado) } : null;
}

// ==========================================
// RESUMEN GENERAL DEL DASHBOARD
// ==========================================

export async function obtenerResumenDashboard(): Promise<ResumenDashboard> {
  const [
    ventas,
    cajaActual,
    productosActivos,
    solicitudesPendientes,
    productosStockBajo,
    solicitudesRecientes,
  ] = await Promise.all([
    obtenerVentasDashboard(),
    obtenerCajaDashboard(),
    contarProductosActivos(),
    contarSolicitudesPendientes(),
    obtenerProductosStockBajo(),
    obtenerSolicitudesRecientes(),
  ]);

  return {
    ...ventas,
    cajaActual,
    productosActivos,
    solicitudesPendientes,
    productosStockBajo,
    solicitudesRecientes,
  };
}
