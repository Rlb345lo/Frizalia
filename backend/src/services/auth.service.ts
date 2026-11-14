
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

import {
  buscarUsuarioPorCorreo,
  buscarUsuarioPorId,
  crearCliente,
} from "../repositories/auth.repository.js";

import { usuarioPublico } from "../types/auth.js";

import type {
  RegistroUsuario,
  LoginUsuario,
  Usuario,
} from "../types/auth.js";

// ==========================================
// MANEJO DE ERRORES DE AUTENTICACIÓN
// ==========================================

export class ErrorAuth extends Error {
  constructor(
    public estado: number,
    mensaje: string
  ) {
    super(mensaje);
    this.name = "ErrorAuth";
  }
}

// ==========================================
// OBTENER CLAVE SECRETA JWT
// ==========================================

function obtenerSecreto(): string {
  const secreto = process.env.JWT_SECRET;

  if (!secreto || secreto.length < 32) {
    throw new Error(
      "JWT_SECRET no está configurado correctamente"
    );
  }

  return secreto;
}

// ==========================================
// GENERAR TOKEN JWT
// ==========================================

function generarToken(usuario: Usuario): string {
  const expiracion = (
    process.env.JWT_EXPIRES_IN || "2h"
  ) as SignOptions["expiresIn"];

  return jwt.sign(
    {
      id_usuario: usuario.id_usuario,
    },
    obtenerSecreto(),
    {
      expiresIn: expiracion,
    }
  );
}

// ==========================================
// REGISTRAR NUEVO CLIENTE
// ==========================================

export async function registrarCliente(
  datos: RegistroUsuario
) {
  const { nombre, correo, password, telefono } = datos;

  // Validar campos obligatorios
  if (
    typeof nombre !== "string" ||
    typeof correo !== "string" ||
    typeof password !== "string"
  ) {
    throw new ErrorAuth(
      400,
      "Nombre, correo y contraseña son obligatorios"
    );
  }

  const nombreLimpio = nombre.trim();
  const correoLimpio = correo.trim().toLowerCase();

  // Validar nombre
  if (!nombreLimpio || nombreLimpio.length > 100) {
    throw new ErrorAuth(400, "Nombre no válido");
  }

  // Validar correo
  if (
    correoLimpio.length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)
  ) {
    throw new ErrorAuth(400, "Correo no válido");
  }

  // Validar contraseña
  if (
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72
  ) {
    throw new ErrorAuth(
      400,
      "La contraseña debe tener al menos 8 caracteres y no superar 72 bytes"
    );
  }

  // Validar teléfono opcional
  if (
    telefono != null &&
    (
      typeof telefono !== "string" ||
      telefono.length > 20
    )
  ) {
    throw new ErrorAuth(
      400,
      "Teléfono no válido"
    );
  }

  // Comprobar si el correo ya existe
  const existente = await buscarUsuarioPorCorreo(
    correoLimpio
  );

  if (existente) {
    throw new ErrorAuth(
      409,
      "El correo ya está registrado"
    );
  }

  // Proteger contraseña con bcrypt
  const passwordHash = await bcrypt.hash(
    password,
    12
  );

  let idUsuario: number;

  try {
    // Guardar cliente en MySQL
    idUsuario = await crearCliente(
      nombreLimpio,
      correoLimpio,
      passwordHash,
      telefono?.trim() || null
    );
  } catch (error) {
    // Controlar correos duplicados
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      throw new ErrorAuth(
        409,
        "El correo ya está registrado"
      );
    }

    throw error;
  }

  return {
    mensaje: "Cuenta registrada correctamente",
    usuario: {
      id_usuario: idUsuario,
      nombre: nombreLimpio,
      correo: correoLimpio,
      telefono: telefono?.trim() || null,
      rol: "CLIENTE" as const,
    },
  };
}

// ==========================================
// INICIAR SESIÓN
// ==========================================

export async function iniciarSesion(
  datos: LoginUsuario
) {
  if (
    typeof datos?.correo !== "string" ||
    typeof datos?.password !== "string"
  ) {
    throw new ErrorAuth(
      400,
      "Correo y contraseña son obligatorios"
    );
  }

  const correo = datos.correo.trim().toLowerCase();

  const usuario = await buscarUsuarioPorCorreo(
    correo
  );

  if (!usuario || usuario.activo !== 1) {
    throw new ErrorAuth(
      401,
      "Credenciales incorrectas"
    );
  }

  // Comparar contraseña con su hash
  const passwordCorrecta = await bcrypt.compare(
    datos.password,
    usuario.password_hash
  );

  if (!passwordCorrecta) {
    throw new ErrorAuth(
      401,
      "Credenciales incorrectas"
    );
  }

  return {
    mensaje: "Inicio de sesión correcto",
    token: generarToken(usuario),
    usuario: usuarioPublico(usuario),
  };
}

// ==========================================
// CONSULTAR PERFIL
// ==========================================

export async function obtenerPerfil(
  id: number
) {
  const usuario = await buscarUsuarioPorId(id);

  if (!usuario || usuario.activo !== 1) {
    throw new ErrorAuth(
      401,
      "Usuario no disponible"
    );
  }

  return usuarioPublico(usuario);
}
