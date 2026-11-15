import type {
  NuevoMovimientoInventario,
  TipoMovimientoInventario,
} from "../types/inventario.js";

// ==========================================
// RESULTADO DE VALIDACIÓN
// ==========================================

export type ResultadoValidacionMovimiento =
  | {
      valido: true;
      datos: NuevoMovimientoInventario;
    }
  | {
      valido: false;
      errores: string[];
    };

// ==========================================
// TIPOS DE MOVIMIENTO PERMITIDOS
// ==========================================

const TIPOS_MOVIMIENTO: TipoMovimientoInventario[] = [
  "ENTRADA",
  "SALIDA",
  "AJUSTE",
];

// ==========================================
// VALIDAR MOVIMIENTO DE INVENTARIO
// ==========================================

export function validarNuevoMovimientoInventario(
  entrada: unknown,
): ResultadoValidacionMovimiento {
  const errores: string[] = [];

  // ========================================
  // VALIDAR OBJETO
  // ========================================

  if (
    typeof entrada !== "object" ||
    entrada === null ||
    Array.isArray(entrada)
  ) {
    return {
      valido: false,
      errores: ["Los datos del movimiento deben ser un objeto válido."],
    };
  }

  const datos = entrada as Record<string, unknown>;

  // ========================================
  // VALIDAR CAMPOS PERMITIDOS
  // ========================================

  const camposPermitidos = ["id_producto", "tipo", "cantidad", "motivo"];

  for (const campo of Object.keys(datos)) {
    if (!camposPermitidos.includes(campo)) {
      errores.push(`El campo "${campo}" no está permitido.`);
    }
  }

  // ========================================
  // VALIDAR ID DEL PRODUCTO
  // ========================================

  const idProducto = datos.id_producto;

  if (
    typeof idProducto !== "number" ||
    !Number.isSafeInteger(idProducto) ||
    idProducto <= 0
  ) {
    errores.push("El ID del producto debe ser un número entero positivo.");
  }

  // ========================================
  // VALIDAR TIPO DE MOVIMIENTO
  // ========================================

  const tipo = datos.tipo;

  if (
    typeof tipo !== "string" ||
    !TIPOS_MOVIMIENTO.some((tipoPermitido) => tipoPermitido === tipo)
  ) {
    errores.push("El tipo de movimiento debe ser ENTRADA, SALIDA o AJUSTE.");
  }

  // ========================================
  // VALIDAR CANTIDAD
  // ========================================

  const cantidad = datos.cantidad;

  if (
    typeof cantidad !== "number" ||
    !Number.isSafeInteger(cantidad) ||
    cantidad < 0 ||
    cantidad > 2147483647
  ) {
    errores.push("La cantidad debe ser un número entero entre 0 y 2147483647.");
  } else if ((tipo === "ENTRADA" || tipo === "SALIDA") && cantidad === 0) {
    errores.push("La cantidad debe ser mayor a cero para entradas y salidas.");
  }

  // ========================================
  // VALIDAR MOTIVO
  // ========================================

  const motivo = datos.motivo;

  if (
    typeof motivo !== "string" ||
    motivo.trim().length === 0 ||
    motivo.trim().length > 255
  ) {
    errores.push(
      "El motivo es obligatorio y debe tener máximo 255 caracteres.",
    );
  }

  // ========================================
  // COMPROBAR ERRORES
  // ========================================

  if (errores.length > 0) {
    return {
      valido: false,
      errores,
    };
  }

  // ========================================
  // RETORNAR DATOS VALIDADOS
  // ========================================

  return {
    valido: true,
    datos: {
      id_producto: idProducto as number,
      tipo: tipo as TipoMovimientoInventario,
      cantidad: cantidad as number,
      motivo: (motivo as string).trim(),
    },
  };
}
