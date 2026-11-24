// ==========================================
// METODOS DE PAGO
// ==========================================

export type MetodoPagoVenta = "EFECTIVO" | "TARJETA";

// ==========================================
// PRODUCTO DEL CARRITO
// ==========================================

export interface ProductoCarritoVenta {
  id_producto: number;
  cantidad: number;
}

// ==========================================
// NUEVA VENTA (SOLO EFECTIVO)
// ==========================================

export interface NuevaVenta {
  productos: ProductoCarritoVenta[];
  metodo_pago: "EFECTIVO";
  monto_recibido: number;
}

// ==========================================
// VENTA REGISTRADA
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
// DETALLE CON INFORMACION DEL PRODUCTO
// ==========================================

export interface DetalleVentaProducto
  extends DetalleVenta {
  producto: string;
  presentacion: string | null;
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
