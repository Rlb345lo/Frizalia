const API_URL = "http://localhost:3000/api/dashboard";

// ==========================================
// TIPOS DE DATOS
// ==========================================

export interface ProductoStockBajo {
  id: number;
  nombre: string;
  stockActual: number;
  stockMinimo: number;
}

export type EstadoSolicitud =
  | "PENDIENTE"
  | "ACEPTADA"
  | "EN_PREPARACION"
  | "LISTA"
  | "ENTREGADA"
  | "RECHAZADA"
  | "CANCELADA";

export interface SolicitudReciente {
  id: number;
  cliente: string;
  fecha: string;
  estado: EstadoSolicitud;
}

export interface ResumenDashboard {
  productosActivos: number;
  solicitudesPendientes: number;
  productosStockBajo: ProductoStockBajo[];
  solicitudesRecientes: SolicitudReciente[];
}

interface RespuestaDashboard {
  mensaje: string;
  datos: ResumenDashboard;
}

// ==========================================
// CONSULTAR RESUMEN DEL DASHBOARD
// ==========================================

export async function obtenerResumenDashboard(
  token: string,
): Promise<ResumenDashboard> {
  if (!token.trim()) {
    throw new Error(
      "No se encontró una sesión activa. Inicia sesión nuevamente.",
    );
  }

  const respuesta = await fetch(`${API_URL}/resumen`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      throw new Error("Tu sesión ha expirado. Inicia sesión nuevamente.");
    }

    if (respuesta.status === 403) {
      throw new Error("No tienes permisos para consultar el Dashboard.");
    }

    throw new Error("No fue posible obtener las estadísticas del Dashboard.");
  }

  const resultado = (await respuesta.json()) as RespuestaDashboard;

  return resultado.datos;
}
