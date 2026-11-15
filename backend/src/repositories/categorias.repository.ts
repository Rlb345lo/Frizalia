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
// LISTAR TODAS LAS CATEGORÍAS
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

// ==========================================
// BUSCAR CATEGORÍA POR ID
// ==========================================

export async function buscarCategoriaPorId(
  idCategoria: number,
): Promise<Categoria | null> {
  const [categorias] = await pool.execute<Categoria[]>(
    `
      SELECT
        id_categoria,
        nombre,
        descripcion,
        activa
      FROM categorias
      WHERE id_categoria = ?
      LIMIT 1
    `,
    [idCategoria],
  );

  return categorias[0] ?? null;
}

// ==========================================
// VERIFICAR CATEGORÍA ACTIVA
// ==========================================

export async function categoriaEstaActiva(
  idCategoria: number,
): Promise<boolean> {
  const categoria = await buscarCategoriaPorId(idCategoria);

  return categoria !== null && categoria.activa === 1;
}
