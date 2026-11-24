
import type {
  TipoReporte,
  PeriodoReporte,
  RespuestaReporte,
  ReportesPorTipo,
  ReporteVentas,
  ReporteInventario,
  ReporteCaja,
  ReporteSolicitudes,
} from "../types/reportes";

// ==========================================
// CONFIGURACION
// ==========================================

const API_URL = "http://localhost:3000/api";

// ==========================================
// RESPUESTA DE ERROR
// ==========================================

interface RespuestaError {
  mensaje?: string;
  errores?: string[];
}

// ==========================================
// PROCESAR RESPUESTA
// ==========================================

async function procesarRespuesta<T>(
  respuesta: Response,
): Promise<T> {
  const datos: unknown = await respuesta.json();

  if (!respuesta.ok) {
    const error = datos as RespuestaError;

    const mensaje =
      error.errores?.join(", ") ||
      error.mensaje ||
      `Error HTTP ${respuesta.status}`;

    throw new Error(mensaje);
  }

  return datos as T;
}

// ==========================================
// HEADERS
// ==========================================

function obtenerHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ==========================================
// CONSULTA GENERAL DE REPORTES
// ==========================================

export async function obtenerReporte<
  T extends TipoReporte,
>(
  tipo: T,
  periodo: PeriodoReporte,
  token: string,
): Promise<ReportesPorTipo[T]> {
  const parametros = new URLSearchParams({
    fecha_inicio: periodo.fecha_inicio,
    fecha_fin: periodo.fecha_fin,
  });

  const respuesta = await fetch(
    `${API_URL}/reportes/${tipo}?${parametros.toString()}`,
    {
      method: "GET",
      headers: obtenerHeaders(token),
    },
  );

  const resultado = await procesarRespuesta<
    RespuestaReporte<ReportesPorTipo[T]>
  >(respuesta);

  return resultado.datos;
}

// ==========================================
// REPORTE DE VENTAS
// ==========================================

export async function obtenerReporteVentas(
  periodo: PeriodoReporte,
  token: string,
): Promise<ReporteVentas> {
  return obtenerReporte("ventas", periodo, token);
}

// ==========================================
// REPORTE DE INVENTARIO
// ==========================================

export async function obtenerReporteInventario(
  periodo: PeriodoReporte,
  token: string,
): Promise<ReporteInventario> {
  return obtenerReporte("inventario", periodo, token);
}

// ==========================================
// REPORTE DE CAJA
// ==========================================

export async function obtenerReporteCaja(
  periodo: PeriodoReporte,
  token: string,
): Promise<ReporteCaja> {
  return obtenerReporte("caja", periodo, token);
}

// ==========================================
// REPORTE DE SOLICITUDES
// ==========================================

export async function obtenerReporteSolicitudes(
  periodo: PeriodoReporte,
  token: string,
): Promise<ReporteSolicitudes> {
  return obtenerReporte("solicitudes", periodo, token);
}
