import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  PackagePlus,
  Search,
  X,
} from "lucide-react";

import { registrarReabastecimientoMultiple } from "../../services/inventarioApi";

import type {
  ProductoInventario,
  ResultadoReabastecimientoMultiple,
} from "../../types/inventario";

interface Props {
  productos: ProductoInventario[];
  token: string;
  onCerrar: () => void;
  onReabastecimientoRegistrado: () => void | Promise<void>;
}

const MAX_STOCK = 2147483647;
const MAX_PRODUCTOS = 100;

export default function ReabastecimientoMultipleModal({
  productos,
  token,
  onCerrar,
  onReabastecimientoRegistrado,
}: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("todas");

  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [cantidades, setCantidades] = useState<Record<number, string>>({});

  const [motivo, setMotivo] = useState("Reabastecimiento de mercancía");

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] =
    useState<ResultadoReabastecimientoMultiple | null>(null);

  // ==========================================
  // CATEGORÍAS DISPONIBLES
  // ==========================================

  const categorias = useMemo(() => {
    return [...new Set(productos.map((producto) => producto.categoria))].sort(
      (a, b) => a.localeCompare(b, "es"),
    );
  }, [productos]);

  // ==========================================
  // FILTRAR PRODUCTOS
  // ==========================================

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return productos.filter((producto) => {
      const coincideBusqueda =
        producto.nombre.toLowerCase().includes(texto) ||
        producto.categoria.toLowerCase().includes(texto) ||
        (producto.presentacion ?? "").toLowerCase().includes(texto);

      const coincideCategoria =
        categoria === "todas" || producto.categoria === categoria;

      return coincideBusqueda && coincideCategoria;
    });
  }, [productos, busqueda, categoria]);

  // ==========================================
  // PRODUCTOS SELECCIONADOS
  // ==========================================

  const productosSeleccionados = useMemo(() => {
    return productos.filter((producto) =>
      seleccionados.includes(producto.id_producto),
    );
  }, [productos, seleccionados]);

  const unidadesTotales = productosSeleccionados.reduce((total, producto) => {
    const cantidad = Number(cantidades[producto.id_producto] ?? 0);

    return total + (Number.isFinite(cantidad) ? cantidad : 0);
  }, 0);

  // ==========================================
  // SELECCIONAR PRODUCTO
  // ==========================================

  function cambiarSeleccion(idProducto: number) {
    if (guardando || resultado) return;

    setError("");

    if (seleccionados.includes(idProducto)) {
      setSeleccionados((actuales) =>
        actuales.filter((id) => id !== idProducto),
      );

      return;
    }

    if (seleccionados.length >= MAX_PRODUCTOS) {
      setError(`Puedes seleccionar hasta ${MAX_PRODUCTOS} productos.`);
      return;
    }

    setSeleccionados((actuales) => [...actuales, idProducto]);

    setCantidades((actuales) => ({
      ...actuales,
      [idProducto]: actuales[idProducto] ?? "1",
    }));
  }

  // ==========================================
  // SELECCIONAR PRODUCTOS VISIBLES
  // ==========================================

  function seleccionarVisibles() {
    if (guardando || resultado) return;

    const nuevosIds = productosFiltrados
      .map((producto) => producto.id_producto)
      .filter((id) => !seleccionados.includes(id));

    if (seleccionados.length + nuevosIds.length > MAX_PRODUCTOS) {
      setError(`Puedes seleccionar hasta ${MAX_PRODUCTOS} productos.`);
      return;
    }

    setSeleccionados((actuales) => [...actuales, ...nuevosIds]);

    setCantidades((actuales) => {
      const nuevasCantidades = { ...actuales };

      for (const id of nuevosIds) {
        nuevasCantidades[id] = nuevasCantidades[id] ?? "1";
      }

      return nuevasCantidades;
    });

    setError("");
  }

  // ==========================================
  // VALIDAR Y REGISTRAR
  // ==========================================

  async function manejarGuardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (guardando || resultado) return;

    setError("");

    if (productosSeleccionados.length === 0) {
      setError("Selecciona al menos un producto.");
      return;
    }

    const motivoLimpio = motivo.trim();

    if (!motivoLimpio || motivoLimpio.length > 255) {
      setError("El motivo debe contener entre 1 y 255 caracteres.");
      return;
    }

    const productosParaEnviar = productosSeleccionados.map((producto) => ({
      id_producto: producto.id_producto,
      cantidad: Number(cantidades[producto.id_producto] ?? 0),
    }));

    for (const item of productosParaEnviar) {
      const producto = productosSeleccionados.find(
        (actual) => actual.id_producto === item.id_producto,
      );

      if (!producto) continue;

      if (
        !Number.isSafeInteger(item.cantidad) ||
        item.cantidad <= 0 ||
        item.cantidad > MAX_STOCK
      ) {
        setError(`La cantidad de "${producto.nombre}" no es válida.`);
        return;
      }

      if (producto.stock + item.cantidad > MAX_STOCK) {
        setError(
          `El stock de "${producto.nombre}" supera el límite permitido.`,
        );
        return;
      }
    }

    setGuardando(true);

    let registro: ResultadoReabastecimientoMultiple;

    try {
      registro = await registrarReabastecimientoMultiple(
        {
          productos: productosParaEnviar,
          motivo: motivoLimpio,
        },
        token,
      );
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo registrar el reabastecimiento.",
      );

      setGuardando(false);
      return;
    }

    // La operación ya fue confirmada por el backend.
    // Evitamos que se envíe una segunda vez.
    setResultado(registro);

    try {
      await onReabastecimientoRegistrado();
    } catch {
      setError(
        "El reabastecimiento se registró, pero no se pudo actualizar la tabla. Actualiza la página para ver los cambios.",
      );
    } finally {
      setGuardando(false);
    }
  }

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* ENCABEZADO */}

        <div className="flex items-start justify-between border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-pink-100 p-3 text-pink-600">
              <PackagePlus size={24} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Reabastecimiento múltiple
              </h2>

              <p className="text-sm text-gray-500">
                Agrega existencias a varios productos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* RESULTADO EXITOSO */}

        {resultado ? (
          <div className="flex flex-col items-center gap-4 overflow-y-auto p-8 text-center">
            <CheckCircle2 size={56} className="text-green-600" />

            <h3 className="text-xl font-bold text-gray-900">
              ¡Reabastecimiento registrado!
            </h3>

            <p className="text-sm text-gray-600">
              Se actualizaron {resultado.productos_actualizados} productos y se
              agregaron {resultado.unidades_agregadas} unidades.
            </p>

            {error && (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
              className="rounded-xl bg-pink-500 px-6 py-3 font-semibold text-white hover:bg-pink-600 disabled:opacity-50"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form
            onSubmit={(evento) => void manejarGuardar(evento)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {/* FILTROS */}

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3 top-3 text-gray-400"
                  />

                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={busqueda}
                    onChange={(evento) => setBusqueda(evento.target.value)}
                    disabled={guardando}
                    className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-3 outline-none focus:border-pink-400"
                  />
                </div>

                <select
                  value={categoria}
                  onChange={(evento) => setCategoria(evento.target.value)}
                  disabled={guardando}
                  className="rounded-xl border border-gray-200 px-3 py-2.5 outline-none focus:border-pink-400"
                >
                  <option value="todas">Todas las categorías</option>

                  {categorias.map((nombre) => (
                    <option key={nombre} value={nombre}>
                      {nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* SELECCIÓN */}

              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-700">
                  {seleccionados.length} productos seleccionados
                </p>

                <button
                  type="button"
                  onClick={seleccionarVisibles}
                  disabled={guardando || productosFiltrados.length === 0}
                  className="text-sm font-semibold text-pink-600 hover:text-pink-700 disabled:opacity-50"
                >
                  Seleccionar visibles
                </button>
              </div>

              {/* LISTADO DE PRODUCTOS */}

              <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-gray-200 p-2">
                {productosFiltrados.length === 0 ? (
                  <p className="p-5 text-center text-sm text-gray-500">
                    No se encontraron productos.
                  </p>
                ) : (
                  productosFiltrados.map((producto) => {
                    const seleccionado = seleccionados.includes(
                      producto.id_producto,
                    );

                    return (
                      <div
                        key={producto.id_producto}
                        className={`flex items-center gap-3 rounded-xl border p-3 ${
                          seleccionado
                            ? "border-pink-300 bg-pink-50"
                            : "border-gray-100 bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={seleccionado}
                          onChange={() =>
                            cambiarSeleccion(producto.id_producto)
                          }
                          disabled={guardando}
                          className="h-4 w-4 accent-pink-500"
                          aria-label={`Seleccionar ${producto.nombre}`}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {producto.nombre}
                          </p>

                          <p className="text-xs text-gray-500">
                            {producto.categoria} · Stock: {producto.stock}
                          </p>
                        </div>

                        {seleccionado && (
                          <div className="w-24">
                            <label
                              htmlFor={`cantidad-${producto.id_producto}`}
                              className="mb-1 block text-xs text-gray-500"
                            >
                              Agregar
                            </label>

                            <input
                              id={`cantidad-${producto.id_producto}`}
                              type="number"
                              min="1"
                              max={MAX_STOCK - producto.stock}
                              step="1"
                              value={cantidades[producto.id_producto] ?? "1"}
                              onChange={(evento) =>
                                setCantidades((actuales) => ({
                                  ...actuales,
                                  [producto.id_producto]: evento.target.value,
                                }))
                              }
                              disabled={guardando}
                              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-pink-400"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* MOTIVO */}

              <div>
                <label
                  htmlFor="motivo-reabastecimiento"
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Motivo del reabastecimiento
                </label>

                <textarea
                  id="motivo-reabastecimiento"
                  value={motivo}
                  onChange={(evento) => setMotivo(evento.target.value)}
                  maxLength={255}
                  rows={2}
                  disabled={guardando}
                  className="w-full resize-none rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-pink-400"
                  placeholder="Ejemplo: Llegada de mercancía"
                />
              </div>

              {/* ERROR */}

              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={18} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* PIE DEL MODAL */}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 p-5">
              <div>
                <p className="text-xs text-gray-500">Unidades por agregar</p>

                <p className="text-2xl font-bold text-pink-600">
                  +{unidadesTotales}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onCerrar}
                  disabled={guardando}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando || seleccionados.length === 0}
                  className="flex items-center gap-2 rounded-xl bg-pink-500 px-4 py-2.5 font-semibold text-white hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {guardando ? (
                    <LoaderCircle size={18} className="animate-spin" />
                  ) : (
                    <PackagePlus size={18} />
                  )}

                  {guardando ? "Guardando..." : "Reabastecer"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
