import type { Response } from "express";

import type { RequestAutenticada } from "../middlewares/auth.middleware.js";

import {
  ErrorCaja,
  abrirCaja,
  cerrarCaja,
  obtenerHistorialCajas,
  obtenerResumenCajaActual,
  obtenerResumenCajaPorId,
} from "../services/caja.service.js";

// ==========================================
// VALIDAR CUERPO DE LA PETICION
// ==========================================

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

// ==========================================
// VALIDAR ID DE CAJA
// ==========================================

function obtenerIdCaja(valor: unknown): number | null {
  if (typeof valor !== "string" || !/^\d+$/.test(valor)) {
    return null;
  }

  const idCaja = Number(valor);

  if (!Number.isSafeInteger(idCaja) || idCaja <= 0) {
    return null;
  }

  return idCaja;
}

// ==========================================
// OBTENER USUARIO AUTENTICADO
// ==========================================

function obtenerIdUsuario(req: RequestAutenticada): number | null {
  const idUsuario = req.idUsuario;

  if (
    !Number.isSafeInteger(idUsuario) ||
    idUsuario === undefined ||
    idUsuario <= 0
  ) {
    return null;
  }

  return idUsuario;
}

// ==========================================
// MANEJAR ERRORES DE CAJA
// ==========================================

function manejarErrorCaja(
  error: unknown,
  res: Response,
  operacion: string,
): void {
  if (error instanceof ErrorCaja) {
    res.status(error.codigoEstado).json({
      mensaje: error.message,
    });

    return;
  }

  console.error(`Error al ${operacion}:`, error);

  res.status(500).json({
    mensaje: "Ocurrio un error interno del servidor.",
  });
}

// ==========================================
// CONSULTAR CAJA ACTUAL
// GET /api/caja/actual
// ==========================================

export async function obtenerCajaActual(
  _req: RequestAutenticada,
  res: Response,
): Promise<void> {
  try {
    const resumen = await obtenerResumenCajaActual();

    res.status(200).json(resumen);
  } catch (error) {
    manejarErrorCaja(error, res, "consultar la caja actual");
  }
}

// ==========================================
// ABRIR CAJA
// POST /api/caja/abrir
// ==========================================

export async function registrarAperturaCaja(
  req: RequestAutenticada,
  res: Response,
): Promise<void> {
  try {
    const idUsuario = obtenerIdUsuario(req);

    if (idUsuario === null) {
      res.status(401).json({
        mensaje: "Usuario no autenticado.",
      });

      return;
    }

    const cuerpo: unknown = req.body;

    if (!esObjeto(cuerpo) || typeof cuerpo.fondo_inicial !== "number") {
      res.status(400).json({
        mensaje: "Debes proporcionar un fondo inicial numerico.",
      });

      return;
    }

    const caja = await abrirCaja(idUsuario, {
      fondo_inicial: cuerpo.fondo_inicial,
    });

    res.status(201).json({
      mensaje: "Caja abierta correctamente.",
      caja,
    });
  } catch (error) {
    manejarErrorCaja(error, res, "registrar la apertura de caja");
  }
}

// ==========================================
// CERRAR CAJA
// POST /api/caja/:id/cerrar
// ==========================================

export async function registrarCierreCaja(
  req: RequestAutenticada,
  res: Response,
): Promise<void> {
  try {
    const idUsuario = obtenerIdUsuario(req);

    if (idUsuario === null) {
      res.status(401).json({
        mensaje: "Usuario no autenticado.",
      });

      return;
    }

    const idCaja = obtenerIdCaja(req.params.id);

    if (idCaja === null) {
      res.status(400).json({
        mensaje: "El ID de caja no es valido.",
      });

      return;
    }

    const cuerpo: unknown = req.body;

    if (!esObjeto(cuerpo) || typeof cuerpo.monto_real !== "number") {
      res.status(400).json({
        mensaje: "Debes proporcionar el monto real contado.",
      });

      return;
    }

    if (
      cuerpo.observaciones !== undefined &&
      cuerpo.observaciones !== null &&
      typeof cuerpo.observaciones !== "string"
    ) {
      res.status(400).json({
        mensaje: "Las observaciones deben ser texto.",
      });

      return;
    }

    const observaciones =
      typeof cuerpo.observaciones === "string" ? cuerpo.observaciones : null;

    const resultado = await cerrarCaja(idCaja, idUsuario, {
      monto_real: cuerpo.monto_real,
      observaciones,
    });

    res.status(200).json(resultado);
  } catch (error) {
    manejarErrorCaja(error, res, "registrar el cierre de caja");
  }
}

// ==========================================
// CONSULTAR RESUMEN POR ID
// GET /api/caja/:id/resumen
// ==========================================

export async function obtenerResumenCaja(
  req: RequestAutenticada,
  res: Response,
): Promise<void> {
  try {
    const idCaja = obtenerIdCaja(req.params.id);

    if (idCaja === null) {
      res.status(400).json({
        mensaje: "El ID de caja no es valido.",
      });

      return;
    }

    const resumen = await obtenerResumenCajaPorId(idCaja);

    res.status(200).json(resumen);
  } catch (error) {
    manejarErrorCaja(error, res, "consultar el resumen de caja");
  }
}

// ==========================================
// CONSULTAR HISTORIAL
// GET /api/caja/historial
// ==========================================

export async function obtenerHistorialCaja(
  _req: RequestAutenticada,
  res: Response,
): Promise<void> {
  try {
    const historial = await obtenerHistorialCajas();

    res.status(200).json(historial);
  } catch (error) {
    manejarErrorCaja(error, res, "consultar el historial de cajas");
  }
}
