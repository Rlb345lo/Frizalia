
import type { Request, Response } from "express";

import {
  registrarCliente,
  registrarAdministrador,
  iniciarSesion,
  obtenerPerfil,
  ErrorAuth,
} from "../services/auth.service.js";

import type {
  RequestAutenticada,
} from "../middlewares/auth.middleware.js";

// ==========================================
// MANEJO DE ERRORES
// ==========================================

function responderError(
  error: unknown,
  res: Response
): void {
  if (error instanceof ErrorAuth) {
    res.status(error.estado).json({
      mensaje: error.message,
    });
    return;
  }

  console.error("Error de autenticación:", error);

  res.status(500).json({
    mensaje: "Error interno del servidor",
  });
}

// ==========================================
// REGISTRAR CLIENTE
// ==========================================

export async function registro(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const resultado = await registrarCliente(req.body);

    res.status(201).json(resultado);
  } catch (error) {
    responderError(error, res);
  }
}

// ==========================================
// INICIAR SESIÓN
// ==========================================

export async function login(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const resultado = await iniciarSesion(req.body);

    res.status(200).json(resultado);
  } catch (error) {
    responderError(error, res);
  }
}

// ==========================================
// CONSULTAR PERFIL
// ==========================================

export async function perfil(
  req: RequestAutenticada,
  res: Response
): Promise<void> {
  try {
    if (!req.idUsuario) {
      res.status(401).json({
        mensaje: "No autenticado",
      });
      return;
    }

    const usuario = await obtenerPerfil(req.idUsuario);

    res.status(200).json(usuario);
  } catch (error) {
    responderError(error, res);
  }
}

export async function registroAdmin(req: Request, res: Response): Promise<void> {
  try {
    const resultado = await registrarAdministrador(req.body);
    res.status(201).json(resultado);
  } catch (error) {
    responderError(error, res);
  }
}
