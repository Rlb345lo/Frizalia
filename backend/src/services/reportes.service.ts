
import {
  consultarReporteVentas,
  consultarReporteInventario,
  consultarReporteCaja,
  consultarReporteSolicitudes,
} from "../repositories/reportes.repository.js";

import type {
  PeriodoReporte,
  ReporteVentas,
  ReporteInventario,
  ReporteCaja,
  ReporteSolicitudes,
} from "../types/reportes.js";

// ==========================================
// CONSTANTES
// ==========================================

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

const MAXIMO_DIAS_REPORTE = 366;

const MILISEGUNDOS_POR_DIA = 86_400_000;

// ==========================================
// ERROR PERSONALIZADO
// ==========================================

export class ErrorReporte extends Error {
  public readonly estado: number;

  constructor(estado: number, mensaje: string) {
    super(mensaje);

    this.name = "ErrorReporte";
    this.estado = estado;
  }
}

// ==========================================
// VALIDAR FECHA
// ==========================================

function validarFecha(
  valor: unknown,
  campo: string,
): string {
  if (typeof valor !== "string" || valor.length === 0) {
    throw new ErrorReporte(
      400,
      `El campo ${campo} es obligatorio`,
    );
  }

  if (!FORMATO_FECHA.test(valor)) {
    throw new ErrorReporte(
      400,
      `El campo ${campo} debe tener el formato YYYY-MM-DD`,
    );
  }

  const fecha = new Date(`${valor}T00:00:00.000Z`);

  if (
    !Number.isFinite(fecha.getTime()) ||
    fecha.toISOString().slice(0, 10) !== valor
  ) {
    throw new ErrorReporte(
      400,
      `El campo ${campo} contiene una fecha no válida`,
    );
  }

  if (valor < "1000-01-01" || valor > "9999-12-30") {
    throw new ErrorReporte(
      400,
      `El campo ${campo} está fuera del rango permitido`,
    );
  }

  return valor;
}

// ==========================================
// VALIDAR PERIODO
// ==========================================

export function validarPeriodoReporte(
  fechaInicio: unknown,
  fechaFin: unknown,
): PeriodoReporte {
  const inicio = validarFecha(
    fechaInicio,
    "fecha_inicio",
  );

  const fin = validarFecha(
    fechaFin,
    "fecha_fin",
  );

  if (inicio > fin) {
    throw new ErrorReporte(
      400,
      "La fecha de inicio no puede ser posterior a la fecha final",
    );
  }

  const inicioUTC = new Date(
    `${inicio}T00:00:00.000Z`,
  ).getTime();

  const finUTC = new Date(
    `${fin}T00:00:00.000Z`,
  ).getTime();

  const cantidadDias =
    Math.round(
      (finUTC - inicioUTC) / MILISEGUNDOS_POR_DIA,
    ) + 1;

  if (cantidadDias > MAXIMO_DIAS_REPORTE) {
    throw new ErrorReporte(
      400,
      `El periodo del reporte no puede superar los ${MAXIMO_DIAS_REPORTE} días`,
    );
  }

  return {
    fecha_inicio: inicio,
    fecha_fin: fin,
  };
}

// ==========================================
// REPORTE DE VENTAS
// ==========================================

export async function obtenerReporteVentas(
  fechaInicio: unknown,
  fechaFin: unknown,
): Promise<ReporteVentas> {
  const periodo = validarPeriodoReporte(
    fechaInicio,
    fechaFin,
  );

  return consultarReporteVentas(periodo);
}

// ==========================================
// REPORTE DE INVENTARIO
// ==========================================

export async function obtenerReporteInventario(
  fechaInicio: unknown,
  fechaFin: unknown,
): Promise<ReporteInventario> {
  const periodo = validarPeriodoReporte(
    fechaInicio,
    fechaFin,
  );

  return consultarReporteInventario(periodo);
}

// ==========================================
// REPORTE DE CAJA
// ==========================================

export async function obtenerReporteCaja(
  fechaInicio: unknown,
  fechaFin: unknown,
): Promise<ReporteCaja> {
  const periodo = validarPeriodoReporte(
    fechaInicio,
    fechaFin,
  );

  return consultarReporteCaja(periodo);
}

// ==========================================
// REPORTE DE SOLICITUDES
// ==========================================

export async function obtenerReporteSolicitudes(
  fechaInicio: unknown,
  fechaFin: unknown,
): Promise<ReporteSolicitudes> {
  const periodo = validarPeriodoReporte(
    fechaInicio,
    fechaFin,
  );

  return consultarReporteSolicitudes(periodo);
}
