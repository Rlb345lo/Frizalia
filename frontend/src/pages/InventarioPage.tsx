import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Package,
  PackageCheck,
  AlertTriangle,
  Search,
  RefreshCw,
  Boxes,
  Plus,
  Pencil,
  PackagePlus,
  History,
} from "lucide-react";

import { obtenerProductos, obtenerCategorias } from "../services/inventarioApi";

import NuevoProductoModal from "../components/inventario/NuevoProductoModal";
import EditarProductoModal from "../components/inventario/EditarProductoModal";
import MovimientoInventarioModal from "../components/inventario/MovimientoInventarioModal";
import HistorialInventarioModal from "../components/inventario/HistorialInventarioModal";
import ReabastecimientoMultipleModal from "../components/inventario/ReabastecimientoMultipleModal";

import { useAuth } from "../hooks/useAuth";

import type {
  ProductoInventario,
  CategoriaInventario,
} from "../types/inventario";

// ==========================================
// CONSTANTES
// ==========================================

type FiltroInventario = "todos" | "bajo" | "agotados";

const formatoMoneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});

// ==========================================
// COMPONENTE
// ==========================================

export default function InventarioPage() {
  // ========================================
  // AUTENTICACIÓN
  // ========================================

  const { token } = useAuth();

  // ========================================
  // ESTADOS
  // ========================================

  const [productos, setProductos] = useState<ProductoInventario[]>([]);
  const [categorias, setCategorias] = useState<CategoriaInventario[]>([]);

  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<FiltroInventario>("todos");

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<
    number | null
  >(null);

  // MODAL NUEVO PRODUCTO

  const [modalNuevoProductoAbierto, setModalNuevoProductoAbierto] =
    useState(false);

  // MODAL EDITAR PRODUCTO

  const [productoEnEdicion, setProductoEnEdicion] =
    useState<ProductoInventario | null>(null);

  // MODAL MOVIMIENTOS DE STOCK

  const [productoEnMovimiento, setProductoEnMovimiento] =
    useState<ProductoInventario | null>(null);

  // NUEVO: MODAL HISTORIAL DE MOVIMIENTOS

  const [productoEnHistorial, setProductoEnHistorial] =
    useState<ProductoInventario | null>(null);

  // MODAL REABASTECIMIENTO MÚLTIPLE

  const [modalReabastecimientoAbierto, setModalReabastecimientoAbierto] =
    useState(false);

  // ESTADOS DE CARGA

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========================================
  // ACTUALIZAR INVENTARIO
  // ========================================

  const cargarInventario = useCallback(async () => {
    try {
      setActualizando(true);
      setError(null);

      const [datosProductos, datosCategorias] = await Promise.all([
        obtenerProductos(),
        obtenerCategorias(),
      ]);

      setProductos(datosProductos);
      setCategorias(datosCategorias);
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo actualizar el inventario.",
      );

      throw errorDesconocido;
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  // ========================================
  // CARGA INICIAL
  // ========================================

  useEffect(() => {
    let activo = true;

    async function consultarInventario() {
      try {
        const [datosProductos, datosCategorias] = await Promise.all([
          obtenerProductos(),
          obtenerCategorias(),
        ]);

        if (!activo) return;

        setProductos(datosProductos);
        setCategorias(datosCategorias);
        setError(null);
      } catch (errorDesconocido) {
        if (!activo) return;

        setError(
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No se pudo cargar el inventario.",
        );
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    void consultarInventario();

    return () => {
      activo = false;
    };
  }, []);

  // ========================================
  // ACTUALIZAR DESPUÉS DE UNA OPERACIÓN
  // ========================================

  async function manejarInventarioActualizado() {
    await cargarInventario();
  }

  // ========================================
  // CATEGORÍAS ACTIVAS
  // ========================================

  const categoriasActivas = useMemo(() => {
    return categorias.filter((categoria) => categoria.activa === 1);
  }, [categorias]);

  // ========================================
  // ESTADÍSTICAS GENERALES
  // ========================================

  const estadisticas = useMemo(() => {
    const activos = productos.filter((producto) => producto.disponible === 1);

    const stockBajo = productos.filter(
      (producto) =>
        producto.stock > 0 && producto.stock <= producto.stock_minimo,
    );

    const unidades = productos.reduce(
      (total, producto) => total + producto.stock,
      0,
    );

    return {
      total: productos.length,
      activos: activos.length,
      stockBajo: stockBajo.length,
      unidades,
    };
  }, [productos]);

  // ========================================
  // FILTRAR PRODUCTOS
  // ========================================

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return productos.filter((producto) => {
      const coincideBusqueda =
        producto.nombre.toLowerCase().includes(texto) ||
        producto.categoria.toLowerCase().includes(texto) ||
        (producto.presentacion ?? "").toLowerCase().includes(texto);

      const coincideFiltro =
        filtro === "todos" ||
        (filtro === "bajo" &&
          producto.stock > 0 &&
          producto.stock <= producto.stock_minimo) ||
        (filtro === "agotados" && producto.stock === 0);

      const coincideCategoria =
        categoriaSeleccionada === null ||
        producto.id_categoria === categoriaSeleccionada;

      return coincideBusqueda && coincideFiltro && coincideCategoria;
    });
  }, [productos, busqueda, filtro, categoriaSeleccionada]);

  // ========================================
  // INTERFAZ
  // ========================================

  return (
    <div className="space-y-7">
      {/* ======================================
          ENCABEZADO
      ====================================== */}

      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-frizalia-soft-pink">
            <Package size={26} className="text-frizalia-text" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-frizalia-text">
              Inventario
            </h2>

            <p className="mt-1 text-sm text-frizalia-muted">
              Administra los productos y las existencias de Frizalia.
            </p>
          </div>
        </div>

        {/* BOTONES PRINCIPALES */}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              void cargarInventario().catch(() => {});
            }}
            disabled={cargando || actualizando}
            className="flex items-center gap-2 rounded-xl border border-frizalia-pink bg-white px-4 py-2.5 text-sm font-medium text-frizalia-text transition hover:bg-frizalia-soft-pink disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={actualizando ? "animate-spin" : ""}
            />

            {actualizando ? "Actualizando..." : "Actualizar"}
          </button>

          <button
            type="button"
            onClick={() => setModalReabastecimientoAbierto(true)}
            disabled={
              !token || cargando || actualizando || productos.length === 0
            }
            className="flex items-center gap-2 rounded-xl border border-frizalia-pink bg-white px-4 py-2.5 text-sm font-semibold text-frizalia-text transition hover:bg-frizalia-soft-pink disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Boxes size={18} />
            Reabastecer varios
          </button>

          <button
            type="button"
            onClick={() => setModalNuevoProductoAbierto(true)}
            disabled={!token || cargando || actualizando}
            className="flex items-center gap-2 rounded-xl bg-pink-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-pink-600 hover:shadow-md active:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            Nuevo producto
          </button>
        </div>
      </section>

      {/* ======================================
          TARJETAS DE ESTADÍSTICAS
      ====================================== */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            titulo: "Total de productos",
            valor: estadisticas.total,
            icono: Package,
          },
          {
            titulo: "Productos activos",
            valor: estadisticas.activos,
            icono: PackageCheck,
          },
          {
            titulo: "Stock bajo",
            valor: estadisticas.stockBajo,
            icono: AlertTriangle,
          },
          {
            titulo: "Unidades disponibles",
            valor: estadisticas.unidades,
            icono: Boxes,
          },
        ].map((tarjeta) => {
          const Icono = tarjeta.icono;

          return (
            <div
              key={tarjeta.titulo}
              className="rounded-2xl border border-frizalia-soft-pink bg-white p-5 shadow-sm"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-frizalia-cream">
                <Icono size={22} className="text-frizalia-text" />
              </div>

              <p className="text-sm text-frizalia-muted">{tarjeta.titulo}</p>

              <p className="mt-2 text-2xl font-bold text-frizalia-text">
                {cargando ? "..." : tarjeta.valor}
              </p>
            </div>
          );
        })}
      </section>

      {/* ======================================
          MENSAJE DE ERROR
      ====================================== */}

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-frizalia-danger/30 bg-frizalia-danger/5 p-4"
        >
          <p className="font-semibold text-frizalia-danger">
            No se pudo actualizar el inventario
          </p>

          <p className="mt-1 text-sm text-frizalia-muted">{error}</p>
        </div>
      )}

      {/* ======================================
          CATÁLOGO DE PRODUCTOS
      ====================================== */}

      <section className="overflow-hidden rounded-2xl border border-frizalia-soft-pink bg-white shadow-sm">
        {/* FILTROS POR CATEGORÍA */}

        <div className="flex flex-wrap gap-2 border-b border-frizalia-soft-pink p-5">
          <button
            type="button"
            onClick={() => setCategoriaSeleccionada(null)}
            aria-pressed={categoriaSeleccionada === null}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              categoriaSeleccionada === null
                ? "bg-frizalia-soft-pink text-frizalia-text"
                : "bg-frizalia-cream text-frizalia-muted hover:text-frizalia-text"
            }`}
          >
            Todos
          </button>

          {categoriasActivas.map((categoria) => (
            <button
              key={categoria.id_categoria}
              type="button"
              onClick={() => setCategoriaSeleccionada(categoria.id_categoria)}
              aria-pressed={categoriaSeleccionada === categoria.id_categoria}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                categoriaSeleccionada === categoria.id_categoria
                  ? "bg-frizalia-soft-pink text-frizalia-text"
                  : "bg-frizalia-cream text-frizalia-muted hover:text-frizalia-text"
              }`}
            >
              {categoria.nombre}
            </button>
          ))}
        </div>

        {/* ENCABEZADO DE TABLA */}

        <div className="space-y-4 border-b border-frizalia-soft-pink p-5">
          <div>
            <h3 className="text-lg font-bold text-frizalia-text">
              Lista de productos
            </h3>

            <p className="text-sm text-frizalia-muted">
              {productosFiltrados.length} productos encontrados
            </p>
          </div>

          {/* BÚSQUEDA Y FILTROS */}

          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-56 flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-frizalia-muted"
              />

              <input
                type="search"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Buscar producto, categoría o presentación..."
                aria-label="Buscar productos"
                className="w-full rounded-xl border border-frizalia-soft-pink bg-frizalia-cream py-3 pl-10 pr-4 text-sm text-frizalia-text outline-none focus:border-frizalia-pink"
              />
            </div>

            <select
              value={filtro}
              onChange={(evento) =>
                setFiltro(evento.target.value as FiltroInventario)
              }
              aria-label="Filtrar inventario"
              className="rounded-xl border border-frizalia-soft-pink bg-white px-4 py-3 text-sm text-frizalia-text outline-none focus:border-frizalia-pink"
            >
              <option value="todos">Todos</option>
              <option value="bajo">Stock bajo</option>
              <option value="agotados">Agotados</option>
            </select>
          </div>
        </div>

        {/* ======================================
            TABLA DE PRODUCTOS
        ====================================== */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead className="bg-frizalia-cream text-frizalia-muted">
              <tr>
                <th className="px-5 py-4 font-semibold">Producto</th>

                <th className="px-5 py-4 font-semibold">Categoría</th>

                <th className="px-5 py-4 font-semibold">Precio</th>

                <th className="px-5 py-4 font-semibold">Stock</th>

                <th className="px-5 py-4 font-semibold">Estado</th>

                <th className="px-5 py-4 font-semibold">Acciones</th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-frizalia-muted"
                  >
                    Cargando productos...
                  </td>
                </tr>
              ) : productosFiltrados.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-frizalia-muted"
                  >
                    No se encontraron productos.
                  </td>
                </tr>
              ) : (
                productosFiltrados.map((producto) => {
                  const agotado = producto.stock === 0;

                  const stockBajo =
                    producto.stock > 0 &&
                    producto.stock <= producto.stock_minimo;

                  const estado =
                    producto.disponible !== 1
                      ? "Inactivo"
                      : agotado
                        ? "Agotado"
                        : stockBajo
                          ? "Stock bajo"
                          : "Disponible";

                  return (
                    <tr
                      key={producto.id_producto}
                      className="border-t border-frizalia-soft-pink/60 hover:bg-frizalia-cream/50"
                    >
                      {/* PRODUCTO */}

                      <td className="px-5 py-4">
                        <p className="font-semibold text-frizalia-text">
                          {producto.nombre}
                        </p>

                        <p className="mt-1 text-xs text-frizalia-muted">
                          {producto.presentacion ?? "Sin presentación"}
                        </p>
                      </td>

                      {/* CATEGORÍA */}

                      <td className="px-5 py-4 text-frizalia-text">
                        {producto.categoria}
                      </td>

                      {/* PRECIO */}

                      <td className="px-5 py-4 text-frizalia-text">
                        {formatoMoneda.format(Number(producto.precio))}
                      </td>

                      {/* STOCK */}

                      <td className="px-5 py-4 text-frizalia-text">
                        <span className="font-semibold">{producto.stock}</span>

                        <span className="ml-1 text-xs text-frizalia-muted">
                          / mín. {producto.stock_minimo}
                        </span>
                      </td>

                      {/* ESTADO */}

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            estado === "Disponible"
                              ? "bg-green-100 text-green-700"
                              : estado === "Inactivo"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {estado}
                        </span>
                      </td>

                      {/* ==================================
                          ACCIONES DEL PRODUCTO
                      ================================== */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {/* EDITAR */}

                          <button
                            type="button"
                            onClick={() => setProductoEnEdicion(producto)}
                            disabled={!token || actualizando}
                            className="inline-flex items-center gap-2 rounded-lg border border-frizalia-soft-pink bg-white px-3 py-2 text-xs font-semibold text-frizalia-text transition hover:border-pink-400 hover:bg-frizalia-soft-pink disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Pencil size={15} />
                            Editar
                          </button>

                          {/* STOCK */}

                          <button
                            type="button"
                            onClick={() => setProductoEnMovimiento(producto)}
                            disabled={!token || actualizando}
                            className="inline-flex items-center gap-2 rounded-lg border border-frizalia-soft-pink bg-white px-3 py-2 text-xs font-semibold text-frizalia-text transition hover:border-pink-400 hover:bg-frizalia-soft-pink disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <PackagePlus size={15} />
                            Stock
                          </button>

                          {/* NUEVO: HISTORIAL */}

                          <button
                            type="button"
                            onClick={() => setProductoEnHistorial(producto)}
                            disabled={!token || actualizando}
                            className="inline-flex items-center gap-2 rounded-lg border border-frizalia-soft-pink bg-white px-3 py-2 text-xs font-semibold text-frizalia-text transition hover:border-pink-400 hover:bg-frizalia-soft-pink disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <History size={15} />
                            Historial
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* ======================================
          MODAL NUEVO PRODUCTO
      ====================================== */}

      {token && (
        <NuevoProductoModal
          abierto={modalNuevoProductoAbierto}
          categorias={categoriasActivas}
          token={token}
          onCerrar={() => setModalNuevoProductoAbierto(false)}
          onProductoCreado={manejarInventarioActualizado}
        />
      )}

      {/* ======================================
          MODAL EDITAR PRODUCTO
      ====================================== */}

      {token && productoEnEdicion && (
        <EditarProductoModal
          key={productoEnEdicion.id_producto}
          producto={productoEnEdicion}
          categorias={categorias}
          token={token}
          onCerrar={() => setProductoEnEdicion(null)}
          onProductoActualizado={manejarInventarioActualizado}
        />
      )}

      {/* ======================================
          MODAL MOVIMIENTO DE STOCK
      ====================================== */}

      {token && productoEnMovimiento && (
        <MovimientoInventarioModal
          key={productoEnMovimiento.id_producto}
          producto={productoEnMovimiento}
          token={token}
          onCerrar={() => setProductoEnMovimiento(null)}
          onMovimientoRegistrado={manejarInventarioActualizado}
        />
      )}

      {/* ======================================
          NUEVO: MODAL HISTORIAL
      ====================================== */}

      {token && productoEnHistorial && (
        <HistorialInventarioModal
          key={productoEnHistorial.id_producto}
          producto={productoEnHistorial}
          token={token}
          onCerrar={() => setProductoEnHistorial(null)}
        />
      )}

      {/* ======================================
          MODAL REABASTECIMIENTO MÚLTIPLE
      ====================================== */}

      {token && modalReabastecimientoAbierto && (
        <ReabastecimientoMultipleModal
          productos={productos}
          token={token}
          onCerrar={() => setModalReabastecimientoAbierto(false)}
          onReabastecimientoRegistrado={manejarInventarioActualizado}
        />
      )}
    </div>
  );
}
