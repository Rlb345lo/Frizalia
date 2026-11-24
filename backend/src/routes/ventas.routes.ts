import { Router } from "express";

import {
  crearVenta,
  listarVentas,
  consultarVenta,
} from "../controllers/ventas.controller.js";

import { verificarToken } from "../middlewares/auth.middleware.js";

import { verificarAdministrador } from "../middlewares/admin.middleware.js";

// ==========================================
// RUTAS DEL MODULO DE VENTAS
// ==========================================

const router = Router();

// ==========================================
// PROTEGER TODAS LAS RUTAS
// ==========================================

// Verificar que exista un token JWT valido.
router.use(verificarToken);

// Verificar que el usuario sea administrador.
router.use(verificarAdministrador);

// ==========================================
// REGISTRAR VENTA
// POST /api/ventas
// ==========================================

router.post("/", crearVenta);

// ==========================================
// CONSULTAR HISTORIAL DE VENTAS
// GET /api/ventas
// ==========================================

router.get("/", listarVentas);

// ==========================================
// CONSULTAR VENTA POR ID
// GET /api/ventas/:id
// ==========================================

router.get("/:id", consultarVenta);

// ==========================================
// EXPORTAR RUTAS
// ==========================================

export default router;
