import { useState, type FormEvent } from "react";

import { Pencil, Save, X, LoaderCircle, Package } from "lucide-react";

import { editarProducto } from "../../services/inventarioApi";

import type {
  ActualizarProducto,
  CategoriaInventario,
  ProductoInventario,
} from "../../types/inventario";

// ==========================================
// PROPIEDADES
// ==========================================

interface EditarProductoModalProps {
  producto: ProductoInventario;
  categorias: CategoriaInventario[];
  token: string;
  onCerrar: () => void;
  onProductoActualizado: () => void | Promise<void>;
}

// ==========================================
// FORMULARIO
// ==========================================

interface FormularioEditarProducto {
  nombre: string;
  id_categoria: string;
  presentacion: string;
  descripcion: string;
  precio: string;
  stock_minimo: string;
  disponible: boolean;
}

function obtenerFormularioInicial(
  producto: ProductoInventario,
): FormularioEditarProducto {
  return {
    nombre: producto.nombre,
    id_categoria: String(producto.id_categoria),
    presentacion: producto.presentacion ?? "",
    descripcion: producto.descripcion ?? "",
    precio: String(producto.precio),
    stock_minimo: String(producto.stock_minimo),
    disponible: producto.disponible === 1,
  };
}

// ==========================================
// COMPONENTE
// ==========================================

export default function EditarProductoModal({
  producto,
  categorias,
  token,
  onCerrar,
  onProductoActualizado,
}: EditarProductoModalProps) {
  // ========================================
  // ESTADOS
  // ========================================

  const [formulario, setFormulario] = useState<FormularioEditarProducto>(() =>
    obtenerFormularioInicial(producto),
  );

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardadoConfirmado, setGuardadoConfirmado] = useState(false);

  // ========================================
  // VALIDACIONES
  // ========================================

  const nombre = formulario.nombre.trim();
  const idCategoria = Number(formulario.id_categoria);
  const precio = Number(formulario.precio);
  const stockMinimo = Number(formulario.stock_minimo);

  const categoriaValida = categorias.some(
    (categoria) =>
      categoria.id_categoria === idCategoria &&
      (categoria.activa === 1 ||
        categoria.id_categoria === producto.id_categoria),
  );

  const formularioValido =
    nombre.length > 0 &&
    formulario.id_categoria !== "" &&
    categoriaValida &&
    formulario.precio.trim() !== "" &&
    Number.isFinite(precio) &&
    precio > 0 &&
    formulario.stock_minimo.trim() !== "" &&
    Number.isInteger(stockMinimo) &&
    stockMinimo >= 0;

  // ========================================
  // DETECTAR CAMBIOS
  // ========================================

  const hayCambios =
    nombre !== producto.nombre ||
    idCategoria !== producto.id_categoria ||
    formulario.presentacion.trim() !== (producto.presentacion ?? "") ||
    formulario.descripcion.trim() !== (producto.descripcion ?? "") ||
    (formulario.precio.trim() !== "" && precio !== Number(producto.precio)) ||
    (formulario.stock_minimo.trim() !== "" &&
      stockMinimo !== producto.stock_minimo) ||
    formulario.disponible !== (producto.disponible === 1);

  const puedeGuardar =
    formularioValido && hayCambios && !guardando && !guardadoConfirmado;

  // ========================================
  // ACTUALIZAR CAMPOS
  // ========================================

  function actualizarCampo(
    campo: keyof FormularioEditarProducto,
    valor: string | boolean,
  ) {
    if (guardando || guardadoConfirmado) return;

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
  // GUARDAR CAMBIOS
  // ========================================

  async function guardarCambios(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();

    if (!puedeGuardar) return;

    const datos: ActualizarProducto = {
      nombre,
      id_categoria: idCategoria,
      presentacion: formulario.presentacion.trim() || null,
      descripcion: formulario.descripcion.trim() || null,
      precio,
      stock_minimo: stockMinimo,
      disponible: formulario.disponible,
    };

    try {
      setGuardando(true);
      setError(null);

      // Primero actualizamos en MySQL.
      await editarProducto(producto.id_producto, datos, token);

      // Evita volver a enviar la misma actualización
      // si falla el refresco de la tabla.
      setGuardadoConfirmado(true);

      // Después solicitamos actualizar el inventario.
      await onProductoActualizado();

      onCerrar();
    } catch (errorDesconocido) {
      setError(
        guardadoConfirmado
          ? "Los cambios se guardaron, pero no se pudo actualizar la lista. Cierra el formulario y pulsa Actualizar."
          : errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "No se pudieron guardar los cambios.",
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
        aria-labelledby="editar-producto-titulo"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-frizalia-soft-pink bg-white shadow-xl"
      >
        {/* ENCABEZADO */}

        <div className="flex items-start justify-between gap-4 border-b border-frizalia-soft-pink p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-frizalia-soft-pink">
              <Pencil size={23} className="text-frizalia-text" />
            </div>

            <div>
              <h2
                id="editar-producto-titulo"
                className="text-xl font-bold text-frizalia-text"
              >
                Editar producto
              </h2>

              <p className="mt-1 text-sm text-frizalia-muted">
                Modifica la información de {producto.nombre}.
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
          onSubmit={(evento) => void guardarCambios(evento)}
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
                htmlFor="editar-producto-nombre"
                className="mb-2 block text-sm font-semibold text-frizalia-text"
              >
                Nombre del producto *
              </label>

              <input
                id="editar-producto-nombre"
                type="text"
                required
                maxLength={150}
                value={formulario.nombre}
                onChange={(evento) =>
                  actualizarCampo("nombre", evento.target.value)
                }
                className="w-full rounded-xl border border-frizalia-soft-pink bg-frizalia-cream px-4 py-3 text-sm text-frizalia-text outline-none focus:border-frizalia-pink"
              />
            </div>

            {/* CATEGORÍA Y PRESENTACIÓN */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="editar-producto-categoria"
                  className="mb-2 block text-sm font-semibold text-frizalia-text"
                >
                  Categoría *
                </label>

                <select
                  id="editar-producto-categoria"
                  required
                  value={formulario.id_categoria}
                  onChange={(evento) =>
                    actualizarCampo("id_categoria", evento.target.value)
                  }
                  className="w-full rounded-xl border border-frizalia-soft-pink bg-white px-4 py-3 text-sm text-frizalia-text outline-none focus:border-frizalia-pink"
                >
                  {categorias.map((categoria) => (
                    <option
                      key={categoria.id_categoria}
                      value={categoria.id_categoria}
                      disabled={
                        categoria.activa !== 1 &&
                        categoria.id_categoria !== producto.id_categoria
                      }
                    >
                      {categoria.nombre}
                      {categoria.activa !== 1 ? " (inactiva)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="editar-producto-presentacion"
                  className="mb-2 block text-sm font-semibold text-frizalia-text"
                >
                  Presentación
                </label>

                <input
                  id="editar-producto-presentacion"
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
                htmlFor="editar-producto-descripcion"
                className="mb-2 block text-sm font-semibold text-frizalia-text"
              >
                Descripción
              </label>

              <textarea
                id="editar-producto-descripcion"
                rows={3}
                value={formulario.descripcion}
                onChange={(evento) =>
                  actualizarCampo("descripcion", evento.target.value)
                }
                placeholder="Descripción del producto..."
                className="w-full resize-none rounded-xl border border-frizalia-soft-pink bg-frizalia-cream px-4 py-3 text-sm text-frizalia-text outline-none focus:border-frizalia-pink"
              />
            </div>

            {/* PRECIO Y STOCK MÍNIMO */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="editar-producto-precio"
                  className="mb-2 block text-sm font-semibold text-frizalia-text"
                >
                  Precio de venta (MXN) *
                </label>

                <input
                  id="editar-producto-precio"
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={formulario.precio}
                  onChange={(evento) =>
                    actualizarCampo("precio", evento.target.value)
                  }
                  className="w-full rounded-xl border border-frizalia-soft-pink bg-frizalia-cream px-4 py-3 text-sm text-frizalia-text outline-none focus:border-frizalia-pink"
                />
              </div>

              <div>
                <label
                  htmlFor="editar-producto-stock-minimo"
                  className="mb-2 block text-sm font-semibold text-frizalia-text"
                >
                  Stock mínimo *
                </label>

                <input
                  id="editar-producto-stock-minimo"
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

            {/* STOCK ACTUAL */}

            <div className="flex items-center gap-3 rounded-xl border border-frizalia-soft-pink bg-frizalia-cream p-4">
              <Package size={22} className="text-frizalia-text" />

              <div>
                <p className="text-sm font-semibold text-frizalia-text">
                  Stock actual: {producto.stock} unidades
                </p>

                <p className="mt-1 text-xs text-frizalia-muted">
                  Para modificar existencias, utiliza los movimientos de
                  inventario.
                </p>
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
                  Desmarca esta opción para desactivar el producto sin
                  eliminarlo del inventario.
                </span>
              </span>
            </label>

            {/* NOTA */}

            <p className="text-xs text-frizalia-muted">
              * Campos obligatorios. Los cambios en el stock se registran por
              separado para conservar el historial.
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
              disabled={!puedeGuardar}
              className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 ${
                guardando
                  ? "cursor-wait bg-pink-800"
                  : puedeGuardar
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
                  <Save size={18} />
                  Guardar cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
