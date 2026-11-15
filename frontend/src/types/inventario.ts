// ==========================================
// TIPOS DEL MÓDULO DE INVENTARIO
// ==========================================

// ==========================================
// PRODUCTOS
// ==========================================

export interface ProductoInventario {
  id_producto: number;
  id_categoria: number;
  nombre: string;
  presentacion: string | null;
  descripcion: string | null;
  precio: string;
  stock: number;
  stock_minimo: number;
  imagen_url: string | null;
  disponible: number;
  categoria: string;
}

// ==========================================
// CATEGORÍAS
// ==========================================

export interface CategoriaInventario {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  activa: number;
}

// ==========================================
// MOVIMIENTOS DE INVENTARIO
// ==========================================

export type TipoMovimientoInventario = "ENTRADA" | "SALIDA" | "AJUSTE";

export interface MovimientoInventario {
  id_movimiento: number;
  id_producto: number;
  producto: string;
  id_usuario: number;
  id_solicitud: number | null;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  motivo: string;
  fecha_movimiento: string;
}

// ==========================================
// REGISTRAR PRODUCTO
// ==========================================

export interface NuevoProducto {
  id_categoria: number;
  nombre: string;
  presentacion?: string | null;
  descripcion?: string | null;
  precio: number;
  stock: number;
  stock_minimo: number;
  imagen_url?: string | null;
  disponible?: boolean;
}

// ==========================================
// ACTUALIZAR PRODUCTO
// ==========================================

export interface ActualizarProducto {
  id_categoria?: number;
  nombre?: string;
  presentacion?: string | null;
  descripcion?: string | null;
  precio?: number;
  stock_minimo?: number;
  imagen_url?: string | null;
  disponible?: boolean;
}

// ==========================================
// REGISTRAR MOVIMIENTO
// ==========================================

export interface NuevoMovimientoInventario {
  id_producto: number;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  motivo: string;
}

export interface ResultadoMovimientoInventario {
  id_movimiento: number;
  id_producto: number;
  tipo: TipoMovimientoInventario;
  stock_anterior: number;
  stock_actual: number;
  mensaje: string;
}

// ==========================================
// REABASTECIMIENTO MÚLTIPLE
// ==========================================

// Producto y cantidad que se desea agregar.

export interface ProductoReabastecimiento {
  id_producto: number;
  cantidad: number;
}

// Datos enviados al backend.

export interface NuevoReabastecimientoMultiple {
  productos: ProductoReabastecimiento[];
  motivo: string;
}

// Resultado de cada producto actualizado.

export interface DetalleReabastecimiento {
  id_movimiento: number;
  id_producto: number;
  cantidad: number;
  stock_anterior: number;
  stock_actual: number;
}

// Respuesta completa del backend.

export interface ResultadoReabastecimientoMultiple {
  mensaje: string;
  productos_actualizados: number;
  unidades_agregadas: number;
  movimientos: DetalleReabastecimiento[];
}
