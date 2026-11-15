import { Router } from "express";

import {
  obtenerMovimientosInventario,
  obtenerMovimientosPorProducto,
  registrarMovimiento,
  registrarReabastecimientoMultiple,
} from "../controllers/movimientosInventario.controller.js";

import { verificarToken } from "../middlewares/auth.middleware.js";

import { verificarAdministrador } from "../middlewares/admin.middleware.js";

// ==========================================
// CONFIGURACIÓN DEL ROUTER
// ==========================================

const router = Router();

// ==========================================
// PROTEGER TODAS LAS RUTAS
// ==========================================

// Todas las solicitudes requieren:
// 1. Un token JWT válido.
// 2. Permisos de administrador.

router.use(verificarToken, verificarAdministrador);

// ==========================================
// CONSULTAR HISTORIAL GENERAL
// ==========================================

// GET /api/movimientos-inventario

router.get("/", obtenerMovimientosInventario);

// ==========================================
// CONSULTAR HISTORIAL POR PRODUCTO
// ==========================================

// GET /api/movimientos-inventario/producto/:id

router.get("/producto/:id", obtenerMovimientosPorProducto);

// ==========================================
// REGISTRAR REABASTECIMIENTO MÚLTIPLE
// ==========================================

// POST /api/movimientos-inventario/reabastecimiento-multiple
//
// Permite registrar entradas de stock para varios
// productos dentro de una única transacción MySQL.
//
// Si falla alguno de los productos, el servicio
// cancela todos los cambios.

router.post("/reabastecimiento-multiple", registrarReabastecimientoMultiple);

// ==========================================
// REGISTRAR MOVIMIENTO INDIVIDUAL
// ==========================================

// POST /api/movimientos-inventario

router.post("/", registrarMovimiento);

// ==========================================
// EXPORTAR ROUTER
// ==========================================

export default router;
