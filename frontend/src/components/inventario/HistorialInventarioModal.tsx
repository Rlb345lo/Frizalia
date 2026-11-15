import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardPen,
  History,
  LoaderCircle,
  Package,
  RefreshCw,
  X,
} from "lucide-react";

import { obtenerMovimientosPorProducto } from "../../services/inventarioApi";

import type {
  MovimientoInventario,
  ProductoInventario,
  TipoMovimientoInventario,
} from "../../types/inventario";

// ==========================================
// PROPIEDADES DEL MODAL
// ==========================================

interface HistorialInventarioModalProps {
  producto: ProductoInventario;
  token: string;
  onCerrar: () => void;
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function formatearFecha(fecha: string): string {
  const fechaMovimiento = new Date(fecha);

  if (Number.isNaN(fechaMovimiento.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fechaMovimiento);
}

function obtenerConfiguracionMovimiento(tipo: TipoMovimientoInventario) {
  switch (tipo) {
    case "ENTRADA":
      return {
        titulo: "Entrada",
        icono: ArrowDownToLine,
        estiloIcono: "bg-green-100 text-green-700",
        estiloCantidad: "text-green-700",
      };

    case "SALIDA":
      return {
        titulo: "Salida",
        icono: ArrowUpFromLine,
        estiloIcono: "bg-orange-100 text-orange-700",
        estiloCantidad: "text-orange-700",
      };

    case "AJUSTE":
      return {
        titulo: "Ajuste",
        icono: ClipboardPen,
        estiloIcono: "bg-pink-100 text-pink-700",
        estiloCantidad: "text-pink-700",
      };
  }
}

function formatearCantidad(movimiento: MovimientoInventario): string {
  switch (movimiento.tipo) {
    case "ENTRADA":
      return `+${movimiento.cantidad}`;

    case "SALIDA":
      return `-${movimiento.cantidad}`;

    case "AJUSTE":
      return `${movimiento.cantidad}`;
  }
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function HistorialInventarioModal({
  producto,
  token,
  onCerrar,
}: HistorialInventarioModalProps) {
  // ========================================
  // ESTADOS
  // ========================================

  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([]);

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========================================
  // CARGA INICIAL
  // ========================================

  useEffect(() => {
    let activo = true;

    async function consultarHistorial() {
      try {
        const datos = await obtenerMovimientosPorProducto(
          producto.id_producto,
          token,
        );

        if (!activo) return;

        setMovimientos(datos);
        setError(null);
      } catch (errorDesconocido) {
        if (!activo) return;

        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No se pudo cargar el historial.",
        );
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    void consultarHistorial();

    return () => {
      activo = false;
    };
  }, [producto.id_producto, token]);

  // ========================================
  // ACTUALIZAR HISTORIAL
  // ========================================

  async function actualizarHistorial() {
    if (actualizando || cargando) return;

    try {
      setActualizando(true);
      setError(null);

      const datos = await obtenerMovimientosPorProducto(
        producto.id_producto,
        token,
      );

      setMovimientos(datos);
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo actualizar el historial.",
      );
    } finally {
      setActualizando(false);
    }
  }

  // ========================================
  // ORDENAR MOVIMIENTOS
  // ========================================

  const movimientosOrdenados = useMemo(() => {
    return [...movimientos].sort(
      (primero, segundo) => segundo.id_movimiento - primero.id_movimiento,
    );
  }, [movimientos]);

  // ========================================
  // ESTADÍSTICAS
  // ========================================

  const estadisticas = useMemo(() => {
    return {
      total: movimientos.length,

      entradas: movimientos.filter(
        (movimiento) => movimiento.tipo === "ENTRADA",
      ).length,

      salidas: movimientos.filter((movimiento) => movimiento.tipo === "SALIDA")
        .length,

      ajustes: movimientos.filter((movimiento) => movimiento.tipo === "AJUSTE")
        .length,
    };
  }, [movimientos]);

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
        aria-labelledby="historial-inventario-titulo"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-frizalia-soft-pink bg-white shadow-xl"
      >
        {/* ==================================
            ENCABEZADO
        ================================== */}

        <div className="flex items-start justify-between gap-4 border-b border-frizalia-soft-pink p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-frizalia-soft-pink">
              <History size={24} className="text-frizalia-text" />
            </div>

            <div>
              <h2
                id="historial-inventario-titulo"
                className="text-xl font-bold text-frizalia-text"
              >
                Historial de inventario
              </h2>

              <p className="mt-1 text-sm text-frizalia-muted">
                Consulta los movimientos de {producto.nombre}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar historial"
            className="rounded-lg p-2 text-frizalia-muted transition hover:bg-frizalia-cream hover:text-frizalia-text"
          >
            <X size={20} />
          </button>
        </div>

        {/* ==================================
            CONTENIDO
        ================================== */}

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-6">
          {/* INFORMACIÓN DEL PRODUCTO */}

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-frizalia-soft-pink bg-frizalia-cream p-4">
            <div className="flex items-center gap-3">
              <Package size={22} className="text-frizalia-text" />

              <div>
                <p className="font-semibold text-frizalia-text">
                  {producto.nombre}
                </p>

                <p className="text-xs text-frizalia-muted">
                  {producto.categoria}
                  {producto.presentacion ? ` · ${producto.presentacion}` : ""}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs text-frizalia-muted">Stock al abrir</p>

              <p className="text-xl font-bold text-frizalia-text">
                {producto.stock} unidades
              </p>
            </div>
          </div>

          {/* ESTADÍSTICAS */}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              {
                titulo: "Movimientos",
                valor: estadisticas.total,
              },
              {
                titulo: "Entradas",
                valor: estadisticas.entradas,
              },
              {
                titulo: "Salidas",
                valor: estadisticas.salidas,
              },
              {
                titulo: "Ajustes",
                valor: estadisticas.ajustes,
              },
            ].map((estadistica) => (
              <div
                key={estadistica.titulo}
                className="rounded-xl border border-frizalia-soft-pink bg-white p-3"
              >
                <p className="text-xs text-frizalia-muted">
                  {estadistica.titulo}
                </p>

                <p className="mt-2 text-xl font-bold text-frizalia-text">
                  {cargando ? "..." : estadistica.valor}
                </p>
              </div>
            ))}
          </div>

          {/* ENCABEZADO DE MOVIMIENTOS */}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-frizalia-text">
                Movimientos registrados
              </h3>

              <p className="mt-1 text-xs text-frizalia-muted">
                Se muestran los movimientos más recientes primero.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                void actualizarHistorial();
              }}
              disabled={cargando || actualizando}
              className="inline-flex items-center gap-2 rounded-xl border border-frizalia-soft-pink bg-white px-4 py-2 text-sm font-semibold text-frizalia-text transition hover:bg-frizalia-soft-pink disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={actualizando ? "animate-spin" : ""}
              />

              {actualizando ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          {/* ERROR */}

          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              <AlertCircle size={19} className="shrink-0" />

              <p>{error}</p>
            </div>
          )}

          {/* CARGANDO */}

          {cargando ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-frizalia-muted">
              <LoaderCircle size={30} className="animate-spin" />

              <p className="text-sm">Consultando historial...</p>
            </div>
          ) : movimientosOrdenados.length === 0 ? (
            /* SIN MOVIMIENTOS */

            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-frizalia-soft-pink p-10 text-center">
              <History size={34} className="mb-3 text-frizalia-muted" />

              <p className="font-semibold text-frizalia-text">
                No hay movimientos registrados
              </p>

              <p className="mt-2 max-w-sm text-sm text-frizalia-muted">
                Cuando se registren entradas, salidas o ajustes de este
                producto, aparecerán aquí.
              </p>
            </div>
          ) : (
            /* LISTA DE MOVIMIENTOS */

            <div className="space-y-3">
              {movimientosOrdenados.map((movimiento) => {
                const configuracion = obtenerConfiguracionMovimiento(
                  movimiento.tipo,
                );

                const Icono = configuracion.icono;

                return (
                  <article
                    key={movimiento.id_movimiento}
                    className="rounded-xl border border-frizalia-soft-pink bg-white p-4 transition hover:bg-frizalia-cream/40"
                  >
                    <div className="flex items-start gap-3">
                      {/* ICONO */}

                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${configuracion.estiloIcono}`}
                      >
                        <Icono size={21} />
                      </div>

                      {/* INFORMACIÓN */}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-bold text-frizalia-text">
                              {configuracion.titulo}
                            </p>

                            <p className="mt-1 text-xs text-frizalia-muted">
                              {formatearFecha(movimiento.fecha_movimiento)}
                            </p>
                          </div>

                          <div className="text-right">
                            <p
                              className={`text-lg font-bold ${configuracion.estiloCantidad}`}
                            >
                              {formatearCantidad(movimiento)}
                            </p>

                            <p className="text-xs text-frizalia-muted">
                              {movimiento.tipo === "AJUSTE"
                                ? "Stock final"
                                : "Unidades"}
                            </p>
                          </div>
                        </div>

                        {/* MOTIVO */}

                        <div className="mt-3 rounded-lg bg-frizalia-cream p-3">
                          <p className="text-xs font-semibold text-frizalia-muted">
                            Motivo
                          </p>

                          <p className="mt-1 break-words text-sm text-frizalia-text">
                            {movimiento.motivo}
                          </p>
                        </div>

                        {/* INFORMACIÓN ADICIONAL */}

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-frizalia-muted">
                          <span>Movimiento #{movimiento.id_movimiento}</span>

                          <span>Usuario #{movimiento.id_usuario}</span>

                          {movimiento.id_solicitud !== null && (
                            <span>Solicitud #{movimiento.id_solicitud}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* NOTA */}

          <p className="text-xs text-frizalia-muted">
            Las entradas suman existencias, las salidas las descuentan y los
            ajustes establecen el stock final. El historial conserva los
            movimientos registrados.
          </p>
        </div>

        {/* ==================================
            PIE DEL MODAL
        ================================== */}

        <div className="flex justify-end border-t border-frizalia-soft-pink bg-white p-5">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-xl bg-pink-500 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-pink-600 hover:shadow-md"
          >
            Cerrar historial
          </button>
        </div>
      </div>
    </div>
  );
}
