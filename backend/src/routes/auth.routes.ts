
import { Router } from "express";

import {
  registro,
  registroAdmin,
  login,
  perfil,
} from "../controllers/auth.controller.js";

import {
  verificarToken,
} from "../middlewares/auth.middleware.js";

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

const router = Router();

// Registrar un nuevo cliente
router.post("/registro", registro);
router.post("/registro-admin", registroAdmin);

// Iniciar sesión
router.post("/login", login);

// Consultar perfil del usuario autenticado
router.get("/perfil", verificarToken, perfil);

export default router;
