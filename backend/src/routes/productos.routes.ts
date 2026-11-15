import { Router } from "express";

import {
  obtenerProductos,
  obtenerProductoPorId,
  registrarProducto,
  editarProducto,
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
// Solo administradores autenticados

router.post("/", verificarToken, verificarAdministrador, registrarProducto);

// ==========================================
// EDITAR PRODUCTO EXISTENTE
// ==========================================

// PATCH /api/productos/:id
// Solo administradores autenticados

router.patch("/:id", verificarToken, verificarAdministrador, editarProducto);

// ==========================================
// OBTENER PRODUCTO POR ID
// ==========================================

// GET /api/productos/:id
router.get("/:id", obtenerProductoPorId);

// ==========================================
// EXPORTAR RUTAS
// ==========================================

export default router;
