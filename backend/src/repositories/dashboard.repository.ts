import type { RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";

// ==========================================
// TIPOS DE DATOS
// ==========================================

export interface ProductoStockBajo {
  id: number;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
}

export interface SolicitudReciente {
  id: number;
  cliente: string;
  fecha: string;
  estado: string;
}

export interface ResumenDashboard {
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
  const stockMinimo = 10;

  const [rows] = await pool.execute<
    (RowDataPacket & {
      id: number;
      nombre: string;
      stockActual: number;
    })[]
  >(
    `SELECT
       id_producto AS id,
       nombre,
       stock AS stockActual
     FROM productos
     WHERE disponible = 1
       AND stock <= ?
     ORDER BY stock ASC, nombre ASC
     LIMIT 5`,
    [stockMinimo],
  );

  return rows.map((producto) => ({
    id: producto.id,
    nombre: producto.nombre,
    stockActual: producto.stockActual,
    stockMinimo,
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
// RESUMEN GENERAL DEL DASHBOARD
// ==========================================

export async function obtenerResumenDashboard(): Promise<ResumenDashboard> {
  const [
    productosActivos,
    solicitudesPendientes,
    productosStockBajo,
    solicitudesRecientes,
  ] = await Promise.all([
    contarProductosActivos(),
    contarSolicitudesPendientes(),
    obtenerProductosStockBajo(),
    obtenerSolicitudesRecientes(),
  ]);

  return {
    productosActivos,
    solicitudesPendientes,
    productosStockBajo,
    solicitudesRecientes,
  };
}
