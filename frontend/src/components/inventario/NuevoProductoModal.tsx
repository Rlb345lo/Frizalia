import { useState, type FormEvent } from "react";
import { LoaderCircle, PackagePlus, X } from "lucide-react";

import { crearProducto } from "../../services/inventarioApi";

import type {
  CategoriaInventario,
  NuevoProducto,
} from "../../types/inventario";

// ==========================================
// PROPIEDADES DEL MODAL
// ==========================================

interface NuevoProductoModalProps {
  abierto: boolean;
  categorias: CategoriaInventario[];
  token: string;
  onCerrar: () => void;
  onProductoCreado: () => void | Promise<void>;
}

// ==========================================
// FORMULARIO
// ==========================================

interface FormularioProducto {
  nombre: string;
  id_categoria: string;
  presentacion: string;
  descripcion: string;
  precio: string;
  stock: string;
  stock_minimo: string;
  disponible: boolean;
}

function crearFormularioInicial(): FormularioProducto {
  return {
    nombre: "",
    id_categoria: "",
    presentacion: "",
    descripcion: "",
    precio: "",
    stock: "0",
    stock_minimo: "10",
    disponible: true,
  };
}

// ==========================================
// COMPONENTE
// ==========================================

export default function NuevoProductoModal({
  abierto,
  categorias,
  token,
  onCerrar,
  onProductoCreado,
}: NuevoProductoModalProps) {
  // ========================================
  // ESTADOS
  // ========================================

  const [formulario, setFormulario] = useState<FormularioProducto>(
    crearFormularioInicial,
  );

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========================================
  // VALIDACIÓN EN TIEMPO REAL
  // ========================================

  const precio = Number(formulario.precio);
  const stock = Number(formulario.stock);
  const stockMinimo = Number(formulario.stock_minimo);

  const formularioValido =
    formulario.nombre.trim().length > 0 &&
    formulario.id_categoria !== "" &&
    categorias.some(
      (categoria) =>
        categoria.id_categoria === Number(formulario.id_categoria) &&
        categoria.activa === 1,
    ) &&
    formulario.precio.trim() !== "" &&
    Number.isFinite(precio) &&
    precio > 0 &&
    formulario.stock.trim() !== "" &&
    Number.isInteger(stock) &&
    stock >= 0 &&
    formulario.stock_minimo.trim() !== "" &&
    Number.isInteger(stockMinimo) &&
    stockMinimo >= 0;

  // ========================================
  // ACTUALIZAR CAMPOS
  // ========================================

  function actualizarCampo(
    campo: keyof FormularioProducto,
    valor: string | boolean,
  ) {
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

    setFormulario(crearFormularioInicial());
    setError(null);
    onCerrar();
  }

  // ========================================
  // GUARDAR PRODUCTO
  // ========================================

  async function guardarProducto(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (guardando || !formularioValido) return;

    const nombre = formulario.nombre.trim();
    const categoria = Number(formulario.id_categoria);
    const precioProducto = Number(formulario.precio);
    const stockProducto = Number(formulario.stock);
    const stockMinimoProducto = Number(formulario.stock_minimo);

    const datos: NuevoProducto = {
      nombre,
      id_categoria: categoria,
      presentacion: formulario.presentacion.trim() || null,
      descripcion: formulario.descripcion.trim() || null,
      precio: precioProducto,
      stock: stockProducto,
      stock_minimo: stockMinimoProducto,
      disponible: formulario.disponible,
      imagen_url: null,
    };

    try {
      setGuardando(true);
      setError(null);

      await crearProducto(datos, token);

      setFormulario(crearFormularioInicial());

      await onProductoCreado();

      onCerrar();
    } catch (errorDesconocido) {
      setError(
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "No se pudo registrar el producto.",
      );
    } finally {
      setGuardando(false);
    }
  }

  // ========================================
  // NO MOSTRAR SI ESTÁ CERRADO
  // ========================================

  if (!abierto) return null;

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
        aria-labelledby="nuevo-producto-titulo"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-frizalia-soft-pink bg-white shadow-xl"
      >
        {/* ======================================
            ENCABEZADO
        ====================================== */}

        <div className="flex items-start justify-between gap-4 border-b border-frizalia-soft-pink p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-frizalia-soft-pink">
              <PackagePlus size={24} className="text-frizalia-text" />
            </div>

            <div>
              <h2
                id="nuevo-producto-titulo"
                className="text-xl font-bold text-frizalia-text"
              >
                Nuevo producto
              </h2>

              <p className="mt-1 text-sm text-frizalia-muted">
                Registra un nuevo producto en el inventario.
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

        {/* ======================================
            FORMULARIO
        ====================================== */}

        <form
          onSubmit={(evento) => void guardarProducto(evento)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="space-y-5 overflow-y-auto p-6">
            {/* ERROR */}

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-frizalia-danger/30 bg-frizalia-danger/5 p-3 text-sm text-frizalia-danger"
              >
                {error}
              </div>
            )}

            {/* NOMBRE */}

            <div>
              <label
                htmlFor="nuevo-producto-nombre"
                className="mb-2 block text-sm font-semibold text-frizalia-text"
              >
                Nombre del producto *
              </label>

              <input
                id="nuevo-producto-nombre"
                type="text"
                required
                maxLength={150}
                value={formulario.nombre}
                onChange={(evento) =>
                  actualizarCampo("nombre", evento.target.value)
                }
                placeholder="Ej. Paleta de coco"
                className="w-full rounded-xl border border-frizalia-soft-pink bg-frizalia-cream px-4 py-3 text-sm text-frizalia-text outline-none focus:border-frizalia-pink"
              />
            </div>

            {/* CATEGORÍA Y PRESENTACIÓN */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="nuevo-producto-categoria"
                  className="mb-2 block text-sm font-semibold text-frizalia-text"
                >
                  Categoría *
                </label>

                <select
                  id="nuevo-producto-categoria"
                  required
                  value={formulario.id_categoria}
                  onChange={(evento) =>
                    actualizarCampo("id_categoria", evento.target.value)
                  }
                  className="w-full rounded-xl border border-frizalia-soft-pink bg-white px-4 py-3 text-sm text-frizalia-text outline-none focus:border-frizalia-pink"
                >
                  <option value="">Selecciona una categoría</option>

                  {categorias
                    .filter((categoria) => categoria.activa === 1)
                    .map((categoria) => (
                      <option
                        key={categoria.id_categoria}
                        value={categoria.id_categoria}
                      >
                        {categoria.nombre}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="nuevo-producto-presentacion"
                  className="mb-2 block text-sm font-semibold text-frizalia-text"
                >
                  Presentación
                </label>

                <input
                  id="nuevo-producto-presentacion"
                  type="text"
                  maxLength={100}
                  value={formulario.presentacion}
                  onChange={(evento) =>
                    actualizarCampo("presentacion", evento.target.value)
                  }
                  placeholder="Ej. Individual, 1 litro..."
                  className="w-full rounded-xl border border-frizalia-soft-pink bg-frizalia-cream px-4 py-3 text-sm text-frizalia-text outline-none focus:border-frizalia-pink"
                />
              </div>
            </div>

            {/* DESCRIPCIÓN */}

            <div>
              <label
                htmlFor="nuevo-producto-descripcion"
                className="mb-2 block text-sm font-semibold text-frizalia-text"
              >
                Descripción
              </label>

              <textarea
                id="nuevo-producto-descripcion"
                rows={3}
                value={formulario.descripcion}
                onChange={(evento) =>
                  actualizarCampo("descripcion", evento.target.value)
                }
                placeholder="Describe brevemente el producto..."
                className="w-full resize-none rounded-xl border border-frizalia-soft-pink bg-frizalia-cream px-4 py-3 text-sm text-frizalia-text outline-none focus:border-frizalia-pink"
              />
            </div>

            {/* PRECIO */}

            <div>
              <label
                htmlFor="nuevo-producto-precio"
                className="mb-2 block text-sm font-semibold text-frizalia-text"
              >
                Precio de venta (MXN) *
              </label>

              <input
                id="nuevo-producto-precio"
                type="number"
                required
                min="0.01"
                step="0.01"
                value={formulario.precio}
                onChange={(evento) =>
                  actualizarCampo("precio", evento.target.value)
                }
                placeholder="Ej. 25.00"
                className="w-full rounded-xl border border-frizalia-soft-pink bg-frizalia-cream px-4 py-3 text-sm text-frizalia-text outline-none focus:border-frizalia-pink"
              />
            </div>

            {/* STOCK INICIAL Y MÍNIMO */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="nuevo-producto-stock"
                  className="mb-2 block text-sm font-semibold text-frizalia-text"
                >
                  Stock inicial *
                </label>

                <input
                  id="nuevo-producto-stock"
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={formulario.stock}
                  onChange={(evento) =>
                    actualizarCampo("stock", evento.target.value)
                  }
                  className="w-full rounded-xl border border-frizalia-soft-pink bg-frizalia-cream px-4 py-3 text-sm text-frizalia-text outline-none focus:border-frizalia-pink"
                />
              </div>

              <div>
                <label
                  htmlFor="nuevo-producto-stock-minimo"
                  className="mb-2 block text-sm font-semibold text-frizalia-text"
                >
                  Stock mínimo *
                </label>

                <input
                  id="nuevo-producto-stock-minimo"
                  type="number"
                  required
                  min="0"
                  step="1"
                  value={formulario.stock_minimo}
                  onChange={(evento) =>
                    actualizarCampo("stock_minimo", evento.target.value)
                  }
                  className="w-full rounded-xl border border-frizalia-soft-pink bg-frizalia-cream px-4 py-3 text-sm text-frizalia-text outline-none focus:border-frizalia-pink"
                />
              </div>
            </div>

            {/* DISPONIBILIDAD */}

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-frizalia-soft-pink bg-frizalia-cream p-4">
              <input
                type="checkbox"
                checked={formulario.disponible}
                onChange={(evento) =>
                  actualizarCampo("disponible", evento.target.checked)
                }
                className="mt-1 h-4 w-4 accent-pink-500"
              />

              <span>
                <span className="block text-sm font-semibold text-frizalia-text">
                  Producto disponible
                </span>

                <span className="mt-1 block text-xs text-frizalia-muted">
                  Permite que el producto esté habilitado en el catálogo.
                </span>
              </span>
            </label>

            {/* NOTA */}

            <p className="text-xs text-frizalia-muted">
              * Campos obligatorios. Si registras existencias iniciales, el
              sistema generará automáticamente un movimiento de entrada.
            </p>
          </div>

          {/* ======================================
              BOTONES
          ====================================== */}

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
              disabled={guardando || !formularioValido}
              className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 ${
                guardando
                  ? "cursor-wait bg-pink-800"
                  : formularioValido
                    ? "bg-pink-600 shadow-md hover:bg-pink-700 hover:shadow-lg"
                    : "cursor-not-allowed bg-pink-300"
              }`}
            >
              {guardando ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <PackagePlus size={18} />
                  Guardar producto
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
