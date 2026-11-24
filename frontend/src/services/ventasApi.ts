
import type {
  HistorialVentas,
  NuevaVenta,
  ResultadoRegistroVenta,
  VentaConDetalles,
} from "../types/ventas";

const API_URL = "http://localhost:3000/api";

// ==========================================
// TIPOS DE RESPUESTA
// ==========================================

interface RespuestaError {
  mensaje?: string;
  errores?: string[];
}

// ==========================================
// PROCESAR RESPUESTA DEL SERVIDOR
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
// OBTENER HEADERS
// ==========================================

function obtenerHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// ==========================================
// REGISTRAR VENTA
// ==========================================

export async function registrarVenta(
  datos: NuevaVenta,
  token: string,
): Promise<ResultadoRegistroVenta> {
  const respuesta = await fetch(`${API_URL}/ventas`, {
    method: "POST",
    headers: obtenerHeaders(token),
    body: JSON.stringify({
      ...datos,
      metodo_pago: "EFECTIVO",
    }),
  });

  return procesarRespuesta<ResultadoRegistroVenta>(
    respuesta,
  );
}

// ==========================================
// OBTENER HISTORIAL DE VENTAS
// ==========================================

export async function obtenerHistorialVentas(
  token: string,
): Promise<HistorialVentas> {
  const respuesta = await fetch(`${API_URL}/ventas`, {
    method: "GET",
    headers: obtenerHeaders(token),
  });

  return procesarRespuesta<HistorialVentas>(
    respuesta,
  );
}

// ==========================================
// OBTENER VENTA POR ID
// ==========================================

export async function obtenerVentaPorId(
  idVenta: number,
  token: string,
): Promise<VentaConDetalles> {
  const respuesta = await fetch(
    `${API_URL}/ventas/${idVenta}`,
    {
      method: "GET",
      headers: obtenerHeaders(token),
    },
  );

  return procesarRespuesta<VentaConDetalles>(
    respuesta,
  );
}
