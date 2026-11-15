import type { RowDataPacket } from "mysql2";
import { pool } from "../config/database.js";

// ==========================================
// TIPOS
// ==========================================

export interface Categoria extends RowDataPacket {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  activa: number;
}

// ==========================================
// LISTAR CATEGORÍAS
// ==========================================

export async function listarCategorias(): Promise<Categoria[]> {
  const [categorias] = await pool.query<Categoria[]>(`
    SELECT
      id_categoria,
      nombre,
      descripcion,
      activa
    FROM categorias
    ORDER BY nombre ASC
  `);

  return categorias;
}

// ==========================================
// LISTAR CATEGORÍAS ACTIVAS
// ==========================================

export async function listarCategoriasActivas(): Promise<Categoria[]> {
  const [categorias] = await pool.query<Categoria[]>(`
    SELECT
      id_categoria,
      nombre,
      descripcion,
      activa
    FROM categorias
    WHERE activa = 1
    ORDER BY nombre ASC
  `);

  return categorias;
}
