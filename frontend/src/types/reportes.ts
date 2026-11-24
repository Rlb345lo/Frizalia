
 // ==========================================
 // TIPOS GENERALES
 // ==========================================

export type TipoReporte =
  | "ventas"
  | "inventario"
  | "caja"
  | "solicitudes";

export interface PeriodoReporte {
  fecha_inicio: string;
  fecha_fin: string;
}

export interface RespuestaReporte<T> {
  mensaje: string;
  datos: T;
}

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

export interface CategoriaVentaReporte {
  id_categoria: number;
  categoria: string;
  unidades_vendidas: number;
  ingresos: string;
}

export interface VentaReporte {
  id_venta: number;
  id_caja: number;
  id_solicitud: number | null;
  folio: string;
  vendedor: string;
  origen: "PRESENCIAL" | "SOLICITUD";
  metodo_pago: "EFECTIVO" | "TARJETA";
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
  ventas_por_categoria: CategoriaVentaReporte[];
  ventas: VentaReporte[];
}

// ==========================================
// REPORTE DE INVENTARIO
// ==========================================

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
  estado_stock: string;
  valor_precio_venta: string;
}

export interface MovimientoInventarioReporte {
  id_movimiento: number;
  id_producto: number;
  id_solicitud: number | null;
  producto: string;
  usuario: string;
  tipo: "ENTRADA" | "SALIDA" | "AJUSTE";
  cantidad: number;
  motivo: string | null;
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

export interface CajaReporte {
  id_caja: number;
  usuario_apertura: string;
  usuario_cierre: string | null;
  fecha_apertura: string;
  fecha_cierre: string | null;
  estado: "ABIERTA" | "CERRADA";
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
  motivo: string | null;
  fecha_movimiento: string;
}

export interface ReporteCaja {
  periodo: PeriodoReporte;
  resumen: ResumenReporteCaja;
  cajas: CajaReporte[];
  movimientos: MovimientoCajaReporte[];
}

// ==========================================
// REPORTE DE SOLICITUDES
// ==========================================

export type EstadoSolicitudReporte =
  | "PENDIENTE"
  | "ACEPTADA"
  | "EN_PREPARACION"
  | "LISTA"
  | "ENTREGADA"
  | "RECHAZADA"
  | "CANCELADA";

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

export interface SolicitudesPorEstadoReporte {
  estado: EstadoSolicitudReporte;
  cantidad: number;
}

export interface SolicitudReporte {
  id_solicitud: number;
  id_venta: number | null;
  folio: string | null;
  cliente: string;
  estado: EstadoSolicitudReporte;
  estado_cancelacion: EstadoCancelacionReporte;
  total: string;
  monto_cobrado: string | null;
  fecha_solicitud: string;
  fecha_recogida_estimada: string | null;
  fecha_actualizacion: string;
  motivo_rechazo: string | null;
  motivo_cancelacion: string | null;
}

export interface ReporteSolicitudes {
  periodo: PeriodoReporte;
  resumen: ResumenReporteSolicitudes;
  solicitudes_por_estado: SolicitudesPorEstadoReporte[];
  solicitudes: SolicitudReporte[];
}

// ==========================================
// RELACION ENTRE TIPOS DE REPORTES
// ==========================================

export interface ReportesPorTipo {
  ventas: ReporteVentas;
  inventario: ReporteInventario;
  caja: ReporteCaja;
  solicitudes: ReporteSolicitudes;
}
