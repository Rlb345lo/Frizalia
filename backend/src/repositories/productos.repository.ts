import type { ResultSetHeader, RowDataPacket } from "mysql2";

import type { PoolConnection } from "mysql2/promise";

import { pool } from "../config/database.js";

import type { NuevoProducto } from "../types/inventario.js";

// ==========================================
// TIPOS
// ==========================================

export interface Producto extends RowDataPacket {
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
// CONSULTA BASE DE PRODUCTOS
// ==========================================

const consultaProductos = `
  SELECT
    p.id_producto,
    p.id_categoria,
    p.nombre,
    p.presentacion,
    p.descripcion,
    p.precio,
    p.stock,
    p.stock_minimo,
    p.imagen_url,
    p.disponible,
    c.nombre AS categoria
  FROM productos AS p
  INNER JOIN categorias AS c
    ON p.id_categoria = c.id_categoria
`;

// ==========================================
// LISTAR TODOS LOS PRODUCTOS
// ==========================================

export async function listarProductos(): Promise<Producto[]> {
  const [productos] = await pool.query<Producto[]>(`
    ${consultaProductos}
    ORDER BY p.id_producto ASC
  `);

  return productos;
}

// ==========================================
// BUSCAR PRODUCTO POR ID
// ==========================================

export async function buscarProductoPorId(
  idProducto: number,
): Promise<Producto | null> {
  const [productos] = await pool.execute<Producto[]>(
    `
      ${consultaProductos}
      WHERE p.id_producto = ?
      LIMIT 1
    `,
    [idProducto],
  );

  return productos[0] ?? null;
}

// ==========================================
// CREAR NUEVO PRODUCTO
// ==========================================

export async function crearProducto(
  datos: NuevoProducto,
  conexion: PoolConnection,
): Promise<number> {
  const [resultado] = await conexion.execute<ResultSetHeader>(
    `
      INSERT INTO productos (
        id_categoria,
        nombre,
        presentacion,
        descripcion,
        precio,
        stock,
        stock_minimo,
        imagen_url,
        disponible
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      datos.id_categoria,
      datos.nombre,
      datos.presentacion ?? null,
      datos.descripcion ?? null,
      datos.precio,
      datos.stock,
      datos.stock_minimo,
      datos.imagen_url ?? null,
      datos.disponible === false ? 0 : 1,
    ],
  );

  return resultado.insertId;
}
