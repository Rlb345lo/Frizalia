
import type { RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";

export interface Producto extends RowDataPacket {
  id_producto: number;
  nombre: string;
  descripcion: string | null;
  precio: string;
  stock: number;
  imagen_url: string | null;
  disponible: number;
  categoria: string;
}

export async function listarProductos(): Promise<Producto[]> {
  const [productos] = await pool.query<Producto[]>(`
    SELECT
      p.id_producto,
      p.nombre,
      p.descripcion,
      p.precio,
      p.stock,
      p.imagen_url,
      p.disponible,
      c.nombre AS categoria
    FROM productos p
    INNER JOIN categorias c
      ON p.id_categoria = c.id_categoria
    ORDER BY p.id_producto
  `);

  return productos;
}
