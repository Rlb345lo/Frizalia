import type { Request, Response } from "express";

import type { RequestAutenticada } from "../middlewares/auth.middleware.js";

import {
  listarMovimientosInventario,
  listarMovimientosPorProducto,
} from "../repositories/movimientosInventario.repository.js";

import { buscarProductoPorId } from "../repositories/productos.repository.js";

import { validarNuevoMovimientoInventario } from "../validators/movimientosInventario.validator.js";

import {
  registrarMovimientoInventario,
  registrarReabastecimientoMultiple as registrarReabastecimientoMultipleServicio,
  ErrorInventario,
} from "../services/inventario.service.js";

import type { NuevoReabastecimientoMultiple } from "../services/inventario.service.js";

// ==========================================
// OBTENER HISTORIAL GENERAL
// ==========================================

export async function obtenerMovimientosInventario(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const movimientos = await listarMovimientosInventario();

    res.status(200).json(movimientos);
  } catch (error) {
    console.error("Error al obtener movimientos:", error);

    res.status(500).json({
      mensaje: "Error interno al obtener los movimientos de inventario.",
    });
  }
}

// ==========================================
// OBTENER HISTORIAL POR PRODUCTO
// ==========================================

export async function obtenerMovimientosPorProducto(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const parametroId = req.params.id;

    if (typeof parametroId !== "string" || !/^[1-9]\d*$/.test(parametroId)) {
      res.status(400).json({
        mensaje: "El ID del producto debe ser un número entero positivo.",
      });
      return;
    }

    const idProducto = Number(parametroId);

    if (!Number.isSafeInteger(idProducto)) {
      res.status(400).json({
        mensaje: "El ID del producto no es válido.",
      });
      return;
    }

    const producto = await buscarProductoPorId(idProducto);

    if (!producto) {
      res.status(404).json({
        mensaje: "Producto no encontrado.",
      });
      return;
    }

    const movimientos = await listarMovimientosPorProducto(idProducto);

    res.status(200).json(movimientos);
  } catch (error) {
    console.error("Error al obtener movimientos del producto:", error);

    res.status(500).json({
      mensaje: "Error interno al obtener los movimientos del producto.",
    });
  }
}

// ==========================================
// REGISTRAR MOVIMIENTO DE INVENTARIO
// ==========================================

export async function registrarMovimiento(
  req: RequestAutenticada,
  res: Response,
): Promise<void> {
  try {
    // ======================================
    // VERIFICAR USUARIO AUTENTICADO
    // ======================================

    const idUsuario = req.idUsuario;

    if (
      typeof idUsuario !== "number" ||
      !Number.isSafeInteger(idUsuario) ||
      idUsuario <= 0
    ) {
      res.status(401).json({
        mensaje: "No se encontró un usuario autenticado.",
      });
      return;
    }

    // ======================================
    // VALIDAR DATOS DEL MOVIMIENTO
    // ======================================

    const validacion = validarNuevoMovimientoInventario(req.body);

    if (!validacion.valido) {
      res.status(400).json({
        mensaje: "Los datos del movimiento no son válidos.",
        errores: validacion.errores,
      });
      return;
    }

    // ======================================
    // REGISTRAR MOVIMIENTO
    // ======================================

    const resultado = await registrarMovimientoInventario(
      validacion.datos,
      idUsuario,
    );

    res.status(201).json(resultado);
  } catch (error) {
    // ======================================
    // ERRORES CONTROLADOS
    // ======================================

    if (error instanceof ErrorInventario) {
      res.status(error.codigoHTTP).json({
        mensaje: error.message,
      });
      return;
    }

    // ======================================
    // ERRORES INESPERADOS
    // ======================================

    console.error("Error al registrar movimiento:", error);

    res.status(500).json({
      mensaje: "Error interno al registrar el movimiento de inventario.",
    });
  }
}

// ==========================================
// NUEVO: REGISTRAR REABASTECIMIENTO MÚLTIPLE
// ==========================================

export async function registrarReabastecimientoMultiple(
  req: RequestAutenticada,
  res: Response,
): Promise<void> {
  try {
    // ======================================
    // 1. VERIFICAR USUARIO AUTENTICADO
    // ======================================

    const idUsuario = req.idUsuario;

    if (
      typeof idUsuario !== "number" ||
      !Number.isSafeInteger(idUsuario) ||
      idUsuario <= 0
    ) {
      res.status(401).json({
        mensaje: "No se encontró un usuario autenticado.",
      });
      return;
    }

    // ======================================
    // 2. COMPROBAR ESTRUCTURA DE LA SOLICITUD
    // ======================================

    const cuerpo: unknown = req.body;

    if (
      typeof cuerpo !== "object" ||
      cuerpo === null ||
      Array.isArray(cuerpo)
    ) {
      res.status(400).json({
        mensaje: "El cuerpo de la solicitud debe ser un objeto válido.",
      });
      return;
    }

    // El servicio realizará las validaciones
    // detalladas de productos, cantidades y motivo.
    const datos = cuerpo as NuevoReabastecimientoMultiple;

    // ======================================
    // 3. REGISTRAR REABASTECIMIENTO
    // ======================================

    const resultado = await registrarReabastecimientoMultipleServicio(
      datos,
      idUsuario,
    );

    // ======================================
    // 4. RESPONDER CON EL RESULTADO
    // ======================================

    res.status(201).json(resultado);
  } catch (error) {
    // ======================================
    // 5. ERRORES CONTROLADOS
    // ======================================

    if (error instanceof ErrorInventario) {
      res.status(error.codigoHTTP).json({
        mensaje: error.message,
      });
      return;
    }

    // ======================================
    // 6. ERRORES INESPERADOS
    // ======================================

    console.error("Error al registrar reabastecimiento múltiple:", error);

    res.status(500).json({
      mensaje: "Error interno al registrar el reabastecimiento múltiple.",
    });
  }
}
