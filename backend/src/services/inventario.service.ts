import type { NuevoProducto } from "../types/inventario.js";

import { crearProducto } from "../repositories/productos.repository.js";

import {
  insertarMovimientoInventario,
  obtenerConexionInventario,
} from "../repositories/movimientosInventario.repository.js";

// ==========================================
// RESULTADO DE LA CREACIÓN
// ==========================================

export interface ResultadoCrearProducto {
  id_producto: number;
  mensaje: string;
}

// ==========================================
// ERRORES DEL SERVICIO
// ==========================================

export class ErrorInventario extends Error {
  constructor(
    mensaje: string,
    public readonly codigoHTTP: number = 400,
  ) {
    super(mensaje);
    this.name = "ErrorInventario";
  }
}

// ==========================================
// REGISTRAR PRODUCTO CON STOCK INICIAL
// ==========================================

export async function registrarProductoInventario(
  datos: NuevoProducto,
  idUsuario: number,
): Promise<ResultadoCrearProducto> {
  const conexion = await obtenerConexionInventario();

  try {
    await conexion.beginTransaction();

    // ======================================
    // VERIFICAR CATEGORÍA ACTIVA
    // ======================================

    // Se consulta dentro de la misma transacción
    // para comprobar su estado antes del registro.

    const [categorias] = await conexion.execute<
      import("mysql2").RowDataPacket[]
    >(
      `
        SELECT id_categoria
        FROM categorias
        WHERE id_categoria = ?
          AND activa = 1
        LIMIT 1
      `,
      [datos.id_categoria],
    );

    if (categorias.length === 0) {
      throw new ErrorInventario(
        "La categoría seleccionada no existe o está desactivada.",
        400,
      );
    }

    // ======================================
    // CREAR PRODUCTO
    // ======================================

    const idProducto = await crearProducto(datos, conexion);

    // ======================================
    // REGISTRAR STOCK INICIAL
    // ======================================

    if (datos.stock > 0) {
      await insertarMovimientoInventario(
        {
          id_producto: idProducto,
          id_usuario: idUsuario,
          id_solicitud: null,
          tipo: "ENTRADA",
          cantidad: datos.stock,
          motivo: "Registro de stock inicial del producto",
        },
        conexion,
      );
    }

    // ======================================
    // CONFIRMAR TRANSACCIÓN
    // ======================================

    await conexion.commit();

    return {
      id_producto: idProducto,
      mensaje: "Producto registrado correctamente.",
    };
  } catch (error) {
    // ======================================
    // REVERTIR TRANSACCIÓN
    // ======================================

    try {
      await conexion.rollback();
    } catch (errorRollback) {
      console.error("Error al revertir la transacción:", errorRollback);
    }

    throw error;
  } finally {
    // ======================================
    // LIBERAR CONEXIÓN
    // ======================================

    conexion.release();
  }
}
