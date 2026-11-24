import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { obtenerReporte } from "../services/reportesApi";
import type {
  TipoReporte,
  PeriodoReporte,
  ReporteVentas,
  ReporteInventario,
  ReporteCaja,
  ReporteSolicitudes,
} from "../types/reportes";

const pestañas: { tipo: TipoReporte; nombre: string }[] = [
  { tipo: "ventas", nombre: "Ventas" },
  { tipo: "inventario", nombre: "Inventario" },
  { tipo: "caja", nombre: "Caja" },
  { tipo: "solicitudes", nombre: "Solicitudes" },
];
const formatoMoneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
});
function moneda(valor: string | null) {
  return valor === null ? "—" : formatoMoneda.format(Number(valor));
}
function fechaLocal(fecha: Date) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}
function periodoInicial(): PeriodoReporte {
  const hoy = new Date();
  return {
    fecha_inicio: fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
    fecha_fin: fechaLocal(hoy),
  };
}
function estado(valor: string) {
  return valor.replaceAll("_", " ");
}

function Indicadores({ datos }: { datos: [string, ReactNode][] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {datos.map(([nombre, valor]) => (
        <div
          key={nombre}
          className="rounded-2xl border border-pink-100 bg-white p-5 shadow-sm"
        >
          <p className="text-sm text-frizalia-muted">{nombre}</p>
          <p className="mt-2 text-2xl font-bold text-frizalia-text">{valor}</p>
        </div>
      ))}
    </div>
  );
}

type Fila = { id: string | number; celdas: ReactNode[] };
function Tabla({
  titulo,
  columnas,
  filas,
}: {
  titulo: string;
  columnas: string[];
  filas: Fila[];
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-pink-100 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-frizalia-text">
        {titulo}
      </h2>
      {filas.length === 0 ? (
        <p className="py-6 text-center text-sm text-frizalia-muted">
          No hay registros para mostrar.
        </p>
      ) : (
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-pink-50 text-frizalia-text">
              <tr>
                {columnas.map((c) => (
                  <th
                    key={c}
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 font-semibold"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-frizalia-text">
              {filas.map((f) => (
                <tr key={f.id} className="hover:bg-pink-50/50">
                  {f.celdas.map((c, i) => (
                    <td key={i} className="px-4 py-3">
                      {c ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function Ventas({ datos }: { datos: ReporteVentas }) {
  const r = datos.resumen;
  return (
    <>
      <Indicadores
        datos={[
          ["Ingresos totales", moneda(r.ingresos_totales)],
          ["Ventas", r.total_ventas],
          ["Ticket promedio", moneda(r.ticket_promedio)],
          ["Unidades vendidas", r.unidades_vendidas],
          ["Ventas presenciales", r.ventas_presenciales],
          ["Ventas por solicitudes", r.ventas_solicitudes],
        ]}
      />
      <Tabla
        titulo="Ventas por día"
        columnas={["Fecha", "Ventas", "Total"]}
        filas={datos.ventas_diarias.map((v) => ({
          id: v.fecha,
          celdas: [v.fecha, v.cantidad_ventas, moneda(v.total)],
        }))}
      />
      <Tabla
        titulo="Productos más vendidos"
        columnas={[
          "Producto",
          "Presentación",
          "Categoría",
          "Unidades",
          "Ingresos",
        ]}
        filas={datos.productos_mas_vendidos.map((p) => ({
          id: p.id_producto,
          celdas: [
            p.nombre,
            p.presentacion,
            p.categoria,
            p.unidades_vendidas,
            moneda(p.ingresos),
          ],
        }))}
      />
      <Tabla
        titulo="Ventas por categoría"
        columnas={["Categoría", "Unidades", "Ingresos"]}
        filas={datos.ventas_por_categoria.map((c) => ({
          id: c.id_categoria,
          celdas: [c.categoria, c.unidades_vendidas, moneda(c.ingresos)],
        }))}
      />
      <Tabla
        titulo="Historial de ventas"
        columnas={["Folio", "Fecha", "Vendedor", "Origen", "Pago", "Total"]}
        filas={datos.ventas.map((v) => ({
          id: v.id_venta,
          celdas: [
            v.folio,
            v.fecha_venta,
            v.vendedor,
            estado(v.origen),
            estado(v.metodo_pago),
            moneda(v.total),
          ],
        }))}
      />
    </>
  );
}
function Inventario({ datos }: { datos: ReporteInventario }) {
  const r = datos.resumen;
  return (
    <>
      <p className="text-sm text-frizalia-muted">
        Existencias actuales al {datos.fecha_consulta}. Las fechas filtran
        únicamente los movimientos.
      </p>
      <Indicadores
        datos={[
          ["Productos", r.total_productos],
          ["Activos", r.productos_activos],
          ["Inactivos", r.productos_inactivos],
          ["Unidades disponibles", r.unidades_disponibles],
          ["Stock bajo", r.productos_stock_bajo],
          ["Agotados", r.productos_agotados],
          ["Valor a precio de venta", moneda(r.valor_inventario_precio_venta)],
        ]}
      />
      <Tabla
        titulo="Existencias actuales"
        columnas={[
          "Producto",
          "Categoría",
          "Precio",
          "Stock",
          "Mínimo",
          "Estado",
          "Disponibilidad",
          "Valor",
        ]}
        filas={datos.productos.map((p) => ({
          id: p.id_producto,
          celdas: [
            p.nombre,
            p.categoria,
            moneda(p.precio),
            p.stock,
            p.stock_minimo,
            estado(p.estado_stock),
            p.disponible ? "Activo" : "Inactivo",
            moneda(p.valor_precio_venta),
          ],
        }))}
      />
      <Indicadores
        datos={[
          ["Unidades de entrada", r.total_entradas],
          ["Unidades de salida", r.total_salidas],
          ["Operaciones de ajuste", r.total_ajustes],
        ]}
      />
      <Tabla
        titulo="Movimientos del periodo"
        columnas={[
          "Fecha",
          "Producto",
          "Tipo",
          "Cantidad",
          "Usuario",
          "Motivo",
        ]}
        filas={datos.movimientos.map((m) => ({
          id: m.id_movimiento,
          celdas: [
            m.fecha_movimiento,
            m.producto,
            estado(m.tipo),
            m.cantidad,
            m.usuario,
            m.motivo,
          ],
        }))}
      />
    </>
  );
}
function Caja({ datos }: { datos: ReporteCaja }) {
  const r = datos.resumen;
  return (
    <>
      <Indicadores
        datos={[
          ["Sesiones de caja", r.total_cajas],
          ["Abiertas", r.cajas_abiertas],
          ["Cerradas", r.cajas_cerradas],
          ["Ingresos por ventas", moneda(r.ingresos_por_ventas)],
          ["Otras entradas", moneda(r.otras_entradas)],
          ["Entradas del periodo", moneda(r.total_entradas)],
          ["Salidas del periodo", moneda(r.total_salidas)],
          ["Flujo neto", moneda(r.flujo_neto)],
          ["Faltantes", moneda(r.total_faltantes)],
          ["Sobrantes", moneda(r.total_sobrantes)],
        ]}
      />
      <p className="text-sm text-frizalia-muted">
        Los importes de cada sesión corresponden a su acumulado completo, no
        solo a los movimientos del periodo.
      </p>
      <Tabla
        titulo="Sesiones de caja"
        columnas={[
          "Caja",
          "Apertura",
          "Cierre",
          "Estado",
          "Fondo",
          "Entradas",
          "Salidas",
          "Esperado",
          "Real",
          "Diferencia",
        ]}
        filas={datos.cajas.map((c) => ({
          id: c.id_caja,
          celdas: [
            c.id_caja,
            c.fecha_apertura,
            c.fecha_cierre,
            estado(c.estado),
            moneda(c.fondo_inicial),
            moneda(c.total_entradas),
            moneda(c.total_salidas),
            moneda(c.monto_esperado),
            moneda(c.monto_real),
            moneda(c.diferencia),
          ],
        }))}
      />
      <Tabla
        titulo="Movimientos del periodo"
        columnas={[
          "Fecha",
          "Caja",
          "Tipo",
          "Concepto",
          "Monto",
          "Usuario",
          "Motivo",
        ]}
        filas={datos.movimientos.map((m) => ({
          id: m.id_movimiento_caja,
          celdas: [
            m.fecha_movimiento,
            m.id_caja,
            estado(m.tipo),
            estado(m.concepto),
            moneda(m.monto),
            m.usuario,
            m.motivo,
          ],
        }))}
      />
    </>
  );
}
function Solicitudes({ datos }: { datos: ReporteSolicitudes }) {
  const r = datos.resumen;
  return (
    <>
      <p className="text-sm text-frizalia-muted">
        Solicitudes creadas en el periodo, con su estado y cobro actuales.
      </p>
      <Indicadores
        datos={[
          ["Solicitudes", r.total_solicitudes],
          ["Pendientes", r.pendientes],
          ["Aceptadas", r.aceptadas],
          ["En preparación", r.en_preparacion],
          ["Listas", r.listas],
          ["Entregadas", r.entregadas],
          ["Rechazadas", r.rechazadas],
          ["Canceladas", r.canceladas],
          ["Cancelaciones pendientes", r.cancelaciones_pendientes],
          ["Cobradas", r.solicitudes_cobradas],
          ["Importe cobrado", moneda(r.ingresos_solicitudes)],
        ]}
      />
      <Tabla
        titulo="Solicitudes registradas"
        columnas={[
          "Folio",
          "Cliente",
          "Fecha",
          "Estado",
          "Cancelación",
          "Total",
          "Cobrado",
          "Venta",
        ]}
        filas={datos.solicitudes.map((s) => ({
          id: s.id_solicitud,
          celdas: [
            s.folio ?? `#${s.id_solicitud}`,
            s.cliente,
            s.fecha_solicitud,
            estado(s.estado),
            estado(s.estado_cancelacion),
            moneda(s.total),
            moneda(s.monto_cobrado),
            s.id_venta,
          ],
        }))}
      />
    </>
  );
}

type Resultado =
  | { tipo: "ventas"; datos: ReporteVentas }
  | { tipo: "inventario"; datos: ReporteInventario }
  | { tipo: "caja"; datos: ReporteCaja }
  | { tipo: "solicitudes"; datos: ReporteSolicitudes };
async function consultar(
  tipo: TipoReporte,
  periodo: PeriodoReporte,
  token: string,
): Promise<Resultado> {
  switch (tipo) {
    case "ventas":
      return { tipo, datos: await obtenerReporte(tipo, periodo, token) };
    case "inventario":
      return { tipo, datos: await obtenerReporte(tipo, periodo, token) };
    case "caja":
      return { tipo, datos: await obtenerReporte(tipo, periodo, token) };
    case "solicitudes":
      return { tipo, datos: await obtenerReporte(tipo, periodo, token) };
  }
}
function ContenidoReporte({
  tipo,
  periodo,
  token,
}: {
  tipo: TipoReporte;
  periodo: PeriodoReporte;
  token: string;
}) {
  const [resultado, setResultado] = useState<{
    token: string;
    datos: Resultado;
  } | null>(null);
  const [error, setError] = useState<{ token: string; mensaje: string } | null>(
    null,
  );
  useEffect(() => {
    let vigente = true;
    void consultar(tipo, periodo, token)
      .then((datos) => {
        if (vigente) setResultado({ token, datos });
      })
      .catch((e: unknown) => {
        if (vigente)
          setError({
            token,
            mensaje:
              e instanceof Error
                ? e.message
                : "No se pudo consultar el reporte.",
          });
      });
    return () => {
      vigente = false;
    };
  }, [tipo, periodo, token]);
  if (error?.token === token)
    return (
      <p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">
        {error.mensaje}
      </p>
    );
  if (resultado?.token !== token)
    return (
      <p role="status" className="rounded-xl bg-white p-6 text-frizalia-muted">
        Cargando reporte...
      </p>
    );
  switch (resultado.datos.tipo) {
    case "ventas":
      return <Ventas datos={resultado.datos.datos} />;
    case "inventario":
      return <Inventario datos={resultado.datos.datos} />;
    case "caja":
      return <Caja datos={resultado.datos.datos} />;
    case "solicitudes":
      return <Solicitudes datos={resultado.datos.datos} />;
  }
}

export default function ReportesPage() {
  const { token } = useAuth();
  const [tipo, setTipo] = useState<TipoReporte>("ventas");
  const [filtro, setFiltro] = useState(periodoInicial);
  const [consulta, setConsulta] = useState(() => ({
    periodo: periodoInicial(),
    revision: 0,
  }));
  const [errorFiltro, setErrorFiltro] = useState("");
  function aplicar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      !filtro.fecha_inicio ||
      !filtro.fecha_fin ||
      filtro.fecha_inicio > filtro.fecha_fin
    ) {
      setErrorFiltro("Selecciona un periodo válido.");
      return;
    }
    setErrorFiltro("");
    setConsulta((prev) => ({
      periodo: { ...filtro },
      revision: prev.revision + 1,
    }));
  }
  return (
    <div className="space-y-6 text-frizalia-text">
      <header>
        <h1 className="text-3xl font-bold">Reportes</h1>
        <p className="mt-1 text-frizalia-muted">
          Consulta el rendimiento de Frizalia.
        </p>
      </header>
      <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-3 shadow-sm">
        {pestañas.map((p) => (
          <button
            key={p.tipo}
            type="button"
            aria-pressed={tipo === p.tipo}
            onClick={() => setTipo(p.tipo)}
            className={`rounded-xl px-5 py-3 text-sm font-semibold ${tipo === p.tipo ? "bg-pink-100 text-frizalia-text" : "text-frizalia-muted hover:bg-pink-50"}`}
          >
            {p.nombre}
          </button>
        ))}
      </div>
      <form
        onSubmit={aplicar}
        className="flex flex-wrap items-end gap-4 rounded-2xl bg-white p-5 shadow-sm"
      >
        <label className="flex flex-col gap-2 text-sm font-medium">
          Fecha inicial
          <input
            type="date"
            required
            value={filtro.fecha_inicio}
            onChange={(e) =>
              setFiltro((p) => ({ ...p, fecha_inicio: e.target.value }))
            }
            className="rounded-xl border border-gray-200 px-4 py-2"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Fecha final
          <input
            type="date"
            required
            min={filtro.fecha_inicio}
            value={filtro.fecha_fin}
            onChange={(e) =>
              setFiltro((p) => ({ ...p, fecha_fin: e.target.value }))
            }
            className="rounded-xl border border-gray-200 px-4 py-2"
          />
        </label>
        <button
          type="submit"
          className="rounded-xl bg-frizalia-yellow px-6 py-3 text-sm font-semibold"
        >
          Consultar
        </button>
        {errorFiltro && (
          <p role="alert" className="w-full text-sm text-red-700">
            {errorFiltro}
          </p>
        )}
      </form>
      <p className="text-sm text-frizalia-muted">
        Periodo consultado: {consulta.periodo.fecha_inicio} al{" "}
        {consulta.periodo.fecha_fin}
      </p>
      {token ? (
        <ContenidoReporte
          key={`${tipo}:${consulta.revision}`}
          tipo={tipo}
          periodo={consulta.periodo}
          token={token}
        />
      ) : (
        <p role="alert">No hay una sesión activa.</p>
      )}
    </div>
  );
}
