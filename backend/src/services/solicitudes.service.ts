import {
  consultarProductosPedido,
  crearSolicitudEnBD,
  listarSolicitudesConDetalles,
  buscarSolicitudPorIdYUsuario,
  listarTodasLasSolicitudes,
  aceptarSolicitudEnBD,
  rechazarSolicitudEnBD,
  actualizarEstadoPreparacionEnBD,
  solicitarCancelacionEnBD,
  aprobarCancelacionEnBD,
  rechazarCancelacionEnBD,
} from "../repositories/solicitudes.repository.js";

import type {
  CrearSolicitud,
  ProductoSolicitado,
} from "../types/solicitudes.js";

// ==========================================
// ERRORES DEL MÓDULO DE SOLICITUDES
// ==========================================

export class ErrorSolicitud extends Error {
  constructor(
    public estado: number,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = "ErrorSolicitud";
  }
}

// ==========================================
// VALIDAR PRODUCTOS SOLICITADOS
// ==========================================

function validarProductos(productos: unknown): ProductoSolicitado[] {
  if (!Array.isArray(productos) || productos.length === 0) {
    throw new ErrorSolicitud(400, "Debes seleccionar al menos un producto");
  }

  if (productos.length > 50) {
    throw new ErrorSolicitud(
      400,
      "No puedes solicitar más de 50 productos diferentes",
    );
  }

  const ids = new Set<number>();
  const productosValidados: ProductoSolicitado[] = [];

  for (const item of productos) {
    if (
      typeof item !== "object" ||
      item === null ||
      !Number.isSafeInteger(item.id_producto) ||
      item.id_producto <= 0 ||
      !Number.isSafeInteger(item.cantidad) ||
      item.cantidad <= 0
    ) {
      throw new ErrorSolicitud(
        400,
        "Los productos deben tener un ID y una cantidad válida",
      );
    }

    if (ids.has(item.id_producto)) {
      throw new ErrorSolicitud(
        400,
        `El producto ${item.id_producto} está repetido`,
      );
    }

    ids.add(item.id_producto);

    productosValidados.push({
      id_producto: item.id_producto,
      cantidad: item.cantidad,
    });
  }

  return productosValidados;
}

// ==========================================
// CREAR SOLICITUD
// ==========================================

export async function crearSolicitud(idUsuario: number, datos: CrearSolicitud) {
  if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
    throw new ErrorSolicitud(401, "Usuario no autenticado");
  }

  if (!datos || typeof datos !== "object") {
    throw new ErrorSolicitud(400, "Datos de solicitud inválidos");
  }

  // Validar lista de productos
  const productos = validarProductos(datos.productos);

  // Validar tiempo estimado de llegada
  const minutosLlegada = datos.minutos_llegada;

  if (
    !Number.isSafeInteger(minutosLlegada) ||
    minutosLlegada < 1 ||
    minutosLlegada > 180
  ) {
    throw new ErrorSolicitud(
      400,
      "El tiempo estimado debe estar entre 1 y 180 minutos",
    );
  }

  // Consultar precios y existencias reales
  let productosCalculados;

  try {
    productosCalculados = await consultarProductosPedido(productos);
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("no existe") ||
        error.message.includes("no está disponible") ||
        error.message.includes("Stock insuficiente")
      ) {
        throw new ErrorSolicitud(409, error.message);
      }
    }

    throw error;
  }

  // Guardar la solicitud sin descontar stock
  const idSolicitud = await crearSolicitudEnBD(
    idUsuario,
    productosCalculados,
    minutosLlegada,
  );

  return {
    mensaje: "Solicitud registrada correctamente",
    id_solicitud: idSolicitud,
    folio: `FRZ-${String(idSolicitud).padStart(6, "0")}`,
    estado: "PENDIENTE" as const,
  };
}

// ==========================================
// CONSULTAR PEDIDOS DEL CLIENTE
// ==========================================

export async function obtenerMisSolicitudes(idUsuario: number) {
  // Verificar identificador del usuario
  if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
    throw new ErrorSolicitud(
      401,
      "Debes iniciar sesión para consultar tus pedidos",
    );
  }

  // Consultar los pedidos del usuario autenticado
  const solicitudes = await listarSolicitudesConDetalles(idUsuario);

  return {
    mensaje: "Solicitudes obtenidas correctamente",
    total: solicitudes.length,
    solicitudes,
  };
}

// ==========================================
// CONSULTAR UN PEDIDO INDIVIDUAL
// ==========================================

export async function obtenerSolicitudPorId(
  idUsuario: number,
  idSolicitud: number,
) {
  // Validar usuario autenticado
  if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
    throw new ErrorSolicitud(
      401,
      "Debes iniciar sesión para consultar el pedido",
    );
  }

  // Validar identificador de la solicitud
  if (!Number.isSafeInteger(idSolicitud) || idSolicitud <= 0) {
    throw new ErrorSolicitud(
      400,
      "El identificador de la solicitud no es válido",
    );
  }

  // Buscar únicamente pedidos del usuario
  const solicitud = await buscarSolicitudPorIdYUsuario(idSolicitud, idUsuario);

  // No revelar si el pedido pertenece a otra persona
  if (!solicitud) {
    throw new ErrorSolicitud(404, "Solicitud no encontrada");
  }

  return {
    mensaje: "Solicitud obtenida correctamente",
    solicitud,
  };
}

// ==========================================
// CONSULTAR TODAS LAS SOLICITUDES
// ADMINISTRADOR Y EMPLEADO
// ==========================================

export async function obtenerTodasLasSolicitudes() {
  // Consultar todos los pedidos registrados
  const solicitudes = await listarTodasLasSolicitudes();

  return {
    mensaje: "Solicitudes obtenidas correctamente",
    total: solicitudes.length,
    solicitudes,
  };
}

// ==========================================
// ACEPTAR SOLICITUD
// ADMINISTRADOR Y EMPLEADO
// ==========================================

export async function aceptarSolicitud(
  idSolicitud: number,
  idUsuarioPersonal: number,
) {
  // Validar el identificador de la solicitud
  if (!Number.isSafeInteger(idSolicitud) || idSolicitud <= 0) {
    throw new ErrorSolicitud(
      400,
      "El identificador de la solicitud no es válido",
    );
  }

  // Validar el identificador del personal
  if (!Number.isSafeInteger(idUsuarioPersonal) || idUsuarioPersonal <= 0) {
    throw new ErrorSolicitud(401, "Debes iniciar sesión para aceptar pedidos");
  }

  try {
    // Aceptar el pedido y descontar inventario
    await aceptarSolicitudEnBD(idSolicitud, idUsuarioPersonal);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "La solicitud no existe") {
        throw new ErrorSolicitud(404, error.message);
      }

      if (
        error.message.includes(
          "Solo se pueden aceptar solicitudes pendientes",
        ) ||
        error.message.includes(
          "La solicitud tiene un proceso de cancelación",
        ) ||
        error.message.includes("Stock insuficiente") ||
        error.message.includes("no está disponible") ||
        error.message.includes("no contiene productos") ||
        error.message.includes("no existe")
      ) {
        throw new ErrorSolicitud(409, error.message);
      }
    }

    throw error;
  }

  return {
    mensaje: "Solicitud aceptada correctamente",
    id_solicitud: idSolicitud,
    estado: "ACEPTADA" as const,
  };
}

// ==========================================
// RECHAZAR SOLICITUD
// ADMINISTRADOR Y EMPLEADO
// ==========================================

export async function rechazarSolicitud(
  idSolicitud: number,
  motivoRechazo: unknown,
) {
  // Validar el identificador de la solicitud
  if (!Number.isSafeInteger(idSolicitud) || idSolicitud <= 0) {
    throw new ErrorSolicitud(
      400,
      "El identificador de la solicitud no es válido",
    );
  }

  // Validar que el motivo sea texto
  if (typeof motivoRechazo !== "string") {
    throw new ErrorSolicitud(400, "Debes indicar un motivo de rechazo");
  }

  const motivo = motivoRechazo.trim();

  // Validar que el motivo no esté vacío
  if (motivo.length === 0) {
    throw new ErrorSolicitud(400, "Debes indicar un motivo de rechazo");
  }

  // Limitar la longitud del motivo
  if (motivo.length > 1000) {
    throw new ErrorSolicitud(
      400,
      "El motivo de rechazo no puede superar los 1000 caracteres",
    );
  }

  try {
    // Cambiar el estado del pedido en MySQL
    await rechazarSolicitudEnBD(idSolicitud, motivo);
  } catch (error) {
    if (error instanceof Error) {
      // El pedido no existe
      if (error.message === "La solicitud no existe") {
        throw new ErrorSolicitud(404, error.message);
      }

      // El pedido no puede rechazarse
      if (
        error.message === "Solo se pueden rechazar solicitudes pendientes" ||
        error.message === "La solicitud tiene un proceso de cancelación"
      ) {
        throw new ErrorSolicitud(409, error.message);
      }
    }

    throw error;
  }

  return {
    mensaje: "Solicitud rechazada correctamente",
    id_solicitud: idSolicitud,
    estado: "RECHAZADA" as const,
    motivo_rechazo: motivo,
  };
}

// ==========================================
// ACTUALIZAR ESTADO DE PREPARACIÓN
// ADMINISTRADOR Y EMPLEADO
// ==========================================

export async function actualizarEstadoPreparacion(
  idSolicitud: number,
  nuevoEstado: unknown,
) {
  // Validar el identificador del pedido
  if (!Number.isSafeInteger(idSolicitud) || idSolicitud <= 0) {
    throw new ErrorSolicitud(
      400,
      "El identificador de la solicitud no es válido",
    );
  }

  // Estados permitidos para esta operación
  const estadosPermitidos = ["EN_PREPARACION", "LISTA", "ENTREGADA"] as const;

  // Validar el estado recibido
  if (
    typeof nuevoEstado !== "string" ||
    !estadosPermitidos.some((estado) => estado === nuevoEstado)
  ) {
    throw new ErrorSolicitud(400, "El estado solicitado no es válido");
  }

  const estadoValidado = nuevoEstado as
    | "EN_PREPARACION"
    | "LISTA"
    | "ENTREGADA";

  try {
    // Actualizar el estado en MySQL
    await actualizarEstadoPreparacionEnBD(idSolicitud, estadoValidado);
  } catch (error) {
    if (error instanceof Error) {
      // Pedido inexistente
      if (error.message === "La solicitud no existe") {
        throw new ErrorSolicitud(404, error.message);
      }

      // Transición inválida o cancelación pendiente
      if (
        error.message.startsWith("No se puede cambiar de") ||
        error.message === "La solicitud tiene una cancelación pendiente"
      ) {
        throw new ErrorSolicitud(409, error.message);
      }
    }

    throw error;
  }

  return {
    mensaje: "Estado de la solicitud actualizado correctamente",
    id_solicitud: idSolicitud,
    estado: estadoValidado,
  };
}

// ==========================================
// SOLICITAR CANCELACIÓN DE UN PEDIDO
// CLIENTE
// ==========================================

export async function solicitarCancelacion(
  idUsuario: number,
  idSolicitud: number,
  motivoCancelacion: unknown,
) {
  // ======================================
  // VALIDAR USUARIO AUTENTICADO
  // ======================================

  if (!Number.isSafeInteger(idUsuario) || idUsuario <= 0) {
    throw new ErrorSolicitud(
      401,
      "Debes iniciar sesión para solicitar una cancelación",
    );
  }

  // ======================================
  // VALIDAR IDENTIFICADOR DEL PEDIDO
  // ======================================

  if (!Number.isSafeInteger(idSolicitud) || idSolicitud <= 0) {
    throw new ErrorSolicitud(
      400,
      "El identificador de la solicitud no es válido",
    );
  }

  // ======================================
  // VALIDAR MOTIVO DE CANCELACIÓN
  // ======================================

  if (typeof motivoCancelacion !== "string") {
    throw new ErrorSolicitud(400, "Debes indicar un motivo de cancelación");
  }

  const motivo = motivoCancelacion.trim();

  if (motivo.length === 0) {
    throw new ErrorSolicitud(400, "Debes indicar un motivo de cancelación");
  }

  if (motivo.length > 1000) {
    throw new ErrorSolicitud(
      400,
      "El motivo de cancelación no puede superar los 1000 caracteres",
    );
  }

  // ======================================
  // REGISTRAR SOLICITUD DE CANCELACIÓN
  // ======================================

  try {
    await solicitarCancelacionEnBD(idSolicitud, idUsuario, motivo);
  } catch (error) {
    if (error instanceof Error) {
      // Pedido inexistente o de otro cliente
      if (error.message === "La solicitud no existe") {
        throw new ErrorSolicitud(404, "Solicitud no encontrada");
      }

      // Estado del pedido no permitido
      if (
        error.message ===
        "Solo puedes solicitar la cancelación de pedidos pendientes o aceptados"
      ) {
        throw new ErrorSolicitud(409, error.message);
      }

      // Ya existe una cancelación
      if (
        error.message === "Este pedido ya tiene una cancelación pendiente" ||
        error.message === "Este pedido ya fue cancelado"
      ) {
        throw new ErrorSolicitud(409, error.message);
      }
    }

    throw error;
  }

  // ======================================
  // RESPUESTA DEL SERVICIO
  // ======================================

  return {
    mensaje: "Cancelación solicitada correctamente",
    id_solicitud: idSolicitud,
    estado_cancelacion: "SOLICITADA" as const,
    motivo_cancelacion: motivo,
  };
}

// ==========================================
// APROBAR CANCELACIÓN DE UN PEDIDO
// ADMINISTRADOR / EMPLEADO
// ==========================================

export async function aprobarCancelacion(
  idSolicitud: number,
  idUsuarioPersonal: number,
) {
  // ======================================
  // VALIDAR IDENTIFICADOR DEL PEDIDO
  // ======================================

  if (!Number.isSafeInteger(idSolicitud) || idSolicitud <= 0) {
    throw new ErrorSolicitud(
      400,
      "El identificador de la solicitud no es válido",
    );
  }

  // ======================================
  // VALIDAR USUARIO DEL PERSONAL
  // ======================================

  if (!Number.isSafeInteger(idUsuarioPersonal) || idUsuarioPersonal <= 0) {
    throw new ErrorSolicitud(
      401,
      "Debes iniciar sesión para aprobar una cancelación",
    );
  }

  // ======================================
  // APROBAR CANCELACIÓN EN LA BASE DE DATOS
  // ======================================

  try {
    await aprobarCancelacionEnBD(idSolicitud, idUsuarioPersonal);
  } catch (error) {
    if (error instanceof Error) {
      // Pedido inexistente
      if (error.message === "La solicitud no existe") {
        throw new ErrorSolicitud(404, "Solicitud no encontrada");
      }

      // Cancelación no solicitada
      if (error.message === "La solicitud no tiene una cancelación pendiente") {
        throw new ErrorSolicitud(409, error.message);
      }

      // Estado no permitido
      if (
        error.message === "El pedido no se encuentra en un estado cancelable"
      ) {
        throw new ErrorSolicitud(409, error.message);
      }
    }

    throw error;
  }

  // ======================================
  // RESPUESTA DEL SERVICIO
  // ======================================

  return {
    mensaje: "Cancelación aprobada correctamente",
    id_solicitud: idSolicitud,
    estado: "CANCELADA" as const,
    estado_cancelacion: "APROBADA" as const,
  };
}

// ==========================================
// RECHAZAR CANCELACIÓN DE UN PEDIDO
// ADMINISTRADOR / EMPLEADO
// ==========================================

export async function rechazarCancelacion(
  idSolicitud: number,
  idUsuarioPersonal: number,
) {
  // ======================================
  // VALIDAR IDENTIFICADOR DEL PEDIDO
  // ======================================

  if (!Number.isSafeInteger(idSolicitud) || idSolicitud <= 0) {
    throw new ErrorSolicitud(
      400,
      "El identificador de la solicitud no es válido",
    );
  }

  // ======================================
  // VALIDAR USUARIO DEL PERSONAL
  // ======================================

  if (!Number.isSafeInteger(idUsuarioPersonal) || idUsuarioPersonal <= 0) {
    throw new ErrorSolicitud(
      401,
      "Debes iniciar sesión para rechazar una cancelación",
    );
  }

  // ======================================
  // RECHAZAR CANCELACIÓN EN MYSQL
  // ======================================

  try {
    await rechazarCancelacionEnBD(idSolicitud);
  } catch (error) {
    if (error instanceof Error) {
      // El pedido no existe
      if (error.message === "La solicitud no existe") {
        throw new ErrorSolicitud(404, "Solicitud no encontrada");
      }

      // No hay una cancelación pendiente
      if (error.message === "La solicitud no tiene una cancelación pendiente") {
        throw new ErrorSolicitud(409, error.message);
      }

      // El pedido no puede cancelarse
      if (
        error.message === "El pedido no se encuentra en un estado cancelable"
      ) {
        throw new ErrorSolicitud(409, error.message);
      }
    }

    throw error;
  }

  // ======================================
  // RESPUESTA DEL SERVICIO
  // ======================================

  return {
    mensaje: "Cancelación rechazada correctamente",
    id_solicitud: idSolicitud,
    estado_cancelacion: "RECHAZADA" as const,
  };
}
