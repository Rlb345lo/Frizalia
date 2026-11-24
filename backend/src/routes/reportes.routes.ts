
import { Router } from "express";

import {
  reporteVentasController,
  reporteInventarioController,
  reporteCajaController,
  reporteSolicitudesController,
} from "../controllers/reportes.controller.js";

import {
  verificarToken,
} from "../middlewares/auth.middleware.js";

import {
  verificarAdministrador,
} from "../middlewares/admin.middleware.js";

const router = Router();

// ==========================================
// SEGURIDAD
// ==========================================

router.use(verificarToken);
router.use(verificarAdministrador);

// ==========================================
// RUTAS DE REPORTES
// ==========================================

router.get("/ventas", reporteVentasController);

router.get("/inventario", reporteInventarioController);

router.get("/caja", reporteCajaController);

router.get("/solicitudes", reporteSolicitudesController);

export default router;
