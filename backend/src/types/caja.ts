// ==========================================
// TIPOS DEL MODULO DE CAJA
// ==========================================

// ==========================================
// ESTADOS Y MOVIMIENTOS
// ==========================================

export type EstadoCaja = "ABIERTA" | "CERRADA";

export type TipoMovimientoCaja = "ENTRADA" | "SALIDA";

export type ConceptoMovimientoCaja = "VENTA" | "OTRO";

// ==========================================
// CAJA
// ==========================================

export interface Caja {
  id_caja: number;

  id_usuario_apertura: number;
  id_usuario_cierre: number | null;

  fecha_apertura: string;
  fecha_cierre: string | null;

  fondo_inicial: string;

  monto_esperado: string | null;
  monto_real: string | null;
  diferencia: string | null;

  estado: EstadoCaja;

  observaciones: string | null;
}

// ==========================================
// ABRIR CAJA
// ==========================================

export interface AbrirCaja {
  fondo_inicial: number;
}

// ==========================================
// CERRAR CAJA
// ==========================================

export interface CerrarCaja {
  monto_real: number;
  observaciones?: string | null;
}

// ==========================================
// MOVIMIENTOS DE CAJA
// ==========================================

export interface MovimientoCaja {
  id_movimiento_caja: number;

  id_caja: number;
  id_usuario: number;
  id_venta: number | null;

  tipo: TipoMovimientoCaja;
  concepto: ConceptoMovimientoCaja;

  monto: string;
  motivo: string;

  fecha_movimiento: string;
}

// ==========================================
// RESUMEN DE CAJA
// ==========================================

export interface ResumenCaja {
  caja: Caja;

  total_entradas: string;
  total_salidas: string;

  efectivo_esperado: string;

  movimientos: MovimientoCaja[];
}

// ==========================================
// RESULTADO DEL CIERRE
// ==========================================

export interface ResultadoCierreCaja {
  mensaje: string;

  caja: Caja;
}

// ==========================================
// HISTORIAL DE CAJAS
// ==========================================

export interface HistorialCaja {
  cajas: Caja[];
  total: number;
}
