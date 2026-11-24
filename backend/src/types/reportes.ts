
import type { EstadoSolicitud } from "./solicitudes.js";
import type { MetodoPagoVenta } from "./ventas.js";

// ==========================================
// TIPOS GENERALES DE REPORTES
// ==========================================

export interface PeriodoReporte {
  fecha_inicio: string;
  fecha_fin: string;
}

export type TipoReporte =
  | "VENTAS"
  | "INVENTARIO"
  | "CAJA"
  | "SOLICITUDES";

export type OrigenVenta =
  | "PRESENCIAL"
  | "SOLICITUD";

// ==========================================
// REPORTE DE VENTAS
// ==========================================

export interface ResumenReporteVentas {
  total_ventas: number;
  ingresos_totales: string;
  ticket_promedio: string;
  unidades_vendidas: number;
  ventas_presenciales: number;
  ventas_solicitudes: number;
}

export interface VentaDiariaReporte {
  fecha: string;
  cantidad_ventas: number;
  total: string;
}

export interface ProductoVendidoReporte {
  id_producto: number;
  nombre: string;
  presentacion: string | null;
  categoria: string;
  unidades_vendidas: number;
  ingresos: string;
}

export interface VentaCategoriaReporte {
  id_categoria: number;
  categoria: string;
  unidades_vendidas: number;
  ingresos: string;
}

export interface VentaDetalleReporte {
  id_venta: number;
  id_caja: number;
  id_solicitud: number | null;
  folio: string;
  vendedor: string;
  origen: OrigenVenta;
  metodo_pago: MetodoPagoVenta;
  total: string;
  monto_recibido: string;
  cambio: string;
  fecha_venta: string;
}

export interface ReporteVentas {
  periodo: PeriodoReporte;
  resumen: ResumenReporteVentas;
  ventas_diarias: VentaDiariaReporte[];
  productos_mas_vendidos: ProductoVendidoReporte[];
  ventas_por_categoria: VentaCategoriaReporte[];
  ventas: VentaDetalleReporte[];
}

// ==========================================
// REPORTE DE INVENTARIO
// ==========================================

export type EstadoStockReporte =
  | "NORMAL"
  | "BAJO"
  | "AGOTADO";

export type TipoMovimientoReporte =
  | "ENTRADA"
  | "SALIDA"
  | "AJUSTE";

export interface ResumenReporteInventario {
  total_productos: number;
  productos_activos: number;
  productos_inactivos: number;
  productos_stock_bajo: number;
  productos_agotados: number;
  unidades_disponibles: number;
  valor_inventario_precio_venta: string;
  total_entradas: number;
  total_salidas: number;
  total_ajustes: number;
}

export interface ProductoInventarioReporte {
  id_producto: number;
  nombre: string;
  presentacion: string | null;
  categoria: string;
  precio: string;
  stock: number;
  stock_minimo: number;
  disponible: boolean;
  estado_stock: EstadoStockReporte;
  valor_precio_venta: string;
}

export interface MovimientoInventarioReporte {
  id_movimiento: number;
  id_producto: number;
  id_solicitud: number | null;
  producto: string;
  usuario: string;
  tipo: TipoMovimientoReporte;
  cantidad: number;
  motivo: string;
  fecha_movimiento: string;
}

export interface ReporteInventario {
  periodo: PeriodoReporte;
  fecha_consulta: string;
  resumen: ResumenReporteInventario;
  productos: ProductoInventarioReporte[];
  movimientos: MovimientoInventarioReporte[];
}

// ==========================================
// REPORTE DE CAJA
// ==========================================

export type EstadoCajaReporte =
  | "ABIERTA"
  | "CERRADA";

export interface ResumenReporteCaja {
  total_cajas: number;
  cajas_abiertas: number;
  cajas_cerradas: number;
  ingresos_por_ventas: string;
  otras_entradas: string;
  total_entradas: string;
  total_salidas: string;
  flujo_neto: string;
  total_faltantes: string;
  total_sobrantes: string;
}

export interface CajaDetalleReporte {
  id_caja: number;
  usuario_apertura: string;
  usuario_cierre: string | null;
  fecha_apertura: string;
  fecha_cierre: string | null;
  estado: EstadoCajaReporte;
  fondo_inicial: string;
  total_entradas: string;
  total_salidas: string;
  monto_esperado: string;
  monto_real: string | null;
  diferencia: string | null;
  observaciones: string | null;
}

export interface MovimientoCajaReporte {
  id_movimiento_caja: number;
  id_caja: number;
  id_venta: number | null;
  usuario: string;
  tipo: "ENTRADA" | "SALIDA";
  concepto: "VENTA" | "OTRO";
  monto: string;
  motivo: string;
  fecha_movimiento: string;
}

export interface ReporteCaja {
  periodo: PeriodoReporte;
  resumen: ResumenReporteCaja;
  cajas: CajaDetalleReporte[];
  movimientos: MovimientoCajaReporte[];
}

// ==========================================
// REPORTE DE SOLICITUDES
// ==========================================

export type EstadoCancelacionReporte =
  | "NINGUNA"
  | "SOLICITADA"
  | "APROBADA"
  | "RECHAZADA";

export interface ResumenReporteSolicitudes {
  total_solicitudes: number;
  pendientes: number;
  aceptadas: number;
  en_preparacion: number;
  listas: number;
  entregadas: number;
  rechazadas: number;
  canceladas: number;
  cancelaciones_pendientes: number;
  solicitudes_cobradas: number;
  ingresos_solicitudes: string;
}

export interface SolicitudEstadoReporte {
  estado: EstadoSolicitud;
  cantidad: number;
}

export interface SolicitudDetalleReporte {
  id_solicitud: number;
  id_venta: number | null;
  folio: string | null;
  cliente: string;
  estado: EstadoSolicitud;
  estado_cancelacion: EstadoCancelacionReporte;
  total: string;
  monto_cobrado: string | null;
  fecha_solicitud: string | null;
  fecha_recogida_estimada: string | null;
  fecha_actualizacion: string | null;
  motivo_rechazo: string | null;
  motivo_cancelacion: string | null;
}

export interface ReporteSolicitudes {
  periodo: PeriodoReporte;
  resumen: ResumenReporteSolicitudes;
  solicitudes_por_estado: SolicitudEstadoReporte[];
  solicitudes: SolicitudDetalleReporte[];
}

// ==========================================
// RESPUESTA GENERAL DE LA API
// ==========================================

export interface RespuestaReporte<T> {
  mensaje: string;
  datos: T;
}
