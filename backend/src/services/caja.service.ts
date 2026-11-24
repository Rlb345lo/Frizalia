import type { PoolConnection } from "mysql2/promise";

import {
  adquirirBloqueoAperturaCaja,
  actualizarCierreCaja,
  consultarCajaAbierta,
  consultarCajaPorId,
  consultarTotalesCaja,
  contarCajas,
  crearAperturaCaja,
  liberarBloqueoAperturaCaja,
  listarHistorialCajas,
  listarMovimientosCaja,
  obtenerConexionCaja,
} from "../repositories/caja.repository.js";

import type {
  AbrirCaja,
  Caja,
  CerrarCaja,
  HistorialCaja,
  ResultadoCierreCaja,
  ResumenCaja,
} from "../types/caja.js";

// ==========================================
// ERRORES DEL MODULO DE CAJA
// ==========================================

export class ErrorCaja extends Error {
  constructor(
    mensaje: string,
    public readonly codigoEstado: number = 400,
  ) {
    super(mensaje);
    this.name = "ErrorCaja";
  }
}

// ==========================================
// UTILIDADES MONETARIAS
// ==========================================

const MAXIMO_CENTAVOS = 9_999_999_999;

function convertirACentavos(valor: number | string): number {
  const texto = String(valor);

  if (!/^-?\d+(?:\.\d{1,2})?$/.test(texto)) {
    throw new ErrorCaja("El importe debe tener como maximo dos decimales.");
  }

  const negativo = texto.startsWith("-");
  const absoluto = negativo ? texto.slice(1) : texto;

  const [enteros, decimales = ""] = absoluto.split(".");

  const centavos = Number(enteros) * 100 + Number(decimales.padEnd(2, "0"));

  if (!Number.isSafeInteger(centavos)) {
    throw new ErrorCaja("El importe es demasiado grande.");
  }

  return negativo ? -centavos : centavos;
}

function formatearCentavos(centavos: number): string {
  if (!Number.isSafeInteger(centavos)) {
    throw new ErrorCaja("El importe calculado no es valido.");
  }

  const signo = centavos < 0 ? "-" : "";
  const absoluto = Math.abs(centavos);

  const enteros = Math.floor(absoluto / 100);
  const decimales = String(absoluto % 100).padStart(2, "0");

  return `${signo}${enteros}.${decimales}`;
}

function validarImporte(valor: number, nombre: string): number {
  if (typeof valor !== "number" || !Number.isFinite(valor)) {
    throw new ErrorCaja(`${nombre} debe ser un numero valido.`);
  }

  const centavos = convertirACentavos(valor);

  if (centavos < 0) {
    throw new ErrorCaja(`${nombre} no puede ser negativo.`);
  }

  if (centavos > MAXIMO_CENTAVOS) {
    throw new ErrorCaja(`${nombre} supera el importe permitido.`);
  }

  return centavos;
}

function validarIdentificador(valor: number, nombre: string): void {
  if (!Number.isSafeInteger(valor) || valor <= 0) {
    throw new ErrorCaja(`${nombre} no es valido.`);
  }
}

function validarRangoMonetario(centavos: number): void {
  if (!Number.isSafeInteger(centavos) || Math.abs(centavos) > MAXIMO_CENTAVOS) {
    throw new ErrorCaja("El importe calculado supera el limite permitido.");
  }
}

// ==========================================
// CONSTRUIR RESUMEN DE CAJA
// ==========================================

async function construirResumenCaja(
  caja: Caja,
  conexion?: PoolConnection,
): Promise<ResumenCaja> {
  const totales = await consultarTotalesCaja(caja.id_caja, conexion);

  const movimientos = await listarMovimientosCaja(caja.id_caja, conexion);

  const fondoInicial = convertirACentavos(caja.fondo_inicial);

  const entradas = convertirACentavos(totales.total_entradas);

  const salidas = convertirACentavos(totales.total_salidas);

  const esperado = fondoInicial + entradas - salidas;

  validarRangoMonetario(esperado);

  return {
    caja,
    total_entradas: formatearCentavos(entradas),
    total_salidas: formatearCentavos(salidas),
    efectivo_esperado: formatearCentavos(esperado),
    movimientos,
  };
}

// ==========================================
// CONSULTAR RESUMEN DE LA CAJA ABIERTA
// ==========================================

export async function obtenerResumenCajaActual(): Promise<ResumenCaja | null> {
  const caja = await consultarCajaAbierta();

  if (!caja) {
    return null;
  }

  return construirResumenCaja(caja);
}

// ==========================================
// CONSULTAR RESUMEN POR ID
// ==========================================

export async function obtenerResumenCajaPorId(
  idCaja: number,
): Promise<ResumenCaja> {
  validarIdentificador(idCaja, "El ID de caja");

  const caja = await consultarCajaPorId(idCaja);

  if (!caja) {
    throw new ErrorCaja("La caja solicitada no existe.", 404);
  }

  return construirResumenCaja(caja);
}

// ==========================================
// ABRIR CAJA
// ==========================================

export async function abrirCaja(
  idUsuario: number,
  datos: AbrirCaja,
): Promise<Caja> {
  validarIdentificador(idUsuario, "El usuario");

  const fondoCentavos = validarImporte(datos.fondo_inicial, "El fondo inicial");

  const conexion = await obtenerConexionCaja();

  let bloqueoAdquirido = false;
  let transaccionIniciada = false;

  try {
    bloqueoAdquirido = await adquirirBloqueoAperturaCaja(conexion);

    if (!bloqueoAdquirido) {
      throw new ErrorCaja(
        "No se pudo obtener el bloqueo de apertura. Intenta nuevamente.",
        409,
      );
    }

    await conexion.beginTransaction();
    transaccionIniciada = true;

    const cajaAbierta = await consultarCajaAbierta(conexion);

    if (cajaAbierta) {
      throw new ErrorCaja(
        "Ya existe una caja abierta. Debes cerrarla antes de abrir otra.",
        409,
      );
    }

    const idCaja = await crearAperturaCaja(
      idUsuario,
      Number(formatearCentavos(fondoCentavos)),
      conexion,
    );

    const nuevaCaja = await consultarCajaPorId(idCaja, conexion);

    if (!nuevaCaja) {
      throw new Error("No se pudo recuperar la caja creada.");
    }

    await conexion.commit();
    transaccionIniciada = false;

    return nuevaCaja;
  } catch (error) {
    if (transaccionIniciada) {
      await conexion.rollback();
    }

    throw error;
  } finally {
    try {
      if (bloqueoAdquirido) {
        await liberarBloqueoAperturaCaja(conexion);
      }
    } finally {
      conexion.release();
    }
  }
}

// ==========================================
// CERRAR CAJA
// ==========================================

export async function cerrarCaja(
  idCaja: number,
  idUsuario: number,
  datos: CerrarCaja,
): Promise<ResultadoCierreCaja> {
  validarIdentificador(idCaja, "El ID de caja");
  validarIdentificador(idUsuario, "El usuario");

  const montoRealCentavos = validarImporte(datos.monto_real, "El monto real");

  const observaciones = datos.observaciones?.trim() || null;

  if (observaciones && observaciones.length > 255) {
    throw new ErrorCaja("Las observaciones no pueden superar 255 caracteres.");
  }

  const conexion = await obtenerConexionCaja();

  let transaccionIniciada = false;

  try {
    await conexion.beginTransaction();
    transaccionIniciada = true;

    const caja = await consultarCajaPorId(idCaja, conexion, true);

    if (!caja) {
      throw new ErrorCaja("La caja solicitada no existe.", 404);
    }

    if (caja.estado !== "ABIERTA") {
      throw new ErrorCaja("Esta caja ya se encuentra cerrada.", 409);
    }

    const totales = await consultarTotalesCaja(idCaja, conexion);

    const fondoInicial = convertirACentavos(caja.fondo_inicial);

    const entradas = convertirACentavos(totales.total_entradas);

    const salidas = convertirACentavos(totales.total_salidas);

    const esperado = fondoInicial + entradas - salidas;

    if (esperado < 0) {
      throw new ErrorCaja("El efectivo esperado no puede ser negativo.", 409);
    }

    const diferencia = montoRealCentavos - esperado;

    validarRangoMonetario(esperado);
    validarRangoMonetario(diferencia);

    const actualizado = await actualizarCierreCaja(
      idCaja,
      idUsuario,
      formatearCentavos(esperado),
      formatearCentavos(montoRealCentavos),
      formatearCentavos(diferencia),
      observaciones,
      conexion,
    );

    if (!actualizado) {
      throw new ErrorCaja("No fue posible cerrar la caja.", 409);
    }

    const cajaCerrada = await consultarCajaPorId(idCaja, conexion);

    if (!cajaCerrada) {
      throw new Error("No se pudo recuperar el cierre de caja.");
    }

    await conexion.commit();
    transaccionIniciada = false;

    return {
      mensaje: "Caja cerrada correctamente.",
      caja: cajaCerrada,
    };
  } catch (error) {
    if (transaccionIniciada) {
      await conexion.rollback();
    }

    throw error;
  } finally {
    conexion.release();
  }
}

// ==========================================
// HISTORIAL DE CAJAS
// ==========================================

export async function obtenerHistorialCajas(): Promise<HistorialCaja> {
  const cajas = await listarHistorialCajas();
  const total = await contarCajas();

  return {
    cajas,
    total,
  };
}
