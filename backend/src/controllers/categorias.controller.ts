import type { Request, Response } from "express";

import {
  listarCategorias,
  listarCategoriasActivas,
} from "../repositories/categorias.repository.js";

// ==========================================
// OBTENER TODAS LAS CATEGORÍAS
// ==========================================

export async function obtenerCategorias(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const categorias = await listarCategorias();

    res.status(200).json(categorias);
  } catch (error) {
    console.error("Error al obtener las categorías:", error);

    res.status(500).json({
      mensaje: "Error al obtener las categorías",
    });
  }
}

// ==========================================
// OBTENER CATEGORÍAS ACTIVAS
// ==========================================

export async function obtenerCategoriasActivas(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const categorias = await listarCategoriasActivas();

    res.status(200).json(categorias);
  } catch (error) {
    console.error("Error al obtener las categorías activas:", error);

    res.status(500).json({
      mensaje: "Error al obtener las categorías activas",
    });
  }
}
