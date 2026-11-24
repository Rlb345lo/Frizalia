
 // ==========================================
 // FRIZALIA - TIPOS DE SOLICITUDES
 // ==========================================

 // Estados que puede tener un pedido
 export type EstadoSolicitud =
   | "PENDIENTE"
   | "ACEPTADA"
   | "EN_PREPARACION"
   | "LISTA"
   | "ENTREGADA"
   | "RECHAZADA"
   | "CANCELADA";

 // Estados de una solicitud de cancelación
 export type EstadoCancelacion =
   | "NINGUNA"
   | "SOLICITADA"
   | "APROBADA"
   | "RECHAZADA";

 // ==========================================
 // DETALLE DE PRODUCTOS
 // ==========================================

 // Producto enviado desde Flutter al crear pedido
 export interface ProductoSolicitado {
   id_producto: number;
   cantidad: number;
 }

 // Detalle almacenado en MySQL
 export interface DetalleSolicitud {
   id_detalle: number;
   id_solicitud: number;
   id_producto: number;
   cantidad: number;
   precio_unitario: number;
   subtotal: number;
 }

 // Detalle que mostraremos al cliente
 export interface DetalleSolicitudPublico
   extends DetalleSolicitud {
   nombre_producto: string;
 }

 // ==========================================
 // SOLICITUD COMPLETA
 // ==========================================

 export interface Solicitud {
   id_solicitud: number;
   id_usuario: number;
   folio: string | null;
   estado: EstadoSolicitud;
   total: number;
   minutos_llegada: number;
   fecha_recogida_estimada: Date | null;
   motivo_rechazo: string | null;
   motivo_cancelacion: string | null;
   estado_cancelacion: EstadoCancelacion;
   fecha_solicitud: Date;
   fecha_actualizacion: Date;
 }

 // Solicitud con sus productos
 export interface SolicitudConDetalles
   extends Solicitud {
   productos: DetalleSolicitudPublico[];
 }

 // ==========================================
 // DATOS PARA CREAR UNA SOLICITUD
 // ==========================================

 export interface CrearSolicitud {
   productos: ProductoSolicitado[];
   minutos_llegada: number;
 }

 // ==========================================
 // CAMBIOS DE ESTADO
 // ==========================================

 export interface ActualizarEstadoSolicitud {
   estado: EstadoSolicitud;
   motivo_rechazo?: string;
 }

 // ==========================================
 // CANCELACIONES
 // ==========================================

 // Cliente solicita cancelar su pedido
 export interface SolicitarCancelacion {
   motivo_cancelacion: string;
 }

 // Administrador responde a la cancelación
 export interface ResolverCancelacion {
   aprobar: boolean;
 }

 // ==========================================
 // RESULTADOS DE OPERACIONES
 // ==========================================

 export interface ResultadoSolicitud {
   mensaje: string;
   solicitud: SolicitudConDetalles;
 }

 // ==========================================
// COBRO DE SOLICITUDES
// ==========================================

export interface CobrarSolicitud {
  monto_recibido: number;
}

// ==========================================
// INFORMACIÓN DEL CLIENTE
// PANEL ADMINISTRATIVO
// ==========================================

export interface SolicitudAdministrativa
  extends SolicitudConDetalles {
  nombre_cliente: string;
  correo_cliente: string;
  telefono_cliente: string | null;
  id_venta: number | null;
}
