import type {
  ActualizarProducto,
  CategoriaInventario,
  MovimientoInventario,
  NuevoMovimientoInventario,
  NuevoProducto,
  NuevoReabastecimientoMultiple,
  ProductoInventario,
  ResultadoMovimientoInventario,
  ResultadoReabastecimientoMultiple,
} from "../types/inventario";

const API_URL = "http://localhost:3000/api";

// ==========================================
// TIPOS DE RESPUESTA
// ==========================================

interface RespuestaError {
  mensaje?: string;
  errores?: string[];
}

// ==========================================
// PROCESAR RESPUESTA DEL SERVIDOR
// ==========================================

async function procesarRespuesta<T>(respuesta: Response): Promise<T> {
  const datos: unknown = await respuesta.json();

  if (!respuesta.ok) {
    const error = datos as RespuestaError;

    const mensaje =
      error.errores?.join(", ") ||
      error.mensaje ||
      `Error HTTP ${respuesta.status}`;

    throw new Error(mensaje);
  }

  return datos as T;
}

// ==========================================
// OBTENER HEADERS
// ==========================================

function obtenerHeaders(token?: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ==========================================
// PRODUCTOS
// ==========================================

export async function obtenerProductos(): Promise<ProductoInventario[]> {
  const respuesta = await fetch(`${API_URL}/productos`);

  return procesarRespuesta<ProductoInventario[]>(respuesta);
}

export async function obtenerProductoPorId(
  idProducto: number,
): Promise<ProductoInventario> {
  const respuesta = await fetch(`${API_URL}/productos/${idProducto}`);

  return procesarRespuesta<ProductoInventario>(respuesta);
}

export async function crearProducto(
  datos: NuevoProducto,
  token: string,
): Promise<ProductoInventario> {
  const respuesta = await fetch(`${API_URL}/productos`, {
    method: "POST",
    headers: obtenerHeaders(token),
    body: JSON.stringify(datos),
  });

  return procesarRespuesta<ProductoInventario>(respuesta);
}

export async function editarProducto(
  idProducto: number,
  datos: ActualizarProducto,
  token: string,
): Promise<ProductoInventario> {
  const respuesta = await fetch(`${API_URL}/productos/${idProducto}`, {
    method: "PATCH",
    headers: obtenerHeaders(token),
    body: JSON.stringify(datos),
  });

  return procesarRespuesta<ProductoInventario>(respuesta);
}

// ==========================================
// CATEGORÍAS
// ==========================================

export async function obtenerCategorias(): Promise<CategoriaInventario[]> {
  const respuesta = await fetch(`${API_URL}/categorias`);

  return procesarRespuesta<CategoriaInventario[]>(respuesta);
}

// ==========================================
// MOVIMIENTOS DE INVENTARIO
// ==========================================

export async function obtenerMovimientosInventario(
  token: string,
): Promise<MovimientoInventario[]> {
  const respuesta = await fetch(`${API_URL}/movimientos-inventario`, {
    headers: obtenerHeaders(token),
  });

  return procesarRespuesta<MovimientoInventario[]>(respuesta);
}

export async function obtenerMovimientosPorProducto(
  idProducto: number,
  token: string,
): Promise<MovimientoInventario[]> {
  const respuesta = await fetch(
    `${API_URL}/movimientos-inventario/producto/${idProducto}`,
    {
      headers: obtenerHeaders(token),
    },
  );

  return procesarRespuesta<MovimientoInventario[]>(respuesta);
}

export async function registrarMovimientoInventario(
  datos: NuevoMovimientoInventario,
  token: string,
): Promise<ResultadoMovimientoInventario> {
  const respuesta = await fetch(`${API_URL}/movimientos-inventario`, {
    method: "POST",
    headers: obtenerHeaders(token),
    body: JSON.stringify(datos),
  });

  return procesarRespuesta<ResultadoMovimientoInventario>(respuesta);
}

// ==========================================
// NUEVO: REABASTECIMIENTO MÚLTIPLE
// ==========================================

export async function registrarReabastecimientoMultiple(
  datos: NuevoReabastecimientoMultiple,
  token: string,
): Promise<ResultadoReabastecimientoMultiple> {
  const respuesta = await fetch(
    `${API_URL}/movimientos-inventario/reabastecimiento-multiple`,
    {
      method: "POST",
      headers: obtenerHeaders(token),
      body: JSON.stringify(datos),
    },
  );

  return procesarRespuesta<ResultadoReabastecimientoMultiple>(respuesta);
}
