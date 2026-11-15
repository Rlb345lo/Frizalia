
import { Router } from "express";

import {
  obtenerCategorias,
  obtenerCategoriasActivas,
} from "../controllers/categorias.controller.js";

// ==========================================
// CONFIGURACIÓN DE RUTAS
// ==========================================

const router = Router();

// ==========================================
// OBTENER TODAS LAS CATEGORÍAS
// ==========================================

// GET /api/categorias
router.get("/", obtenerCategorias);

// ==========================================
// OBTENER CATEGORÍAS ACTIVAS
// ==========================================

// GET /api/categorias/activas
router.get("/activas", obtenerCategoriasActivas);

// ==========================================
// EXPORTAR RUTAS
// ==========================================

export default router;
