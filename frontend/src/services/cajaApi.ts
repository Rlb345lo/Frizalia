import type {
  AbrirCaja,
  CerrarCaja,
  HistorialCaja,
  RespuestaAperturaCaja,
  RespuestaCierreCaja,
  ResumenCaja,
} from "../types/caja";

const API_URL = "http://localhost:3000/api/caja";

// ==========================================
// PROCESAR ERRORES DEL BACKEND
// ==========================================

interface RespuestaError {
  mensaje?: string;
  errores?: string[];
}

async function procesarRespuesta<T>(respuesta: Response): Promise<T> {
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
// HEADERS CON TOKEN
// ==========================================

function obtenerHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ==========================================
// CONSULTAR CAJA ACTUAL
// ==========================================

export async function obtenerCajaActual(
  token: string,
): Promise<ResumenCaja | null> {
  const respuesta = await fetch(`${API_URL}/actual`, {
    headers: obtenerHeaders(token),
  });

  return procesarRespuesta<ResumenCaja | null>(respuesta);
}

// ==========================================
// ABRIR CAJA
// ==========================================

export async function abrirCaja(
  datos: AbrirCaja,
  token: string,
): Promise<RespuestaAperturaCaja> {
  const respuesta = await fetch(`${API_URL}/abrir`, {
    method: "POST",
    headers: obtenerHeaders(token),
    body: JSON.stringify(datos),
  });

  return procesarRespuesta<RespuestaAperturaCaja>(respuesta);
}

// ==========================================
// CERRAR CAJA
// ==========================================

export async function cerrarCaja(
  idCaja: number,
  datos: CerrarCaja,
  token: string,
): Promise<RespuestaCierreCaja> {
  const respuesta = await fetch(`${API_URL}/${idCaja}/cerrar`, {
    method: "POST",
    headers: obtenerHeaders(token),
    body: JSON.stringify(datos),
  });

  return procesarRespuesta<RespuestaCierreCaja>(respuesta);
}

// ==========================================
// CONSULTAR RESUMEN POR ID
// ==========================================

export async function obtenerResumenCaja(
  idCaja: number,
  token: string,
): Promise<ResumenCaja> {
  const respuesta = await fetch(`${API_URL}/${idCaja}/resumen`, {
    headers: obtenerHeaders(token),
  });

  return procesarRespuesta<ResumenCaja>(respuesta);
}

// ==========================================
// CONSULTAR HISTORIAL
// ==========================================

export async function obtenerHistorialCajas(
  token: string,
): Promise<HistorialCaja> {
  const respuesta = await fetch(`${API_URL}/historial`, {
    headers: obtenerHeaders(token),
  });

  return procesarRespuesta<HistorialCaja>(respuesta);
}
