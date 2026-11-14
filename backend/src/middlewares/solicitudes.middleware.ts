
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  buscarUsuarioPorId,
} from "../repositories/auth.repository.js";

import type {
  RequestAutenticada,
} from "./auth.middleware.js";

// ==========================================
// VERIFICAR CLIENTE ACTIVO
// ==========================================

export async function verificarClienteActivo(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const solicitud = req as RequestAutenticada;
    const idUsuario = solicitud.idUsuario;

    // Verificar que exista un usuario autenticado
    if (!idUsuario) {
      res.status(401).json({
        mensaje: "Debes iniciar sesión",
      });
      return;
    }

    // Buscar usuario en la base de datos
    const usuario = await buscarUsuarioPorId(idUsuario);

    if (!usuario) {
      res.status(401).json({
        mensaje: "Usuario no encontrado",
      });
      return;
    }

    // Verificar que la cuenta esté activa
    if (Number(usuario.activo) !== 1) {
      res.status(403).json({
        mensaje: "Tu cuenta está desactivada",
      });
      return;
    }

    // Verificar que sea cliente
    if (usuario.rol !== "CLIENTE") {
      res.status(403).json({
        mensaje: "Esta función es exclusiva para clientes",
      });
      return;
    }

    next();

  } catch (error) {
    console.error(
      "Error al verificar cliente:",
      error
    );

    res.status(500).json({
      mensaje: "Error al verificar los permisos del usuario",
    });
  }
}

// ==========================================
// VERIFICAR PERSONAL ACTIVO
// ADMINISTRADOR O EMPLEADO
// ==========================================

export async function verificarPersonalActivo(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const solicitud = req as RequestAutenticada;
    const idUsuario = solicitud.idUsuario;

    // Verificar que exista un usuario autenticado
    if (!idUsuario) {
      res.status(401).json({
        mensaje: "Debes iniciar sesión",
      });
      return;
    }

    // Buscar usuario en MySQL
    const usuario = await buscarUsuarioPorId(idUsuario);

    if (!usuario) {
      res.status(401).json({
        mensaje: "Usuario no encontrado",
      });
      return;
    }

    // Verificar que la cuenta esté activa
    if (Number(usuario.activo) !== 1) {
      res.status(403).json({
        mensaje: "Tu cuenta está desactivada",
      });
      return;
    }

    // Permitir únicamente empleados y administradores
    const esPersonal =
      usuario.rol === "EMPLEADO" ||
      usuario.rol === "ADMINISTRADOR";

    if (!esPersonal) {
      res.status(403).json({
        mensaje:
          "No tienes permisos para acceder a esta función",
      });
      return;
    }

    // Usuario autorizado
    next();

  } catch (error) {
    console.error(
      "Error al verificar personal:",
      error
    );

    res.status(500).json({
      mensaje: "Error al verificar los permisos del usuario",
    });
  }
}
