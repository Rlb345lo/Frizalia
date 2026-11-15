const API_URL = "http://localhost:3000/api/auth";

// ==========================================
// TIPOS DE AUTENTICACIÓN
// ==========================================

export type RolUsuario = "CLIENTE" | "EMPLEADO" | "ADMINISTRADOR";

export interface LoginDatos {
  correo: string;
  password: string;
}

export interface UsuarioAutenticado {
  id_usuario: number;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  telefono?: string | null;
}

export interface LoginRespuesta {
  mensaje: string;
  token: string;
  usuario: UsuarioAutenticado;
}

// ==========================================
// CLASE PARA ERRORES HTTP
// ==========================================

export class ErrorHTTP extends Error {
  readonly status: number;

  constructor(mensaje: string, status: number) {
    super(mensaje);

    this.name = "ErrorHTTP";
    this.status = status;
  }
}

// ==========================================
// MANEJO DE RESPUESTAS
// ==========================================

async function procesarRespuesta<T>(respuesta: Response): Promise<T> {
  let resultado: unknown;

  try {
    resultado = await respuesta.json();
  } catch {
    if (!respuesta.ok) {
      throw new ErrorHTTP(
        "El servidor devolvió una respuesta de error.",
        respuesta.status,
      );
    }

    throw new Error("El servidor devolvió una respuesta inválida.");
  }

  if (!respuesta.ok) {
    let mensaje = "Ocurrió un error en el servidor.";

    if (
      typeof resultado === "object" &&
      resultado !== null &&
      "mensaje" in resultado &&
      typeof resultado.mensaje === "string"
    ) {
      mensaje = resultado.mensaje;
    }

    throw new ErrorHTTP(mensaje, respuesta.status);
  }

  return resultado as T;
}

// ==========================================
// INICIAR SESIÓN
// ==========================================

export async function iniciarSesion(
  datos: LoginDatos,
): Promise<LoginRespuesta> {
  let respuesta: Response;

  try {
    respuesta = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor de Frizalia.");
  }

  return procesarRespuesta<LoginRespuesta>(respuesta);
}

// ==========================================
// OBTENER PERFIL AUTENTICADO
// ==========================================

export async function obtenerPerfil(
  token: string,
): Promise<UsuarioAutenticado> {
  let respuesta: Response;

  try {
    respuesta = await fetch(`${API_URL}/perfil`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor de Frizalia.");
  }

  return procesarRespuesta<UsuarioAutenticado>(respuesta);
}

// ==========================================
// COMPROBAR ACCESO ADMINISTRATIVO
// ==========================================

export function tieneAccesoAdministrativo(
  usuario: UsuarioAutenticado,
): boolean {
  return usuario.rol === "ADMINISTRADOR" || usuario.rol === "EMPLEADO";
}
