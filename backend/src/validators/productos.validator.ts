import type { NuevoProducto } from "../types/inventario.js";

// ==========================================
// RESULTADO DE VALIDACIÓN
// ==========================================

type ResultadoValidacion =
  | {
      valido: true;
      datos: NuevoProducto;
    }
  | {
      valido: false;
      errores: string[];
    };

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

function esEnteroNoNegativo(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isSafeInteger(valor) && valor >= 0;
}

function esEnteroPositivo(valor: unknown): valor is number {
  return typeof valor === "number" && Number.isSafeInteger(valor) && valor > 0;
}

function textoOpcional(valor: unknown): string | null {
  if (valor === undefined || valor === null) {
    return null;
  }

  if (typeof valor !== "string") {
    return null;
  }

  const texto = valor.trim();

  return texto.length > 0 ? texto : null;
}

// ==========================================
// VALIDAR NUEVO PRODUCTO
// ==========================================

export function validarNuevoProducto(entrada: unknown): ResultadoValidacion {
  const errores: string[] = [];

  if (!esObjeto(entrada)) {
    return {
      valido: false,
      errores: ["Los datos del producto no son válidos."],
    };
  }

  const {
    id_categoria,
    nombre,
    presentacion,
    descripcion,
    precio,
    stock,
    stock_minimo,
    imagen_url,
    disponible,
  } = entrada;

  // Categoría
  if (!esEnteroPositivo(id_categoria)) {
    errores.push("La categoría debe tener un ID entero positivo.");
  }

  // Nombre
  if (
    typeof nombre !== "string" ||
    nombre.trim().length === 0 ||
    nombre.trim().length > 150
  ) {
    errores.push(
      "El nombre es obligatorio y debe tener máximo 150 caracteres.",
    );
  }

  // Presentación
  if (
    presentacion !== undefined &&
    presentacion !== null &&
    (typeof presentacion !== "string" || presentacion.trim().length > 100)
  ) {
    errores.push("La presentación debe tener máximo 100 caracteres.");
  }

  // Descripción
  if (
    descripcion !== undefined &&
    descripcion !== null &&
    typeof descripcion !== "string"
  ) {
    errores.push("La descripción debe ser un texto.");
  }

  // Precio
  if (
    typeof precio !== "number" ||
    !Number.isFinite(precio) ||
    precio <= 0 ||
    precio > 99999999.99 ||
    Math.round(precio * 100) / 100 !== precio
  ) {
    errores.push(
      "El precio debe ser mayor que cero y tener máximo dos decimales.",
    );
  }

  // Stock
  if (!esEnteroNoNegativo(stock)) {
    errores.push("El stock debe ser un número entero igual o mayor que cero.");
  }

  // Stock mínimo
  if (!esEnteroNoNegativo(stock_minimo)) {
    errores.push(
      "El stock mínimo debe ser un número entero igual o mayor que cero.",
    );
  }

  // URL de imagen
  if (
    imagen_url !== undefined &&
    imagen_url !== null &&
    (typeof imagen_url !== "string" || imagen_url.trim().length > 500)
  ) {
    errores.push("La URL de imagen debe tener máximo 500 caracteres.");
  }

  // Disponibilidad
  if (disponible !== undefined && typeof disponible !== "boolean") {
    errores.push("La disponibilidad debe ser verdadera o falsa.");
  }

  // ==========================================
  // DEVOLVER ERRORES
  // ==========================================

  if (errores.length > 0) {
    return {
      valido: false,
      errores,
    };
  }

  // ==========================================
  // DATOS VALIDADOS
  // ==========================================

  return {
    valido: true,
    datos: {
      id_categoria: id_categoria as number,
      nombre: (nombre as string).trim(),
      presentacion: textoOpcional(presentacion),
      descripcion: textoOpcional(descripcion),
      precio: precio as number,
      stock: stock as number,
      stock_minimo: stock_minimo as number,
      imagen_url: textoOpcional(imagen_url),
      disponible: typeof disponible === "boolean" ? disponible : true,
    },
  };
}
