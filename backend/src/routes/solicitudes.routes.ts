import { Router } from "express";

import { verificarToken } from "../middlewares/auth.middleware.js";

import {
  verificarClienteActivo,
  verificarPersonalActivo,
} from "../middlewares/solicitudes.middleware.js";

import {
  crearSolicitudController,
  obtenerMisSolicitudesController,
  obtenerSolicitudPorIdController,
  obtenerTodasLasSolicitudesController,
  aceptarSolicitudController,
  rechazarSolicitudController,
  actualizarEstadoPreparacionController,
  solicitarCancelacionController,
  aprobarCancelacionController,
  rechazarCancelacionController,
  cobrarSolicitudController,
} from "../controllers/solicitudes.controller.js";

// ==========================================
// CONFIGURAR ROUTER
// ==========================================

const router = Router();

// ==========================================
// CREAR UNA SOLICITUD
// ==========================================

router.post(
  "/",
  verificarToken,
  verificarClienteActivo,
  crearSolicitudController,
);

// ==========================================
// CONSULTAR MIS PEDIDOS
// ==========================================

router.get(
  "/mis-pedidos",
  verificarToken,
  verificarClienteActivo,
  obtenerMisSolicitudesController,
);

// ==========================================
// CONSULTAR TODAS LAS SOLICITUDES
// ADMINISTRADOR Y EMPLEADO
// ==========================================

router.get(
  "/admin/todas",
  verificarToken,
  verificarPersonalActivo,
  obtenerTodasLasSolicitudesController,
);

// ==========================================
// ACEPTAR SOLICITUD
// ==========================================

router.patch(
  "/admin/:id/aceptar",
  verificarToken,
  verificarPersonalActivo,
  aceptarSolicitudController,
);

// ==========================================
// RECHAZAR SOLICITUD
// ==========================================

router.patch(
  "/admin/:id/rechazar",
  verificarToken,
  verificarPersonalActivo,
  rechazarSolicitudController,
);

// ==========================================
// APROBAR CANCELACIÓN DE PEDIDO
// ADMINISTRADOR / EMPLEADO
// ==========================================

router.patch(
  "/admin/:id/aprobar-cancelacion",
  verificarToken,
  verificarPersonalActivo,
  aprobarCancelacionController,
);

// ==========================================
// ACTUALIZAR ESTADO DE PREPARACIÓN
// ==========================================

router.patch(
  "/admin/:id/estado",
  verificarToken,
  verificarPersonalActivo,
  actualizarEstadoPreparacionController,
);

// ==========================================
// SOLICITAR CANCELACIÓN
// CLIENTE
// ==========================================

router.patch(
  "/:id/solicitar-cancelacion",
  verificarToken,
  verificarClienteActivo,
  solicitarCancelacionController,
);

// ==========================================
// CONSULTAR UN PEDIDO INDIVIDUAL
// ==========================================

router.get(
  "/:id",
  verificarToken,
  verificarClienteActivo,
  obtenerSolicitudPorIdController,
);

// ==========================================
// RECHAZAR CANCELACIÓN DE PEDIDO
// ADMINISTRADOR / EMPLEADO
// ==========================================

router.patch(
  "/admin/:id/rechazar-cancelacion",
  verificarToken,
  verificarPersonalActivo,
  rechazarCancelacionController,
);

// ==========================================
// COBRAR Y ENTREGAR SOLICITUD
// ADMINISTRADOR / EMPLEADO
// ==========================================

router.post(
  "/admin/:id/cobrar",
  verificarToken,
  verificarPersonalActivo,
  cobrarSolicitudController,
);

export default router;
