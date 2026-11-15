import { Router } from "express";

import {
  obtenerProductos,
  obtenerProductoPorId,
  registrarProducto,
} from "../controllers/productos.controller.js";

import { verificarToken } from "../middlewares/auth.middleware.js";

import { verificarAdministrador } from "../middlewares/admin.middleware.js";

// ==========================================
// CONFIGURACIÓN DE RUTAS
// ==========================================

const router = Router();

// ==========================================
// OBTENER TODOS LOS PRODUCTOS
// ==========================================

// GET /api/productos
router.get("/", obtenerProductos);

// ==========================================
// REGISTRAR NUEVO PRODUCTO
// ==========================================

// POST /api/productos
// Requiere JWT y permisos de administrador.

router.post("/", verificarToken, verificarAdministrador, registrarProducto);

// ==========================================
// OBTENER PRODUCTO POR ID
// ==========================================

// GET /api/productos/:id
router.get("/:id", obtenerProductoPorId);

// ==========================================
// EXPORTAR RUTAS
// ==========================================

export default router;
