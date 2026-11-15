import { Router } from "express";

import { verificarToken } from "../middlewares/auth.middleware.js";
import { verificarAdministrador } from "../middlewares/admin.middleware.js";

import { obtenerResumen } from "../controllers/dashboard.controller.js";

// ==========================================
// CONFIGURAR RUTAS DEL DASHBOARD
// ==========================================

const router = Router();

// ==========================================
// OBTENER RESUMEN GENERAL
// ==========================================

// Solo administradores autenticados y activos
router.get("/resumen", verificarToken, verificarAdministrador, obtenerResumen);

// ==========================================
// EXPORTAR RUTAS
// ==========================================

export default router;
