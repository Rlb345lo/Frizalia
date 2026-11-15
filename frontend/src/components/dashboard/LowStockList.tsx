
import { AlertTriangle, PackageCheck } from "lucide-react";

// ==========================================
// TIPOS
// ==========================================

export interface ProductoStockBajo {
  id: number;
  nombre: string;
  presentacion: string;
  stockActual: number;
  stockMinimo: number;
}

interface LowStockListProps {
  productos: ProductoStockBajo[];
}

// ==========================================
// COMPONENTE LOW STOCK LIST
// ==========================================

export default function LowStockList({
  productos,
}: LowStockListProps) {
  return (
    <section className="rounded-3xl border border-frizalia-soft-pink bg-white p-5 shadow-sm sm:p-6">

      {/* ======================================
          ENCABEZADO
      ====================================== */}

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-frizalia-soft-pink">
          <AlertTriangle
            size={22}
            className="text-frizalia-text"
          />
        </div>

        <div>
          <h3 className="text-lg font-bold text-frizalia-text">
            Productos con stock bajo
          </h3>

          <p className="text-sm text-frizalia-muted">
            Productos que necesitan reabastecimiento
          </p>
        </div>
      </div>

      {/* ======================================
          LISTA DE PRODUCTOS
      ====================================== */}

      {productos.length > 0 ? (
        <div className="mt-6 space-y-5">
          {productos.map((producto) => {
            // Calcular porcentaje de existencias
            const porcentaje =
              producto.stockMinimo > 0
                ? Math.min(
                    100,
                    Math.max(
                      0,
                      (producto.stockActual /
                        producto.stockMinimo) *
                        100,
                    ),
                  )
                : 100;

            // Identificar estado del producto
            const agotado = producto.stockActual <= 0;

            const critico =
              agotado || porcentaje <= 35;

            return (
              <div
                key={producto.id}
                className="space-y-2"
              >

                {/* INFORMACIÓN DEL PRODUCTO */}
                <div className="flex items-center justify-between gap-3">

                  {/* NOMBRE Y PRESENTACIÓN */}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-frizalia-text">
                      {producto.nombre}
                    </p>

                    <p className="text-xs text-frizalia-muted">
                      {producto.presentacion}
                    </p>
                  </div>

                  {/* EXISTENCIAS */}
                  <div className="shrink-0 text-right">
                    <p
                      className={`text-sm font-semibold ${
                        critico
                          ? "text-frizalia-danger"
                          : "text-frizalia-text"
                      }`}
                    >
                      {producto.stockActual} /{" "}
                      {producto.stockMinimo}
                    </p>

                    <p className="text-xs text-frizalia-muted">
                      unidades
                    </p>
                  </div>

                </div>

                {/* ======================================
                    BARRA DE EXISTENCIAS
                ====================================== */}

                <div
                  role="progressbar"
                  aria-label={`Existencias de ${producto.nombre}`}
                  aria-valuenow={Math.max(
                    0,
                    producto.stockActual,
                  )}
                  aria-valuemin={0}
                  aria-valuemax={Math.max(
                    producto.stockMinimo,
                    producto.stockActual,
                    1,
                  )}
                  className="h-2 overflow-hidden rounded-full bg-frizalia-cream"
                >
                  <div
                    style={{
                      width: `${porcentaje}%`,
                    }}
                    className={`h-full rounded-full transition-all ${
                      critico
                        ? "bg-red-400"
                        : "bg-yellow-400"
                    }`}
                  />
                </div>

                {/* AVISO DE PRODUCTO AGOTADO */}
                {agotado && (
                  <p className="text-xs font-medium text-frizalia-danger">
                    Producto agotado
                  </p>
                )}

              </div>
            );
          })}
        </div>
      ) : (

        /* ======================================
            ESTADO VACÍO
        ====================================== */

        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-frizalia-cream px-4 py-8 text-center">

          <PackageCheck
            size={30}
            className="text-frizalia-success"
          />

          <p className="mt-3 text-sm font-semibold text-frizalia-text">
            Inventario en buen estado
          </p>

          <p className="mt-1 text-xs text-frizalia-muted">
            No hay productos con existencias bajas.
          </p>

        </div>
      )}

    </section>
  );
}
