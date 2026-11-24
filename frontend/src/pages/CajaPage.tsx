import { useCallback, useEffect, useRef, useState } from "react";

import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Clock3,
  History,
  LoaderCircle,
  RefreshCw,
  Wallet,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";

import {
  abrirCaja,
  cerrarCaja,
  obtenerCajaActual,
  obtenerHistorialCajas,
} from "../services/cajaApi";

import type { Caja, HistorialCaja, ResumenCaja } from "../types/caja";

// ==========================================
// UTILIDADES
// ==========================================

const formatoMoneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

function mostrarMoneda(valor: string | number): string {
  return formatoMoneda.format(Number(valor));
}

function mostrarFecha(fecha: string | null): string {
  if (!fecha) return "Sin registrar";

  const fechaConvertida = new Date(fecha.replace(" ", "T"));

  if (Number.isNaN(fechaConvertida.getTime())) {
    return fecha;
  }

  return fechaConvertida.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function validarMonto(valor: string): number | null {
  const texto = valor.trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(texto)) {
    return null;
  }

  const numero = Number(texto);

  if (!Number.isFinite(numero) || numero < 0 || numero > 99999999.99) {
    return null;
  }

  return numero;
}

function obtenerMensajeError(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}

// ==========================================
// TARJETA DE RESUMEN
// ==========================================

interface TarjetaResumenProps {
  titulo: string;
  valor: string;
  icono: React.ReactNode;
  descripcion?: string;
}

function TarjetaResumen({
  titulo,
  valor,
  icono,
  descripcion,
}: TarjetaResumenProps) {
  return (
    <article className="rounded-2xl border border-frizalia-soft-pink bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-frizalia-muted">{titulo}</p>

          <p className="mt-2 text-2xl font-bold text-frizalia-text">{valor}</p>
        </div>

        <div className="rounded-xl bg-frizalia-soft-pink p-3 text-pink-500">{icono}</div>
      </div>

      {descripcion && (
        <p className="mt-3 text-xs text-frizalia-muted">{descripcion}</p>
      )}
    </article>
  );
}

// ==========================================
// PANTALLA PRINCIPAL
// ==========================================

export default function CajaPage() {
  const { token } = useAuth();

  // ========================================
  // ESTADOS
  // ========================================

  const [resumen, setResumen] = useState<ResumenCaja | null>(null);

  const [historial, setHistorial] = useState<HistorialCaja | null>(null);

  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [fondoInicial, setFondoInicial] = useState("");
  const [montoReal, setMontoReal] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [confirmacion, setConfirmacion] = useState<{
    idCaja: number;
    esperado: number;
    contado: number;
    observaciones: string | null;
  } | null>(null);
  const dialogoRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = dialogoRef.current;
    if (confirmacion && dialogo && !dialogo.open) dialogo.showModal();
  }, [confirmacion]);

  // ========================================
  // CONSULTAR DATOS
  // ========================================

  const cargarDatos = useCallback(async () => {
    if (!token) {
      setError("No existe una sesión activa.");
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError("");

      const [cajaActual, historialCajas] = await Promise.all([
        obtenerCajaActual(token),
        obtenerHistorialCajas(token),
      ]);

      setResumen(cajaActual);
      setHistorial(historialCajas);
    } catch (errorDesconocido) {
      setError(obtenerMensajeError(errorDesconocido));
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    void Promise.resolve().then(() => cargarDatos());
  }, [cargarDatos]);

  // ========================================
  // ABRIR CAJA
  // ========================================

  async function handleAbrirCaja(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || procesando) return;

    const fondo = validarMonto(fondoInicial);

    if (fondo === null) {
      setError("Ingresa un fondo inicial válido, con máximo dos decimales.");
      return;
    }

    try {
      setProcesando(true);
      setError("");
      setMensaje("");

      const respuesta = await abrirCaja({ fondo_inicial: fondo }, token);

      setFondoInicial("");

      await cargarDatos();

      setMensaje(respuesta.mensaje);
    } catch (errorDesconocido) {
      setError(obtenerMensajeError(errorDesconocido));
    } finally {
      setProcesando(false);
    }
  }

  // ========================================
  // CERRAR CAJA
  // ========================================

  function handleCerrarCaja(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token || !resumen || procesando) return;

    const efectivoContado = validarMonto(montoReal);

    if (efectivoContado === null) {
      setError("Ingresa un monto real válido, con máximo dos decimales.");
      return;
    }

    if (observaciones.length > 255) {
      setError("Las observaciones no pueden superar 255 caracteres.");
      return;
    }

    setError("");
    setConfirmacion({
      idCaja: resumen.caja.id_caja,
      esperado: Number(resumen.efectivo_esperado),
      contado: efectivoContado,
      observaciones: observaciones.trim() || null,
    });
  }

  async function confirmarCierre() {
    if (!token || !confirmacion || procesando) return;

    try {
      setProcesando(true);
      setError("");
      setMensaje("");

      const respuesta = await cerrarCaja(
        confirmacion.idCaja,
        {
          monto_real: confirmacion.contado,
          observaciones: confirmacion.observaciones,
        },
        token,
      );

      setMontoReal("");
      setObservaciones("");

      await cargarDatos();

      setMensaje(respuesta.mensaje);
    } catch (errorDesconocido) {
      setError(obtenerMensajeError(errorDesconocido));
    } finally {
      setConfirmacion(null);
      setProcesando(false);
    }
  }

  // ========================================
  // HISTORIAL
  // ========================================

  function renderizarCajaHistorial(caja: Caja) {
    return (
      <tr
        key={caja.id_caja}
        className="border-b border-frizalia-soft-pink last:border-b-0"
      >
        <td className="px-5 py-4 font-medium text-frizalia-text">
          #{caja.id_caja}
        </td>

        <td className="px-5 py-4 text-frizalia-muted">
          {mostrarFecha(caja.fecha_apertura)}
        </td>

        <td className="px-5 py-4 text-frizalia-muted">
          {mostrarFecha(caja.fecha_cierre)}
        </td>

        <td className="px-5 py-4 text-frizalia-text">
          {mostrarMoneda(caja.fondo_inicial)}
        </td>

        <td className="px-5 py-4 text-frizalia-text">
          {caja.monto_real === null ? "—" : mostrarMoneda(caja.monto_real)}
        </td>

        <td className="px-5 py-4 text-frizalia-text">
          {caja.diferencia === null ? "—" : mostrarMoneda(caja.diferencia)}
        </td>

        <td className="px-5 py-4">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
              caja.estado === "ABIERTA"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-frizalia-muted"
            }`}
          >
            {caja.estado}
          </span>
        </td>
      </tr>
    );
  }

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <div className="space-y-6">
      {/* ENCABEZADO */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-frizalia-text">Caja</h1>

          <p className="mt-1 text-sm text-frizalia-muted">
            Administra la apertura, el efectivo y el cierre de caja.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setMensaje("");
            void cargarDatos();
          }}
          disabled={cargando || procesando}
          className="inline-flex items-center gap-2 rounded-xl border border-frizalia-soft-pink bg-white px-4 py-2.5 text-sm font-semibold text-frizalia-text transition hover:bg-frizalia-cream disabled:opacity-50"
        >
          <RefreshCw size={17} className={cargando ? "animate-spin" : ""} />
          Actualizar
        </button>
      </div>

      {/* MENSAJES */}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={20} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {mensaje && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
        >
          <CheckCircle2 size={20} className="shrink-0" />
          <span>{mensaje}</span>
        </div>
      )}

      {/* CARGA INICIAL */}

      {cargando && !resumen && !historial ? (
        <div className="flex min-h-64 items-center justify-center gap-3 rounded-2xl bg-white text-frizalia-muted">
          <LoaderCircle size={24} className="animate-spin text-pink-500" />
          Cargando información de caja...
        </div>
      ) : (
        <>
          {/* ESTADO DE LA CAJA */}

          <section className="rounded-2xl border border-frizalia-soft-pink bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-frizalia-soft-pink p-4 text-pink-500">
                  <Wallet size={28} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-frizalia-text">
                    Estado de caja
                  </h2>

                  <p className="mt-1 text-sm text-frizalia-muted">
                    {resumen
                      ? `Caja #${resumen.caja.id_caja} · Apertura: ${mostrarFecha(resumen.caja.fecha_apertura)}`
                      : "Actualmente no hay ninguna caja abierta."}
                  </p>
                </div>
              </div>

              <span
                className={`rounded-full px-4 py-2 text-xs font-bold ${
                  resumen
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-frizalia-muted"
                }`}
              >
                {resumen ? "CAJA ABIERTA" : "CAJA CERRADA"}
              </span>
            </div>
          </section>

          {/* SIN CAJA ABIERTA */}

          {!resumen && (
            <section className="rounded-2xl border border-frizalia-soft-pink bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-frizalia-text">
                Abrir nueva caja
              </h2>

              <p className="mt-2 text-sm text-frizalia-muted">
                Registra el efectivo disponible al iniciar las operaciones.
              </p>

              <form
                onSubmit={(event) => {
                  void handleAbrirCaja(event);
                }}
                className="mt-6 max-w-md space-y-4"
              >
                <div>
                  <label
                    htmlFor="fondo-inicial"
                    className="mb-2 block text-sm font-semibold text-frizalia-text"
                  >
                    Fondo inicial (MXN)
                  </label>

                  <input
                    id="fondo-inicial"
                    type="number"
                    min="0"
                    max="99999999.99"
                    step="0.01"
                    required
                    value={fondoInicial}
                    onChange={(event) => setFondoInicial(event.target.value)}
                    placeholder="Ej. 500.00"
                    className="w-full rounded-xl border border-frizalia-soft-pink bg-white px-4 py-3 text-frizalia-text outline-none transition focus:border-frizalia-pink focus:ring-2 focus:ring-frizalia-soft-pink"
                  />
                </div>

                <button
                  type="submit"
                  disabled={procesando || cargando}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-frizalia-yellow px-6 py-3 font-semibold text-frizalia-text transition hover:brightness-95 disabled:opacity-50"
                >
                  {procesando ? (
                    <LoaderCircle size={19} className="animate-spin" />
                  ) : (
                    <Wallet size={19} />
                  )}
                  Abrir caja
                </button>
              </form>
            </section>
          )}

          {/* CAJA ABIERTA */}

          {resumen && (
            <>
              {/* INDICADORES */}

              <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <TarjetaResumen
                  titulo="Fondo inicial"
                  valor={mostrarMoneda(resumen.caja.fondo_inicial)}
                  icono={<Wallet size={22} />}
                />

                <TarjetaResumen
                  titulo="Entradas de efectivo"
                  valor={mostrarMoneda(resumen.total_entradas)}
                  icono={<ArrowDownCircle size={22} />}
                />

                <TarjetaResumen
                  titulo="Salidas de efectivo"
                  valor={mostrarMoneda(resumen.total_salidas)}
                  icono={<ArrowUpCircle size={22} />}
                />

                <TarjetaResumen
                  titulo="Efectivo esperado"
                  valor={mostrarMoneda(resumen.efectivo_esperado)}
                  icono={<CheckCircle2 size={22} />}
                  descripcion="Fondo inicial + entradas - salidas"
                />
              </section>

              {/* MOVIMIENTOS */}

              <section className="rounded-2xl border border-frizalia-soft-pink bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-frizalia-text">
                  Movimientos de caja
                </h2>

                {resumen.movimientos.length === 0 ? (
                  <div className="py-10 text-center">
                    <Clock3 size={32} className="mx-auto text-slate-300" />

                    <p className="mt-3 text-sm text-frizalia-muted">
                      Todavía no hay movimientos registrados.
                    </p>
                  </div>
                ) : (
                  <div className="mt-5 space-y-3">
                    {resumen.movimientos.map((movimiento) => (
                      <div
                        key={movimiento.id_movimiento_caja}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-frizalia-soft-pink p-4"
                      >
                        <div>
                          <p className="font-semibold text-frizalia-text">
                            {movimiento.motivo}
                          </p>

                          <p className="mt-1 text-xs text-frizalia-muted">
                            {mostrarFecha(movimiento.fecha_movimiento)}
                          </p>
                        </div>

                        <p
                          className={`font-bold ${
                            movimiento.tipo === "ENTRADA"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {movimiento.tipo === "ENTRADA" ? "+" : "-"}
                          {mostrarMoneda(movimiento.monto)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* CIERRE */}

              <section className="rounded-2xl border border-frizalia-soft-pink bg-white p-6 shadow-sm">
                <h2 className="text-xl font-bold text-frizalia-text">
                  Cerrar caja
                </h2>

                <p className="mt-2 text-sm text-frizalia-muted">
                  Cuenta el efectivo disponible e ingresa el monto real para
                  registrar el cierre.
                </p>

                <form
                  onSubmit={(event) => {
                    void handleCerrarCaja(event);
                  }}
                  className="mt-6 max-w-lg space-y-4"
                >
                  <div className="rounded-xl bg-frizalia-soft-pink p-4">
                    <p className="text-sm text-frizalia-text">Efectivo esperado</p>

                    <p className="mt-1 text-2xl font-bold text-frizalia-text">
                      {mostrarMoneda(resumen.efectivo_esperado)}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="monto-real"
                      className="mb-2 block text-sm font-semibold text-frizalia-text"
                    >
                      Efectivo contado (MXN)
                    </label>

                    <input
                      id="monto-real"
                      type="number"
                      min="0"
                      max="99999999.99"
                      step="0.01"
                      required
                      value={montoReal}
                      onChange={(event) => setMontoReal(event.target.value)}
                      placeholder="Ingresa el efectivo contado"
                      className="w-full rounded-xl border border-frizalia-soft-pink px-4 py-3 outline-none focus:border-frizalia-pink focus:ring-2 focus:ring-frizalia-soft-pink"
                    />
                  </div>

                  {validarMonto(montoReal) !== null && (
                    <div className="rounded-xl bg-frizalia-cream p-4">
                      <p className="text-sm text-frizalia-muted">
                        Diferencia estimada
                      </p>

                      <p className="mt-1 text-xl font-bold text-frizalia-text">
                        {mostrarMoneda(
                          Math.round(validarMonto(montoReal)! * 100) / 100 -
                            Number(resumen.efectivo_esperado),
                        )}
                      </p>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="observaciones"
                      className="mb-2 block text-sm font-semibold text-frizalia-text"
                    >
                      Observaciones (opcional)
                    </label>

                    <textarea
                      id="observaciones"
                      rows={3}
                      maxLength={255}
                      value={observaciones}
                      onChange={(event) => setObservaciones(event.target.value)}
                      placeholder="Comentarios sobre el cierre..."
                      className="w-full resize-none rounded-xl border border-frizalia-soft-pink px-4 py-3 outline-none focus:border-frizalia-pink focus:ring-2 focus:ring-frizalia-soft-pink"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={procesando || cargando}
                    className="inline-flex items-center gap-2 rounded-xl bg-frizalia-yellow px-6 py-3 font-semibold text-frizalia-text transition hover:brightness-95 disabled:opacity-50"
                  >
                    {procesando ? (
                      <LoaderCircle size={19} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={19} />
                    )}
                    Confirmar cierre
                  </button>
                </form>
              </section>
            </>
          )}

          {/* HISTORIAL */}

          <section className="overflow-hidden rounded-2xl border border-frizalia-soft-pink bg-white shadow-sm">
            <div className="flex items-center gap-3 border-b border-frizalia-soft-pink px-6 py-5">
              <History size={21} className="text-pink-500" />

              <div>
                <h2 className="text-lg font-bold text-frizalia-text">
                  Historial de cajas
                </h2>

                <p className="text-sm text-frizalia-muted">
                  {historial?.total ?? 0} registros
                </p>
              </div>
            </div>

            {!historial || historial.cajas.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-frizalia-muted">
                No hay cajas registradas.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-frizalia-cream text-xs uppercase text-frizalia-muted">
                    <tr>
                      <th className="px-5 py-4">Caja</th>
                      <th className="px-5 py-4">Apertura</th>
                      <th className="px-5 py-4">Cierre</th>
                      <th className="px-5 py-4">Fondo</th>
                      <th className="px-5 py-4">Monto real</th>
                      <th className="px-5 py-4">Diferencia</th>
                      <th className="px-5 py-4">Estado</th>
                    </tr>
                  </thead>

                  <tbody>{historial.cajas.map(renderizarCajaHistorial)}</tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
      {confirmacion && (
        <dialog
          ref={dialogoRef}
          aria-labelledby="titulo-cierre-caja"
          onCancel={(event) => {
            event.preventDefault();
            if (!procesando) setConfirmacion(null);
          }}
          className="fixed inset-0 m-auto max-h-[90vh] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-2xl border border-frizalia-soft-pink bg-white p-6 text-frizalia-text shadow-xl backdrop:bg-slate-900/50"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-frizalia-soft-pink p-3 text-pink-500">
                <Wallet size={24} />
              </div>
              <h2 id="titulo-cierre-caja" className="text-xl font-bold">
                Confirmar cierre de Caja #{confirmacion.idCaja}
              </h2>
            </div>
            <p className="text-sm text-frizalia-muted">
              Revisa los importes antes de finalizar las operaciones de esta caja.
            </p>
            <div className="space-y-3 rounded-xl bg-frizalia-soft-pink p-4 text-sm">
              <div className="flex justify-between gap-3">
                <span>Efectivo esperado</span>
                <strong>{mostrarMoneda(confirmacion.esperado)}</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span>Efectivo contado</span>
                <strong>{mostrarMoneda(confirmacion.contado)}</strong>
              </div>
              <div className="flex justify-between gap-3 border-t border-white pt-3">
                <span>Diferencia estimada</span>
                <strong className={Math.round((confirmacion.contado - confirmacion.esperado) * 100) === 0 ? "text-emerald-700" : "text-amber-700"}>
                  {mostrarMoneda(Math.round((confirmacion.contado - confirmacion.esperado) * 100) / 100)}
                </strong>
              </div>
            </div>
            {confirmacion.observaciones && (
              <div className="rounded-xl bg-frizalia-cream p-3 text-sm">
                <p className="font-semibold">Observaciones</p>
                <p className="mt-1 whitespace-pre-wrap break-words">{confirmacion.observaciones}</p>
              </div>
            )}
            <div className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              <AlertCircle size={18} className="shrink-0" />
              <span>Esta acción no se puede deshacer. Para vender nuevamente deberás abrir otra caja.</span>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" autoFocus disabled={procesando} onClick={() => setConfirmacion(null)} className="rounded-xl border border-frizalia-pink px-4 py-3 text-sm font-semibold disabled:opacity-50">
                Cancelar
              </button>
              <button type="button" disabled={procesando} onClick={() => { void confirmarCierre(); }} className="inline-flex items-center gap-2 rounded-xl bg-frizalia-yellow px-4 py-3 text-sm font-semibold hover:brightness-95 disabled:opacity-50">
                {procesando && <LoaderCircle size={17} className="animate-spin" />}
                {procesando ? "Cerrando..." : "Confirmar cierre"}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
