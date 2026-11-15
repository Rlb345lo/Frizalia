import { useState, type FormEvent } from "react";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardPen,
  LoaderCircle,
  Package,
  Save,
  X,
} from "lucide-react";

import { registrarMovimientoInventario } from "../../services/inventarioApi";

import type {
  NuevoMovimientoInventario,
  ProductoInventario,
  TipoMovimientoInventario,
} from "../../types/inventario";

// ==========================================
// PROPIEDADES DEL COMPONENTE
// ==========================================

interface MovimientoInventarioModalProps {
  producto: ProductoInventario;
  token: string;
  onCerrar: () => void;
  onMovimientoRegistrado: () => void | Promise<void>;
}

// ==========================================
// TIPOS DEL FORMULARIO
// ==========================================

interface FormularioMovimiento {
  tipo: TipoMovimientoInventario;
  cantidad: string;
  motivo: string;
}

function crearFormularioInicial(): FormularioMovimiento {
  return {
    tipo: "ENTRADA",
    cantidad: "",
    motivo: "",
  };
}

// ==========================================
// COMPONENTE
// ==========================================

export default function MovimientoInventarioModal({
  producto,
  token,
  onCerrar,
  onMovimientoRegistrado,
}: MovimientoInventarioModalProps) {
  // ========================================
  // ESTADOS
  // ========================================

  const [formulario, setFormulario] = useState<FormularioMovimiento>(
    crearFormularioInicial,
  );

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [movimientoConfirmado, setMovimientoConfirmado] = useState(false);

  // ========================================
  // VALIDACIONES
  // ========================================

  const cantidad = Number(formulario.cantidad);
  const motivo = formulario.motivo.trim();

  const cantidadValida =
    formulario.cantidad.trim() !== "" &&
    Number.isSafeInteger(cantidad) &&
    (formulario.tipo === "AJUSTE" ? cantidad >= 0 : cantidad > 0);

  const stockSuficiente =
    formulario.tipo !== "SALIDA" ||
    (cantidadValida && cantidad <= producto.stock);

  const formularioValido =
    cantidadValida &&
    stockSuficiente &&
    motivo.length > 0 &&
    motivo.length <= 255;

  const puedeGuardar = formularioValido && !guardando && !movimientoConfirmado;

  // ========================================
  // CALCULAR STOCK PREVISTO
  // ========================================

  const stockPrevisto = cantidadValida
    ? formulario.tipo === "ENTRADA"
      ? producto.stock + cantidad
      : formulario.tipo === "SALIDA"
        ? producto.stock - cantidad
        : cantidad
    : producto.stock;

  const stockPrevistoValido =
    Number.isSafeInteger(stockPrevisto) &&
    stockPrevisto >= 0 &&
    stockPrevisto <= 2147483647;

  // ========================================
  // ACTUALIZAR CAMPOS
  // ========================================

  function actualizarCampo(campo: keyof FormularioMovimiento, valor: string) {
    if (guardando || movimientoConfirmado) return;

    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    if (error) {
      setError(null);
    }
  }

  // ========================================
  // CERRAR MODAL
  // ========================================

  function cerrarModal() {
    if (guardando) return;
    onCerrar();
  }

  // ========================================
  // GUARDAR MOVIMIENTO
  // ========================================

  async function guardarMovimiento(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!puedeGuardar || !stockPrevistoValido) return;

    const datos: NuevoMovimientoInventario = {
      id_producto: producto.id_producto,
      tipo: formulario.tipo,
      cantidad,
      motivo,
    };

    try {
      setGuardando(true);
      setError(null);

      // 1. Registrar movimiento en MySQL.
      await registrarMovimientoInventario(datos, token);

      // 2. Bloquear nuevos envíos para evitar duplicados.
      setMovimientoConfirmado(true);

      // 3. Actualizar tabla y estadísticas.
      await onMovimientoRegistrado();

      // 4. Cerrar modal.
      onCerrar();
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo registrar el movimiento.",
      );
    } finally {
      setGuardando(false);
    }
  }

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="movimiento-inventario-titulo"
        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-frizalia-soft-pink bg-white shadow-xl"
      >
        {/* ENCABEZADO */}

        <div className="flex items-start justify-between gap-4 border-b border-frizalia-soft-pink p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-frizalia-soft-pink">
              <Package size={24} className="text-frizalia-text" />
            </div>

            <div>
              <h2
                id="movimiento-inventario-titulo"
                className="text-xl font-bold text-frizalia-text"
              >
                Movimiento de inventario
              </h2>

              <p className="mt-1 text-sm text-frizalia-muted">
                {producto.nombre}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={cerrarModal}
            disabled={guardando}
            aria-label="Cerrar formulario"
            className="rounded-lg p-2 text-frizalia-muted transition hover:bg-frizalia-cream hover:text-frizalia-text disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORMULARIO */}

        <form
          onSubmit={(evento) => void guardarMovimiento(evento)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="space-y-5 overflow-y-auto p-6">
            {/* ERROR */}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            {/* PRODUCTO Y STOCK ACTUAL */}

            <div className="rounded-xl border border-frizalia-soft-pink bg-frizalia-cream p-4">
              <p className="text-xs font-medium text-frizalia-muted">
                Producto seleccionado
              </p>

              <p className="mt-1 font-semibold text-frizalia-text">
                {producto.nombre}
              </p>

              <div className="mt-3 flex items-center justify-between gap-3 border-t border-frizalia-soft-pink pt-3">
                <span className="text-sm text-frizalia-muted">
                  Stock actual
                </span>

                <span className="text-xl font-bold text-frizalia-text">
                  {producto.stock} unidades
                </span>
              </div>
            </div>

            {/* TIPO DE MOVIMIENTO */}

            <fieldset>
              <legend className="mb-3 text-sm font-semibold text-frizalia-text">
                Tipo de movimiento *
              </legend>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    {
                      tipo: "ENTRADA",
                      titulo: "Entrada",
                      icono: ArrowDownToLine,
                    },
                    {
                      tipo: "SALIDA",
                      titulo: "Salida",
                      icono: ArrowUpFromLine,
                    },
                    {
                      tipo: "AJUSTE",
                      titulo: "Ajuste",
                      icono: ClipboardPen,
                    },
                  ] as const
                ).map((opcion) => {
                  const Icono = opcion.icono;

                  const seleccionado = formulario.tipo === opcion.tipo;

                  return (
                    <label
                      key={opcion.tipo}
                      className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3 text-center text-sm font-semibold transition ${
                        seleccionado
                          ? "border-pink-500 bg-pink-50 text-pink-700"
                          : "border-frizalia-soft-pink bg-white text-frizalia-muted hover:bg-frizalia-cream"
                      }`}
                    >
                      <input
                        type="radio"
                        name="tipo-movimiento"
                        value={opcion.tipo}
                        checked={seleccionado}
                        onChange={() => actualizarCampo("tipo", opcion.tipo)}
                        disabled={guardando || movimientoConfirmado}
                        className="sr-only"
                      />

                      <Icono size={21} />

                      {opcion.titulo}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {/* CANTIDAD */}

            <div>
              <label
                htmlFor="movimiento-cantidad"
                className="mb-2 block text-sm font-semibold text-frizalia-text"
              >
                {formulario.tipo === "AJUSTE"
                  ? "Nuevo stock real *"
                  : "Cantidad de unidades *"}
              </label>

              <input
                id="movimiento-cantidad"
                type="number"
                required
                min={formulario.tipo === "AJUSTE" ? 0 : 1}
                step="1"
                value={formulario.cantidad}
                onChange={(evento) =>
                  actualizarCampo("cantidad", evento.target.value)
                }
                disabled={guardando || movimientoConfirmado}
                placeholder={
                  formulario.tipo === "AJUSTE"
                    ? "Ej. 25 unidades reales"
                    : "Ej. 10 unidades"
                }
                className="w-full rounded-xl border border-frizalia-soft-pink bg-frizalia-cream px-4 py-3 text-sm text-frizalia-text outline-none focus:border-pink-500 disabled:opacity-60"
              />

              {formulario.tipo === "SALIDA" &&
                cantidadValida &&
                !stockSuficiente && (
                  <p className="mt-2 text-xs text-red-600">
                    No puedes retirar más unidades de las disponibles.
                  </p>
                )}

              {formulario.tipo === "AJUSTE" && (
                <p className="mt-2 text-xs text-frizalia-muted">
                  El ajuste establece el stock final, no suma ni resta unidades.
                </p>
              )}
            </div>

            {/* PREVISUALIZACIÓN */}

            <div className="rounded-xl border border-frizalia-soft-pink bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-frizalia-text">
                Vista previa del movimiento
              </p>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-frizalia-muted">Stock anterior</p>

                  <p className="mt-1 text-xl font-bold text-frizalia-text">
                    {producto.stock}
                  </p>
                </div>

                <span className="text-xl text-frizalia-muted">→</span>

                <div className="text-right">
                  <p className="text-xs text-frizalia-muted">
                    Stock resultante
                  </p>

                  <p
                    className={`mt-1 text-xl font-bold ${
                      stockPrevistoValido ? "text-pink-600" : "text-red-600"
                    }`}
                  >
                    {cantidadValida ? stockPrevisto : "—"}
                  </p>
                </div>
              </div>

              {!stockPrevistoValido && (
                <p className="mt-2 text-xs text-red-600">
                  El stock resultante está fuera del rango permitido.
                </p>
              )}
            </div>

            {/* MOTIVO */}

            <div>
              <label
                htmlFor="movimiento-motivo"
                className="mb-2 block text-sm font-semibold text-frizalia-text"
              >
                Motivo del movimiento *
              </label>

              <textarea
                id="movimiento-motivo"
                rows={3}
                required
                maxLength={255}
                value={formulario.motivo}
                onChange={(evento) =>
                  actualizarCampo("motivo", evento.target.value)
                }
                disabled={guardando || movimientoConfirmado}
                placeholder={
                  formulario.tipo === "ENTRADA"
                    ? "Ej. Reabastecimiento de mercancía"
                    : formulario.tipo === "SALIDA"
                      ? "Ej. Producto dañado o caducado"
                      : "Ej. Corrección después del conteo físico"
                }
                className="w-full resize-none rounded-xl border border-frizalia-soft-pink bg-frizalia-cream px-4 py-3 text-sm text-frizalia-text outline-none focus:border-pink-500 disabled:opacity-60"
              />

              <p className="mt-1 text-right text-xs text-frizalia-muted">
                {formulario.motivo.length}/255
              </p>
            </div>

            {/* NOTA */}

            <p className="text-xs text-frizalia-muted">
              El movimiento quedará registrado en el historial de inventario con
              su motivo y fecha.
            </p>
          </div>

          {/* BOTONES */}

          <div className="flex flex-wrap justify-end gap-3 border-t border-frizalia-soft-pink bg-white p-5">
            <button
              type="button"
              onClick={cerrarModal}
              disabled={guardando}
              className="rounded-xl border border-frizalia-soft-pink bg-white px-5 py-2.5 text-sm font-semibold text-frizalia-text transition hover:bg-frizalia-cream disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!puedeGuardar || !stockPrevistoValido}
              className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 ${
                guardando
                  ? "cursor-wait bg-pink-800"
                  : puedeGuardar && stockPrevistoValido
                    ? "bg-pink-600 shadow-md hover:bg-pink-700 hover:shadow-lg"
                    : "cursor-not-allowed bg-pink-300"
              }`}
            >
              {guardando ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Registrar movimiento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
