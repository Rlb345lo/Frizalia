import type { Response } from "express";

import type { RequestAutenticada } from "../middlewares/auth.middleware.js";

import {
  ErrorVenta,
  registrarVenta,
  obtenerVentaPorId,
  obtenerHistorialVentas,
} from "../services/ventas.service.js";

import type { NuevaVenta, ProductoCarritoVenta } from "../types/ventas.js";

// ==========================================
// VALIDAR OBJETOS
// ==========================================

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

// ==========================================
// OBTENER USUARIO AUTENTICADO
// ==========================================

function obtenerIdUsuario(req: RequestAutenticada): number | null {
  const idUsuario = req.idUsuario;

  if (
    typeof idUsuario !== "number" ||
    !Number.isSafeInteger(idUsuario) ||
    idUsuario <= 0
  ) {
    return null;
  }

  return idUsuario;
}

// ==========================================
// VALIDAR ID DE VENTA
// ==========================================

function obtenerIdVenta(valor: unknown): number | null {
  if (typeof valor !== "string" || !/^\d+$/.test(valor)) {
    return null;
  }

  const idVenta = Number(valor);

  if (!Number.isSafeInteger(idVenta) || idVenta <= 0) {
    return null;
  }

  return idVenta;
}

// ==========================================
// VALIDAR ESTRUCTURA DE NUEVA VENTA
// ==========================================

function obtenerDatosVenta(valor: unknown): NuevaVenta | null {
  if (!esObjeto(valor) || !Array.isArray(valor.productos)) {
    return null;
  }

  if (valor.metodo_pago !== "EFECTIVO" && valor.metodo_pago !== "TARJETA") {
    return null;
  }

  const montoRecibido = valor.monto_recibido;

  if (montoRecibido !== undefined && typeof montoRecibido !== "number") {
    return null;
  }

  const productos: ProductoCarritoVenta[] = [];

  for (const item of valor.productos) {
    if (
      !esObjeto(item) ||
      typeof item.id_producto !== "number" ||
      typeof item.cantidad !== "number"
    ) {
      return null;
    }

    productos.push({
      id_producto: item.id_producto,
      cantidad: item.cantidad,
    });
  }

  const datos: NuevaVenta = {
    productos,
    metodo_pago: valor.metodo_pago,
  };

  if (typeof montoRecibido === "number") {
    datos.monto_recibido = montoRecibido;
  }

  return datos;
}

// ==========================================
// MANEJAR ERRORES DE VENTAS
// ==========================================

function manejarErrorVenta(
  error: unknown,
  res: Response,
  operacion: string,
): void {
  if (error instanceof ErrorVenta) {
    res.status(error.codigoHTTP).json({
      mensaje: error.message,
    });

    return;
  }

  console.error(`Error al ${operacion}:`, error);

  res.status(500).json({
    mensaje: "Ocurrió un error interno del servidor.",
  });
}

// ==========================================
// REGISTRAR VENTA
// POST /api/ventas
// ==========================================

export async function crearVenta(
  req: RequestAutenticada,
  res: Response,
): Promise<void> {
  try {
    // ======================================
    // VERIFICAR USUARIO
    // ======================================

    const idUsuario = obtenerIdUsuario(req);

    if (idUsuario === null) {
      res.status(401).json({
        mensaje: "Usuario no autenticado.",
      });

      return;
    }

    // ======================================
    // VALIDAR CUERPO
    // ======================================

    const cuerpo: unknown = req.body;

    const datos = obtenerDatosVenta(cuerpo);

    if (!datos) {
      res.status(400).json({
        mensaje: "Los datos de la venta no tienen un formato válido.",
      });

      return;
    }

    // ======================================
    // REGISTRAR VENTA
    // ======================================

    const resultado = await registrarVenta(datos, idUsuario);

    // ======================================
    // RESPUESTA
    // ======================================

    res.status(201).json(resultado);
  } catch (error) {
    manejarErrorVenta(error, res, "registrar la venta");
  }
}

// ==========================================
// CONSULTAR HISTORIAL
// GET /api/ventas
// ==========================================

export async function listarVentas(
  _req: RequestAutenticada,
  res: Response,
): Promise<void> {
  try {
    const historial = await obtenerHistorialVentas();

    res.status(200).json(historial);
  } catch (error) {
    manejarErrorVenta(error, res, "consultar el historial de ventas");
  }
}

// ==========================================
// CONSULTAR VENTA POR ID
// GET /api/ventas/:id
// ==========================================

export async function consultarVenta(
  req: RequestAutenticada,
  res: Response,
): Promise<void> {
  try {
    // ======================================
    // VALIDAR ID
    // ======================================

    const idVenta = obtenerIdVenta(req.params.id);

    if (idVenta === null) {
      res.status(400).json({
        mensaje: "El ID de venta no es válido.",
      });

      return;
    }

    // ======================================
    // CONSULTAR VENTA
    // ======================================

    const resultado = await obtenerVentaPorId(idVenta);

    // ======================================
    // RESPUESTA
    // ======================================

    res.status(200).json(resultado);
  } catch (error) {
    manejarErrorVenta(error, res, "consultar los detalles de la venta");
  }
}
