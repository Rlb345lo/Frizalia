
import type {
  Request,
  Response,
  NextFunction,
} from "express";

import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";

// ==========================================
// PETICIÓN CON USUARIO AUTENTICADO
// ==========================================

export interface RequestAutenticada extends Request {
  idUsuario?: number;
}

// ==========================================
// VERIFICAR TOKEN JWT
// ==========================================

export function verificarToken(
  req: RequestAutenticada,
  res: Response,
  next: NextFunction
): void {
  // Obtener encabezado Authorization
  const autorizacion = req.headers.authorization;

  if (!autorizacion?.startsWith("Bearer ")) {
    res.status(401).json({
      mensaje: "Token de acceso requerido",
    });
    return;
  }

  // Extraer el token
  const token = autorizacion.slice(7).trim();

  if (!token) {
    res.status(401).json({
      mensaje: "Token de acceso requerido",
    });
    return;
  }

  // Obtener clave secreta
  const secreto = process.env.JWT_SECRET;

  if (!secreto) {
    res.status(500).json({
      mensaje: "Error de configuración del servidor",
    });
    return;
  }

  try {
    // Verificar firma y expiración
    const datos = jwt.verify(token, secreto, {
      algorithms: ["HS256"],
    });

    // Comprobar que el contenido sea un objeto
    if (typeof datos === "string") {
      res.status(401).json({
        mensaje: "Token no válido",
      });
      return;
    }

    const payload = datos as JwtPayload;

    // Validar identificador de usuario
    if (
      typeof payload.id_usuario !== "number" ||
      !Number.isSafeInteger(payload.id_usuario) ||
      payload.id_usuario <= 0
    ) {
      res.status(401).json({
        mensaje: "Token no válido",
      });
      return;
    }

    // Guardar ID para los siguientes controladores
    req.idUsuario = payload.id_usuario;

    next();
  } catch {
    res.status(401).json({
      mensaje: "Token inválido o expirado",
    });
  }
}
