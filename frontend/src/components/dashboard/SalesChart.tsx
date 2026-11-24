
import { ChartColumnIncreasing } from "lucide-react";

// ==========================================
// TIPOS
// ==========================================

export interface VentaDiaria {
  dia: string;
  total: number;
}

interface SalesChartProps {
  ventas: VentaDiaria[];
  titulo?: string;
  descripcion?: string;
}

// ==========================================
// FORMATO DE MONEDA
// ==========================================

const formatoMoneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// ==========================================
// COMPONENTE SALES CHART
// ==========================================

export default function SalesChart({
  ventas,
  titulo = "Ventas semanales",
  descripcion = "Importe de ventas de los últimos 7 días, incluido hoy",
}: SalesChartProps) {
  // Valor máximo para calcular la altura de las barras.
  const maximo = Math.max(
    1,
    ...ventas.map((venta) => venta.total),
  );

  // Total de ventas del periodo.
  const totalPeriodo = ventas.reduce(
    (acumulado, venta) => acumulado + venta.total,
    0,
  );

  return (
    <section className="rounded-3xl border border-frizalia-soft-pink bg-white p-5 shadow-sm sm:p-6">

      {/* ======================================
          ENCABEZADO
      ====================================== */}

      <div className="flex flex-wrap items-start justify-between gap-4">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-frizalia-soft-pink">
            <ChartColumnIncreasing
              size={22}
              className="text-frizalia-text"
            />
          </div>

          <div>
            <h3 className="text-lg font-bold text-frizalia-text">
              {titulo}
            </h3>

            <p className="text-sm text-frizalia-muted">
              {descripcion}
            </p>
          </div>

        </div>

        {/* TOTAL DEL PERIODO */}
        <div className="text-right">
          <p className="text-xs text-frizalia-muted">
            Total del periodo
          </p>

          <p className="text-xl font-bold text-frizalia-text">
            {formatoMoneda.format(totalPeriodo)}
          </p>
        </div>

      </div>

      {/* ======================================
          GRÁFICO
      ====================================== */}

      {ventas.length > 0 ? (
        <div className="mt-8">

          {/* BARRAS */}
          <div className="flex h-56 items-end gap-3 border-b border-frizalia-soft-pink pb-2 sm:gap-5">

            {ventas.map((venta, indice) => {
              const altura =
                Math.max(0, venta.total) / maximo * 100;

              return (
                <div
                  key={`${venta.dia}-${indice}`}
                  className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end"
                >

                  {/* CANTIDAD AL PASAR EL MOUSE */}
                  <span className="mb-2 shrink-0 text-center text-[10px] font-semibold text-frizalia-text opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:text-xs">
                    {formatoMoneda.format(venta.total)}
                  </span>

                  {/* BARRA */}
                  <div
                    tabIndex={0}
                    role="img"
                    aria-label={`${venta.dia}: ${formatoMoneda.format(venta.total)}`}
                    title={`${venta.dia}: ${formatoMoneda.format(venta.total)}`}
                    style={{
                      height: `${Math.max(altura, venta.total > 0 ? 3 : 0)}%`,
                    }}
                    className="w-full min-h-0 max-w-16 rounded-t-xl bg-frizalia-pink transition-all duration-300 hover:brightness-95 focus:outline-2 focus:outline-offset-2 focus:outline-frizalia-text"
                  />

                </div>
              );
            })}

          </div>

          {/* DÍAS */}
          <div className="mt-3 flex gap-3 sm:gap-5">
            {ventas.map((venta, indice) => (
              <div
                key={`${venta.dia}-${indice}`}
                className="min-w-0 flex-1 text-center"
              >
                <span className="text-xs font-medium text-frizalia-muted">
                  {venta.dia}
                </span>
              </div>
            ))}
          </div>

        </div>
      ) : (
        <div className="mt-8 flex h-56 items-center justify-center rounded-2xl bg-frizalia-cream">
          <p className="text-sm text-frizalia-muted">
            No hay ventas para mostrar.
          </p>
        </div>
      )}

    </section>
  );
}
