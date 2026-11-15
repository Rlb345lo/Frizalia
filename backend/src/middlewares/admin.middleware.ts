import type { Request, Response, NextFunction } from "express";

import { buscarUsuarioPorId } from "../repositories/auth.repository.js";
import type { RequestAutenticada } from "./auth.middleware.js";

// ==========================================
// VERIFICAR PERMISOS DE ADMINISTRADOR
// ==========================================

export async function verificarAdministrador(
  req: RequestAutenticada,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Obtener ID guardado por verificarToken
    const idUsuario = req.idUsuario;

    if (!idUsuario) {
      res.status(401).json({
        mensaje: "Usuario no autenticado",
      });
      return;
    }

    // Consultar usuario actual en MySQL
    const usuario = await buscarUsuarioPorId(idUsuario);

    if (!usuario || !usuario.activo) {
      res.status(403).json({
        mensaje: "Usuario inexistente o inactivo",
      });
      return;
    }

    // Comprobar permisos
    if (usuario.rol !== "ADMINISTRADOR") {
      res.status(403).json({
        mensaje: "No tienes permisos de administrador",
      });
      return;
    }

    // Permitir continuar
    next();
  } catch (error) {
    console.error("Error al verificar permisos de administrador:", error);

    res.status(500).json({
      mensaje: "Error al verificar los permisos del usuario",
    });
  }
}
