import { Router } from "express";

import {
  obtenerCajaActual,
  obtenerHistorialCaja,
  obtenerResumenCaja,
  registrarAperturaCaja,
  registrarCierreCaja,
} from "../controllers/caja.controller.js";

import { verificarToken } from "../middlewares/auth.middleware.js";

import { verificarAdministrador } from "../middlewares/admin.middleware.js";

// ==========================================
// RUTAS DEL MODULO DE CAJA
// ==========================================

const router = Router();

// ==========================================
// PROTEGER TODAS LAS RUTAS
// ==========================================

router.use(verificarToken);
router.use(verificarAdministrador);

// ==========================================
// CONSULTAR CAJA ABIERTA
// GET /api/caja/actual
// ==========================================

router.get("/actual", obtenerCajaActual);

// ==========================================
// CONSULTAR HISTORIAL DE CAJAS
// GET /api/caja/historial
// ==========================================

router.get("/historial", obtenerHistorialCaja);

// ==========================================
// ABRIR CAJA
// POST /api/caja/abrir
// ==========================================

router.post("/abrir", registrarAperturaCaja);

// ==========================================
// CERRAR CAJA
// POST /api/caja/:id/cerrar
// ==========================================

router.post("/:id/cerrar", registrarCierreCaja);

// ==========================================
// CONSULTAR RESUMEN POR ID
// GET /api/caja/:id/resumen
// ==========================================

router.get("/:id/resumen", obtenerResumenCaja);

// ==========================================
// EXPORTAR RUTAS
// ==========================================

export default router;
