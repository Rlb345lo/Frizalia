// ==========================================
// TIPOS DEL MODULO DE VENTAS
// ==========================================

// ==========================================
// METODOS DE PAGO
// ==========================================

export type MetodoPagoVenta = "EFECTIVO" | "TARJETA";

// ==========================================
// PRODUCTO EN EL CARRITO
// ==========================================

export interface ProductoCarritoVenta {
  id_producto: number;
  cantidad: number;
}

// ==========================================
// REGISTRAR NUEVA VENTA
// ==========================================

export interface NuevaVenta {
  productos: ProductoCarritoVenta[];
  metodo_pago: MetodoPagoVenta;

  // Obligatorio cuando se paga en efectivo.
  // Para tarjeta, el backend utilizara el total.
  monto_recibido?: number;
}

// ==========================================
// VENTA REGISTRADA EN MYSQL
// ==========================================

export interface Venta {
  id_venta: number;
  id_caja: number;
  id_usuario: number;
  id_solicitud: number | null;
  folio: string;
  total: string;
  metodo_pago: MetodoPagoVenta;
  monto_recibido: string | null;
  cambio: string | null;
  fecha_venta: string;
}

// ==========================================
// DETALLE DE VENTA
// ==========================================

export interface DetalleVenta {
  id_detalle_venta: number;
  id_venta: number;
  id_producto: number;
  cantidad: number;
  precio_unitario: string;
  subtotal: string;
}

// ==========================================
// DETALLE DE VENTA CON PRODUCTO
// ==========================================

export interface DetalleVentaProducto extends DetalleVenta {
  producto: string;
  presentacion: string | null;
}

// ==========================================
// PRODUCTO VALIDADO PARA UNA VENTA
// ==========================================

export interface ProductoValidadoVenta {
  id_producto: number;
  nombre: string;
  presentacion: string | null;
  precio_unitario: string;
  cantidad: number;
  subtotal: string;
}

// ==========================================
// RESULTADO AL REGISTRAR UNA VENTA
// ==========================================

export interface ResultadoRegistroVenta {
  mensaje: string;
  venta: Venta;
  detalles: DetalleVentaProducto[];
}

// ==========================================
// VENTA CON SUS DETALLES
// ==========================================

export interface VentaConDetalles {
  venta: Venta;
  detalles: DetalleVentaProducto[];
}

// ==========================================
// HISTORIAL DE VENTAS
// ==========================================

export interface HistorialVentas {
  ventas: Venta[];
  total: number;
}
