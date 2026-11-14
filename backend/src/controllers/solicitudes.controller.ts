import type { Request, Response } from "express";

import {
  crearSolicitud,
  obtenerMisSolicitudes,
  obtenerSolicitudPorId,
  obtenerTodasLasSolicitudes,
  aceptarSolicitud,
  rechazarSolicitud,
  actualizarEstadoPreparacion,
  solicitarCancelacion,
  ErrorSolicitud,
  aprobarCancelacion,
  rechazarCancelacion,
} from "../services/solicitudes.service.js";

import type { RequestAutenticada } from "../middlewares/auth.middleware.js";

// ==========================================
// CONTROLADOR: CREAR SOLICITUD
// ==========================================

export async function crearSolicitudController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const solicitud = req as RequestAutenticada;

    const idUsuario = solicitud.idUsuario;

    if (!idUsuario) {
      res.status(401).json({
        mensaje: "Debes iniciar sesión para realizar un pedido",
      });
      return;
    }

    const resultado = await crearSolicitud(idUsuario, req.body);

    res.status(201).json(resultado);
  } catch (error) {
    if (error instanceof ErrorSolicitud) {
      res.status(error.estado).json({
        mensaje: error.message,
      });
      return;
    }

    console.error("Error al crear la solicitud:", error);

    res.status(500).json({
      mensaje: "Ocurrió un error al registrar la solicitud",
    });
  }
}

// ==========================================
// CONTROLADOR: CONSULTAR MIS PEDIDOS
// ==========================================

export async function obtenerMisSolicitudesController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const solicitud = req as RequestAutenticada;

    const idUsuario = solicitud.idUsuario;

    if (!idUsuario) {
      res.status(401).json({
        mensaje: "Debes iniciar sesión para consultar tus pedidos",
      });
      return;
    }

    const resultado = await obtenerMisSolicitudes(idUsuario);

    res.status(200).json(resultado);
  } catch (error) {
    if (error instanceof ErrorSolicitud) {
      res.status(error.estado).json({
        mensaje: error.message,
      });
      return;
    }

    console.error("Error al consultar las solicitudes:", error);

    res.status(500).json({
      mensaje: "Ocurrió un error al consultar tus pedidos",
    });
  }
}

// ==========================================
// CONTROLADOR: CONSULTAR PEDIDO INDIVIDUAL
// ==========================================

export async function obtenerSolicitudPorIdController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const solicitud = req as RequestAutenticada;

    // Obtener ID del usuario desde el JWT
    const idUsuario = solicitud.idUsuario;

    if (!idUsuario) {
      res.status(401).json({
        mensaje: "Debes iniciar sesión para consultar el pedido",
      });
      return;
    }

    // Obtener el ID de la solicitud desde la URL
    const parametroId = req.params.id;

    // Validar que sea un número entero positivo
    if (typeof parametroId !== "string" || !/^[1-9]\d*$/.test(parametroId)) {
      res.status(400).json({
        mensaje: "El identificador de la solicitud no es válido",
      });
      return;
    }

    const idSolicitud = Number(parametroId);

    // Consultar pedido mediante el servicio
    const resultado = await obtenerSolicitudPorId(idUsuario, idSolicitud);

    res.status(200).json(resultado);
  } catch (error) {
    if (error instanceof ErrorSolicitud) {
      res.status(error.estado).json({
        mensaje: error.message,
      });
      return;
    }

    console.error("Error al consultar el pedido:", error);

    res.status(500).json({
      mensaje: "Ocurrió un error al consultar el pedido",
    });
  }
}

// ==========================================
// CONTROLADOR: CONSULTAR TODAS LAS SOLICITUDES
// ADMINISTRADOR Y EMPLEADO
// ==========================================

export async function obtenerTodasLasSolicitudesController(
  _req: Request,
  res: Response,
): Promise<void> {
  try {
    // Consultar todos los pedidos registrados
    const resultado = await obtenerTodasLasSolicitudes();

    res.status(200).json(resultado);
  } catch (error) {
    if (error instanceof ErrorSolicitud) {
      res.status(error.estado).json({
        mensaje: error.message,
      });
      return;
    }

    console.error("Error al consultar todas las solicitudes:", error);

    res.status(500).json({
      mensaje: "Ocurrió un error al consultar las solicitudes",
    });
  }
}

// ==========================================
// CONTROLADOR: ACEPTAR SOLICITUD
// ADMINISTRADOR Y EMPLEADO
// ==========================================

export async function aceptarSolicitudController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const solicitud = req as RequestAutenticada;

    // Obtener el ID del personal autenticado
    const idUsuarioPersonal = solicitud.idUsuario;

    if (!idUsuarioPersonal) {
      res.status(401).json({
        mensaje: "Debes iniciar sesión para aceptar pedidos",
      });
      return;
    }

    // Obtener el identificador del pedido desde la URL
    const parametroId = req.params.id;

    // Validar que sea un entero positivo
    if (typeof parametroId !== "string" || !/^[1-9]\d*$/.test(parametroId)) {
      res.status(400).json({
        mensaje: "El identificador de la solicitud no es válido",
      });
      return;
    }

    const idSolicitud = Number(parametroId);

    // Validar que el número sea seguro
    if (!Number.isSafeInteger(idSolicitud)) {
      res.status(400).json({
        mensaje: "El identificador de la solicitud no es válido",
      });
      return;
    }

    // Aceptar el pedido mediante el servicio
    const resultado = await aceptarSolicitud(idSolicitud, idUsuarioPersonal);

    res.status(200).json(resultado);
  } catch (error) {
    if (error instanceof ErrorSolicitud) {
      res.status(error.estado).json({
        mensaje: error.message,
      });
      return;
    }

    console.error("Error al aceptar la solicitud:", error);

    res.status(500).json({
      mensaje: "Ocurrió un error al aceptar la solicitud",
    });
  }
}

// ==========================================
// CONTROLADOR: RECHAZAR SOLICITUD
// ADMINISTRADOR Y EMPLEADO
// ==========================================

export async function rechazarSolicitudController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const solicitud = req as RequestAutenticada;

    // Obtener el usuario autenticado
    const idUsuarioPersonal = solicitud.idUsuario;

    if (!idUsuarioPersonal) {
      res.status(401).json({
        mensaje: "Debes iniciar sesión para rechazar pedidos",
      });
      return;
    }

    // Obtener el ID de la solicitud desde la URL
    const parametroId = req.params.id;

    // Validar que sea un número entero positivo
    if (typeof parametroId !== "string" || !/^[1-9]\d*$/.test(parametroId)) {
      res.status(400).json({
        mensaje: "El identificador de la solicitud no es válido",
      });
      return;
    }

    const idSolicitud = Number(parametroId);

    // Comprobar que sea un entero seguro
    if (!Number.isSafeInteger(idSolicitud)) {
      res.status(400).json({
        mensaje: "El identificador de la solicitud no es válido",
      });
      return;
    }

    // Obtener el motivo enviado en el cuerpo
    const motivoRechazo = req.body?.motivo_rechazo;

    // Rechazar el pedido mediante el servicio
    const resultado = await rechazarSolicitud(idSolicitud, motivoRechazo);

    res.status(200).json(resultado);
  } catch (error) {
    if (error instanceof ErrorSolicitud) {
      res.status(error.estado).json({
        mensaje: error.message,
      });
      return;
    }

    console.error("Error al rechazar la solicitud:", error);

    res.status(500).json({
      mensaje: "Ocurrió un error al rechazar la solicitud",
    });
  }
}

// ==========================================
// CONTROLADOR: ACTUALIZAR ESTADO DE PREPARACIÓN
// ADMINISTRADOR Y EMPLEADO
// ==========================================

export async function actualizarEstadoPreparacionController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const solicitud = req as RequestAutenticada;

    // Obtener el usuario autenticado
    const idUsuarioPersonal = solicitud.idUsuario;

    if (!idUsuarioPersonal) {
      res.status(401).json({
        mensaje: "Debes iniciar sesión para actualizar pedidos",
      });
      return;
    }

    // Obtener el identificador desde la URL
    const parametroId = req.params.id;

    // Validar que sea un entero positivo
    if (typeof parametroId !== "string" || !/^[1-9]\d*$/.test(parametroId)) {
      res.status(400).json({
        mensaje: "El identificador de la solicitud no es válido",
      });
      return;
    }

    const idSolicitud = Number(parametroId);

    // Validar que sea un número seguro
    if (!Number.isSafeInteger(idSolicitud)) {
      res.status(400).json({
        mensaje: "El identificador de la solicitud no es válido",
      });
      return;
    }

    // Obtener el nuevo estado enviado en JSON
    const nuevoEstado = req.body?.estado;

    // Actualizar mediante el servicio
    const resultado = await actualizarEstadoPreparacion(
      idSolicitud,
      nuevoEstado,
    );

    res.status(200).json(resultado);
  } catch (error) {
    if (error instanceof ErrorSolicitud) {
      res.status(error.estado).json({
        mensaje: error.message,
      });
      return;
    }

    console.error("Error al actualizar el estado del pedido:", error);

    res.status(500).json({
      mensaje: "Ocurrió un error al actualizar el pedido",
    });
  }
}

// ==========================================
// CONTROLADOR: SOLICITAR CANCELACIÓN
// CLIENTE
// ==========================================

export async function solicitarCancelacionController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const solicitud = req as RequestAutenticada;

    // ======================================
    // OBTENER USUARIO AUTENTICADO
    // ======================================

    const idUsuario = solicitud.idUsuario;

    if (!idUsuario) {
      res.status(401).json({
        mensaje: "Debes iniciar sesión para solicitar una cancelación",
      });
      return;
    }

    // ======================================
    // VALIDAR IDENTIFICADOR DEL PEDIDO
    // ======================================

    const parametroId = req.params.id;

    if (typeof parametroId !== "string" || !/^[1-9]\d*$/.test(parametroId)) {
      res.status(400).json({
        mensaje: "El identificador de la solicitud no es válido",
      });
      return;
    }

    const idSolicitud = Number(parametroId);

    if (!Number.isSafeInteger(idSolicitud)) {
      res.status(400).json({
        mensaje: "El identificador de la solicitud no es válido",
      });
      return;
    }

    // ======================================
    // OBTENER MOTIVO DE CANCELACIÓN
    // ======================================

    const motivoCancelacion = req.body?.motivo_cancelacion;

    // ======================================
    // SOLICITAR CANCELACIÓN
    // ======================================

    const resultado = await solicitarCancelacion(
      idUsuario,
      idSolicitud,
      motivoCancelacion,
    );

    res.status(200).json(resultado);
  } catch (error) {
    if (error instanceof ErrorSolicitud) {
      res.status(error.estado).json({
        mensaje: error.message,
      });
      return;
    }

    console.error("Error al solicitar la cancelación:", error);

    res.status(500).json({
      mensaje: "Ocurrió un error al solicitar la cancelación",
    });
  }
}

// ==========================================
// CONTROLADOR: APROBAR CANCELACIÓN
// ADMINISTRADOR / EMPLEADO
// ==========================================

export async function aprobarCancelacionController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const solicitud = req as RequestAutenticada;

    // ======================================
    // OBTENER PERSONAL AUTENTICADO
    // ======================================

    const idUsuarioPersonal = solicitud.idUsuario;

    if (!idUsuarioPersonal) {
      res.status(401).json({
        mensaje: "Debes iniciar sesión para aprobar una cancelación",
      });
      return;
    }

    // ======================================
    // VALIDAR IDENTIFICADOR DEL PEDIDO
    // ======================================

    const parametroId = req.params.id;

    if (typeof parametroId !== "string" || !/^[1-9]\d*$/.test(parametroId)) {
      res.status(400).json({
        mensaje: "El identificador de la solicitud no es válido",
      });
      return;
    }

    const idSolicitud = Number(parametroId);

    if (!Number.isSafeInteger(idSolicitud)) {
      res.status(400).json({
        mensaje: "El identificador de la solicitud no es válido",
      });
      return;
    }

    // ======================================
    // APROBAR CANCELACIÓN
    // ======================================

    const resultado = await aprobarCancelacion(idSolicitud, idUsuarioPersonal);

    res.status(200).json(resultado);
  } catch (error) {
    if (error instanceof ErrorSolicitud) {
      res.status(error.estado).json({
        mensaje: error.message,
      });
      return;
    }

    console.error("Error al aprobar la cancelación:", error);

    res.status(500).json({
      mensaje: "Ocurrió un error al aprobar la cancelación",
    });
  }
}

// ==========================================
// CONTROLADOR: RECHAZAR CANCELACIÓN
// ADMINISTRADOR / EMPLEADO
// ==========================================

export async function rechazarCancelacionController(
  req: Request,
  res: Response,
): Promise<void> {
  try {
    const solicitud = req as RequestAutenticada;

    // ======================================
    // OBTENER PERSONAL AUTENTICADO
    // ======================================

    const idUsuarioPersonal = solicitud.idUsuario;

    if (!idUsuarioPersonal) {
      res.status(401).json({
        mensaje: "Debes iniciar sesión para rechazar una cancelación",
      });
      return;
    }

    // ======================================
    // VALIDAR IDENTIFICADOR DEL PEDIDO
    // ======================================

    const parametroId = req.params.id;

    if (typeof parametroId !== "string" || !/^[1-9]\d*$/.test(parametroId)) {
      res.status(400).json({
        mensaje: "El identificador de la solicitud no es válido",
      });
      return;
    }

    const idSolicitud = Number(parametroId);

    if (!Number.isSafeInteger(idSolicitud)) {
      res.status(400).json({
        mensaje: "El identificador de la solicitud no es válido",
      });
      return;
    }

    // ======================================
    // RECHAZAR CANCELACIÓN
    // ======================================

    const resultado = await rechazarCancelacion(idSolicitud, idUsuarioPersonal);

    res.status(200).json(resultado);
  } catch (error) {
    if (error instanceof ErrorSolicitud) {
      res.status(error.estado).json({
        mensaje: error.message,
      });
      return;
    }

    console.error("Error al rechazar la cancelación:", error);

    res.status(500).json({
      mensaje: "Ocurrió un error al rechazar la cancelación",
    });
  }
}
