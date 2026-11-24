
import type { Request, Response } from "express";

import {
  ErrorReporte,
  obtenerReporteVentas,
  obtenerReporteInventario,
  obtenerReporteCaja,
  obtenerReporteSolicitudes,
} from "../services/reportes.service.js";

import type {
  RespuestaReporte,
} from "../types/reportes.js";

// ==========================================
// MANEJO DE ERRORES
// ==========================================

function manejarErrorReporte(
  error: unknown,
  res: Response,
): void {
  if (error instanceof ErrorReporte) {
    res.status(error.estado).json({
      mensaje: error.message,
    });

    return;
  }

  console.error("Error al generar reporte:", error);

  res.status(500).json({
    mensaje: "Ocurrió un error al generar el reporte",
  });
}

// ==========================================
// RESPUESTA GENERAL
// ==========================================

function responderReporte<T>(
  res: Response,
  mensaje: string,
  datos: T,
): void {
  const respuesta: RespuestaReporte<T> = {
    mensaje,
    datos,
  };

  res.status(200).json(respuesta);
}

// ==========================================
// REPORTE DE VENTAS
// ==========================================

export async function reporteVentasController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const reporte = await obtenerReporteVentas(
      fecha_inicio,
      fecha_fin,
    );

    responderReporte(
      res,
      "Reporte de ventas obtenido correctamente",
      reporte,
    );
  } catch (error) {
    manejarErrorReporte(error, res);
  }
}

// ==========================================
// REPORTE DE INVENTARIO
// ==========================================

export async function reporteInventarioController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const reporte = await obtenerReporteInventario(
      fecha_inicio,
      fecha_fin,
    );

    responderReporte(
      res,
      "Reporte de inventario obtenido correctamente",
      reporte,
    );
  } catch (error) {
    manejarErrorReporte(error, res);
  }
}

// ==========================================
// REPORTE DE CAJA
// ==========================================

export async function reporteCajaController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const reporte = await obtenerReporteCaja(
      fecha_inicio,
      fecha_fin,
    );

    responderReporte(
      res,
      "Reporte de caja obtenido correctamente",
      reporte,
    );
  } catch (error) {
    manejarErrorReporte(error, res);
  }
}

// ==========================================
// REPORTE DE SOLICITUDES
// ==========================================

export async function reporteSolicitudesController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    const reporte = await obtenerReporteSolicitudes(
      fecha_inicio,
      fecha_fin,
    );

    responderReporte(
      res,
      "Reporte de solicitudes obtenido correctamente",
      reporte,
    );
  } catch (error) {
    manejarErrorReporte(error, res);
  }
}
