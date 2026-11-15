import type { NuevoProducto, ActualizarProducto } from "../types/inventario.js";

// ==========================================
// TIPOS DE RESULTADO
// ==========================================

type ResultadoValidacion<T> =
  | {
      valido: true;
      datos: T;
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

function esPrecioValido(valor: unknown): valor is number {
  return (
    typeof valor === "number" &&
    Number.isFinite(valor) &&
    valor > 0 &&
    valor <= 99999999.99 &&
    Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-7
  );
}

// ==========================================
// VALIDAR NUEVO PRODUCTO
// ==========================================

export function validarNuevoProducto(
  entrada: unknown,
): ResultadoValidacion<NuevoProducto> {
  if (!esObjeto(entrada)) {
    return {
      valido: false,
      errores: ["Los datos del producto no son válidos."],
    };
  }

  const errores: string[] = [];

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

  if (!esEnteroPositivo(id_categoria)) {
    errores.push("La categoría debe tener un ID entero positivo.");
  }

  if (
    typeof nombre !== "string" ||
    nombre.trim().length === 0 ||
    nombre.trim().length > 150
  ) {
    errores.push(
      "El nombre es obligatorio y debe tener máximo 150 caracteres.",
    );
  }

  if (
    presentacion != null &&
    (typeof presentacion !== "string" || presentacion.trim().length > 100)
  ) {
    errores.push("La presentación debe tener máximo 100 caracteres.");
  }

  if (descripcion != null && typeof descripcion !== "string") {
    errores.push("La descripción debe ser un texto.");
  }

  if (!esPrecioValido(precio)) {
    errores.push(
      "El precio debe ser mayor que cero y tener máximo dos decimales.",
    );
  }

  if (!esEnteroNoNegativo(stock)) {
    errores.push("El stock debe ser un número entero igual o mayor que cero.");
  }

  if (!esEnteroNoNegativo(stock_minimo)) {
    errores.push(
      "El stock mínimo debe ser un número entero igual o mayor que cero.",
    );
  }

  if (
    imagen_url != null &&
    (typeof imagen_url !== "string" || imagen_url.trim().length > 500)
  ) {
    errores.push("La URL de imagen debe tener máximo 500 caracteres.");
  }

  if (disponible !== undefined && typeof disponible !== "boolean") {
    errores.push("La disponibilidad debe ser verdadera o falsa.");
  }

  if (errores.length > 0) {
    return { valido: false, errores };
  }

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

// ==========================================
// VALIDAR ACTUALIZACIÓN DE PRODUCTO
// ==========================================

export function validarActualizacionProducto(
  entrada: unknown,
): ResultadoValidacion<ActualizarProducto> {
  if (!esObjeto(entrada)) {
    return {
      valido: false,
      errores: ["Los datos de actualización no son válidos."],
    };
  }

  const errores: string[] = [];
  const datos: ActualizarProducto = {};

  const camposPermitidos = [
    "id_categoria",
    "nombre",
    "presentacion",
    "descripcion",
    "precio",
    "stock_minimo",
    "imagen_url",
    "disponible",
  ];

  // Rechazar campos desconocidos o no editables
  for (const campo of Object.keys(entrada)) {
    if (!camposPermitidos.includes(campo)) {
      errores.push(`El campo '${campo}' no se puede modificar.`);
    }
  }

  // Categoría
  if (entrada.id_categoria !== undefined) {
    if (!esEnteroPositivo(entrada.id_categoria)) {
      errores.push("La categoría debe tener un ID entero positivo.");
    } else {
      datos.id_categoria = entrada.id_categoria;
    }
  }

  // Nombre
  if (entrada.nombre !== undefined) {
    if (
      typeof entrada.nombre !== "string" ||
      entrada.nombre.trim().length === 0 ||
      entrada.nombre.trim().length > 150
    ) {
      errores.push(
        "El nombre es obligatorio y debe tener máximo 150 caracteres.",
      );
    } else {
      datos.nombre = entrada.nombre.trim();
    }
  }

  // Presentación
  if (entrada.presentacion !== undefined) {
    if (
      entrada.presentacion !== null &&
      (typeof entrada.presentacion !== "string" ||
        entrada.presentacion.trim().length > 100)
    ) {
      errores.push("La presentación debe tener máximo 100 caracteres.");
    } else {
      datos.presentacion = textoOpcional(entrada.presentacion);
    }
  }

  // Descripción
  if (entrada.descripcion !== undefined) {
    if (
      entrada.descripcion !== null &&
      typeof entrada.descripcion !== "string"
    ) {
      errores.push("La descripción debe ser un texto.");
    } else {
      datos.descripcion = textoOpcional(entrada.descripcion);
    }
  }

  // Precio
  if (entrada.precio !== undefined) {
    if (!esPrecioValido(entrada.precio)) {
      errores.push(
        "El precio debe ser mayor que cero y tener máximo dos decimales.",
      );
    } else {
      datos.precio = entrada.precio;
    }
  }

  // Stock mínimo
  if (entrada.stock_minimo !== undefined) {
    if (!esEnteroNoNegativo(entrada.stock_minimo)) {
      errores.push(
        "El stock mínimo debe ser un número entero igual o mayor que cero.",
      );
    } else {
      datos.stock_minimo = entrada.stock_minimo;
    }
  }

  // Imagen
  if (entrada.imagen_url !== undefined) {
    if (
      entrada.imagen_url !== null &&
      (typeof entrada.imagen_url !== "string" ||
        entrada.imagen_url.trim().length > 500)
    ) {
      errores.push("La URL de imagen debe tener máximo 500 caracteres.");
    } else {
      datos.imagen_url = textoOpcional(entrada.imagen_url);
    }
  }

  // Disponibilidad
  if (entrada.disponible !== undefined) {
    if (typeof entrada.disponible !== "boolean") {
      errores.push("La disponibilidad debe ser verdadera o falsa.");
    } else {
      datos.disponible = entrada.disponible;
    }
  }

  // Comprobar que haya al menos un campo válido
  if (Object.keys(datos).length === 0) {
    errores.push("Debes proporcionar al menos un campo para actualizar.");
  }

  if (errores.length > 0) {
    return { valido: false, errores };
  }

  return {
    valido: true,
    datos,
  };
}
