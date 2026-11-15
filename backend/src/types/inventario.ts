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
// MOVIMIENTOS DE INVENTARIO
// ==========================================

export type TipoMovimientoInventario = "ENTRADA" | "SALIDA" | "AJUSTE";

export interface NuevoMovimientoInventario {
  id_producto: number;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  motivo: string;
}

export interface MovimientoInventario {
  id_movimiento: number;
  id_producto: number;
  id_usuario: number;
  id_solicitud: number | null;
  tipo: TipoMovimientoInventario;
  cantidad: number;
  motivo: string;
  fecha_movimiento: string;
}
