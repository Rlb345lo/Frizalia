export type EstadoSolicitud = "PENDIENTE" | "ACEPTADA" | "EN_PREPARACION" | "LISTA" | "ENTREGADA" | "RECHAZADA" | "CANCELADA";
export type EstadoCancelacion = "NINGUNA" | "SOLICITADA" | "APROBADA" | "RECHAZADA";
export interface DetalleSolicitud { id_detalle: number; id_solicitud: number; id_producto: number; cantidad: number; precio_unitario: string; subtotal: string; nombre_producto: string; }
export interface Solicitud { id_solicitud: number; id_usuario: number; folio: string | null; estado: EstadoSolicitud; total: string; minutos_llegada: number; fecha_recogida_estimada: string | null; motivo_rechazo: string | null; motivo_cancelacion: string | null; estado_cancelacion: EstadoCancelacion; fecha_solicitud: string; fecha_actualizacion: string; }
export interface SolicitudConDetalles extends Solicitud { productos: DetalleSolicitud[]; }
export interface SolicitudAdministrativa extends SolicitudConDetalles { nombre_cliente: string; correo_cliente: string; telefono_cliente: string | null; id_venta: number | null; }
export interface HistorialSolicitudes { mensaje: string; total: number; solicitudes: SolicitudAdministrativa[]; }
export interface RechazarSolicitud { motivo_rechazo: string; }
export type EstadoPreparacion = "EN_PREPARACION" | "LISTA";
export interface ActualizarEstadoSolicitud { estado: EstadoPreparacion; }
export interface CobrarSolicitud { monto_recibido: number; }
export interface ResultadoActualizacionSolicitud { mensaje: string; id_solicitud: number; estado: EstadoSolicitud; }
export interface RespuestaErrorSolicitud { mensaje?: string; errores?: string[]; }
