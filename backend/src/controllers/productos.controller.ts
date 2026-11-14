
import type { Request, Response } from "express";
import { listarProductos } from "../repositories/productos.repository.js";

export async function obtenerProductos(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const productos = await listarProductos();

    res.status(200).json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error);

    res.status(500).json({
      mensaje: "Error al obtener los productos",
    });
  }
}
