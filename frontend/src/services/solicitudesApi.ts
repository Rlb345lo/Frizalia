import type { ActualizarEstadoSolicitud, CobrarSolicitud, HistorialSolicitudes, RechazarSolicitud, RespuestaErrorSolicitud, ResultadoActualizacionSolicitud } from "../types/solicitudes";
import type { ResultadoRegistroVenta } from "../types/ventas";
const API_URL = "http://localhost:3000/api/solicitudes/admin";
async function peticion<T>(ruta: string, token: string, method = "GET", body?: unknown): Promise<T> {
  const respuesta = await fetch(`${API_URL}${ruta}`, { method, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const datos: unknown = await respuesta.json().catch(() => null);
  if (!respuesta.ok) { const error = datos as RespuestaErrorSolicitud | null; throw new Error(error?.errores?.join(", ") || error?.mensaje || `Error HTTP ${respuesta.status}`); }
  if (datos === null) throw new Error("Respuesta no válida del servidor");
  return datos as T;
}
export const obtenerSolicitudes = (token: string) => peticion<HistorialSolicitudes>("/todas", token);
export const aceptarSolicitud = (id: number, token: string) => peticion<ResultadoActualizacionSolicitud>(`/${id}/aceptar`, token, "PATCH", {});
export const rechazarSolicitud = (id: number, datos: RechazarSolicitud, token: string) => peticion<ResultadoActualizacionSolicitud>(`/${id}/rechazar`, token, "PATCH", datos);
export const actualizarEstadoSolicitud = (id: number, datos: ActualizarEstadoSolicitud, token: string) => peticion<ResultadoActualizacionSolicitud>(`/${id}/estado`, token, "PATCH", datos);
export const aprobarCancelacion = (id: number, token: string) => peticion<ResultadoActualizacionSolicitud & { estado_cancelacion: "APROBADA" }>(`/${id}/aprobar-cancelacion`, token, "PATCH", {});
export const rechazarCancelacion = (id: number, token: string) => peticion<{ mensaje: string; id_solicitud: number; estado_cancelacion: "RECHAZADA" }>(`/${id}/rechazar-cancelacion`, token, "PATCH", {});
export const cobrarSolicitud = (id: number, datos: CobrarSolicitud, token: string) => peticion<ResultadoRegistroVenta>(`/${id}/cobrar`, token, "POST", datos);
