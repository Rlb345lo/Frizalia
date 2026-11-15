import type { Request, Response } from "express";

import { obtenerResumenDashboard } from "../repositories/dashboard.repository.js";

// ==========================================
// OBTENER RESUMEN DEL DASHBOARD
// ==========================================

export async function obtenerResumen(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    // Consultar estadísticas en MySQL
    const resumen = await obtenerResumenDashboard();

    // Devolver información al frontend
    res.status(200).json({
      mensaje: "Resumen del Dashboard obtenido correctamente",
      datos: resumen,
    });
  } catch (error) {
    console.error("Error al obtener el resumen del Dashboard:", error);

    res.status(500).json({
      mensaje: "Error al obtener las estadísticas del Dashboard",
    });
  }
}
