import type { Request, Response } from "express";

import type { RequestAutenticada } from "../middlewares/auth.middleware.js";

import {
  listarProductos,
  buscarProductoPorId,
} from "../repositories/productos.repository.js";

import {
  validarNuevoProducto,
  validarActualizacionProducto,
} from "../validators/productos.validator.js";

import {
  registrarProductoInventario,
  editarProductoInventario,
  ErrorInventario,
} from "../services/inventario.service.js";

// ==========================================
// OBTENER TODOS LOS PRODUCTOS
// ==========================================

export async function obtenerProductos(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    const productos = await listarProductos();

    res.status(200).json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error);

    res.status(500).json({
      mensaje: "Error al obtener los productos",
    });
  }
}

// ==========================================
// OBTENER PRODUCTO POR ID
// ==========================================

export async function obtenerProductoPorId(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const parametroId = req.params.id;

    if (typeof parametroId !== "string" || !/^[1-9]\d*$/.test(parametroId)) {
      res.status(400).json({
        mensaje: "El ID del producto debe ser un número entero positivo",
      });
      return;
    }

    const idProducto = Number(parametroId);

    if (!Number.isSafeInteger(idProducto)) {
      res.status(400).json({
        mensaje: "El ID del producto no es válido",
      });
      return;
    }

    const producto = await buscarProductoPorId(idProducto);

    if (!producto) {
      res.status(404).json({
        mensaje: "Producto no encontrado",
      });
      return;
    }

    res.status(200).json(producto);
  } catch (error) {
    console.error("Error al obtener el producto:", error);

    res.status(500).json({
      mensaje: "Error al obtener el producto",
    });
  }
}

// ==========================================
// REGISTRAR NUEVO PRODUCTO
// ==========================================

export async function registrarProducto(
  req: RequestAutenticada,
  res: Response,
): Promise<void> {
  try {
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

    const validacion = validarNuevoProducto(req.body);

    if (!validacion.valido) {
      res.status(400).json({
        mensaje: "Los datos del producto no son válidos.",
        errores: validacion.errores,
      });
      return;
    }

    const resultado = await registrarProductoInventario(
      validacion.datos,
      idUsuario,
    );

    res.status(201).json(resultado);
  } catch (error) {
    if (error instanceof ErrorInventario) {
      res.status(error.codigoHTTP).json({
        mensaje: error.message,
      });
      return;
    }

    console.error("Error al registrar producto:", error);

    res.status(500).json({
      mensaje: "Error interno al registrar el producto.",
    });
  }
}

// ==========================================
// EDITAR PRODUCTO EXISTENTE
// ==========================================

export async function editarProducto(
  req: RequestAutenticada,
  res: Response,
): Promise<void> {
  try {
    // ======================================
    // VERIFICAR USUARIO AUTENTICADO
    // ======================================

    if (
      typeof req.idUsuario !== "number" ||
      !Number.isSafeInteger(req.idUsuario) ||
      req.idUsuario <= 0
    ) {
      res.status(401).json({
        mensaje: "No se encontró un usuario autenticado.",
      });
      return;
    }

    // ======================================
    // VALIDAR ID DEL PRODUCTO
    // ======================================

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

    // ======================================
    // VALIDAR DATOS DE ACTUALIZACIÓN
    // ======================================

    const validacion = validarActualizacionProducto(req.body);

    if (!validacion.valido) {
      res.status(400).json({
        mensaje: "Los datos de actualización no son válidos.",
        errores: validacion.errores,
      });
      return;
    }

    // ======================================
    // ACTUALIZAR PRODUCTO
    // ======================================

    const resultado = await editarProductoInventario(
      idProducto,
      validacion.datos,
    );

    // ======================================
    // RESPONDER AL CLIENTE
    // ======================================

    res.status(200).json(resultado);
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

    console.error("Error al editar producto:", error);

    res.status(500).json({
      mensaje: "Error interno al editar el producto.",
    });
  }
}
