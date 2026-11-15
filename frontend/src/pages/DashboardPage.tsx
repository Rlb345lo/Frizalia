import { useCallback, useEffect, useState } from "react";

import {
  IceCreamCone,
  ShoppingCart,
  Wallet,
  Package,
  ClipboardList,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

import { useAuth } from "../hooks/useAuth";

import StatCard from "../components/dashboard/StatCard";
import SalesChart from "../components/dashboard/SalesChart";
import LowStockList from "../components/dashboard/LowStockList";
import RecentRequests from "../components/dashboard/RecentRequests";

import { obtenerResumenDashboard } from "../services/dashboardApi";

import type { ResumenDashboard } from "../services/dashboardApi";
import type { ProductoStockBajo } from "../components/dashboard/LowStockList";
import type { SolicitudReciente } from "../components/dashboard/RecentRequests";

// ==========================================
// DATOS DE DEMOSTRACIÓN
// ==========================================

// Estos valores se reemplazarán cuando
// implementemos el módulo de ventas.
const ventasHoyEjemplo = 24;
const ingresosHoyEjemplo = 2450;

const ventasSemanalesEjemplo = [
  { dia: "Lun", total: 1250 },
  { dia: "Mar", total: 1800 },
  { dia: "Mié", total: 1450 },
  { dia: "Jue", total: 2200 },
  { dia: "Vie", total: 1950 },
  { dia: "Sáb", total: 3100 },
  { dia: "Dom", total: 2450 },
];

// ==========================================
// FORMATO DE MONEDA
// ==========================================

const formatoMoneda = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

// ==========================================
// ADAPTAR PRODUCTOS CON STOCK BAJO
// ==========================================

function adaptarProductosStockBajo(
  productos: ResumenDashboard["productosStockBajo"],
): ProductoStockBajo[] {
  return productos.map((producto) => ({
    id: producto.id,
    nombre: producto.nombre,

    // Temporalmente no tenemos presentaciones
    // registradas en la base de datos.
    presentacion: "Sin presentación",

    stockActual: producto.stockActual,
    stockMinimo: producto.stockMinimo,
  }));
}

// ==========================================
// ADAPTAR SOLICITUDES RECIENTES
// ==========================================

// Conservamos los estados originales de MySQL.
// RecentRequests.tsx ya reconoce los siete estados.

function adaptarSolicitudes(
  solicitudes: ResumenDashboard["solicitudesRecientes"],
): SolicitudReciente[] {
  return solicitudes.map((solicitud) => ({
    id: solicitud.id,
    cliente: solicitud.cliente,
    fecha: solicitud.fecha,
    estado: solicitud.estado,
  }));
}

// ==========================================
// COMPONENTE DASHBOARD
// ==========================================

export default function DashboardPage() {
  const { usuario, token, verificando } = useAuth();

  // ========================================
  // ESTADOS
  // ========================================

  const [resumen, setResumen] = useState<ResumenDashboard | null>(null);

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========================================
  // ACTUALIZACIÓN MANUAL
  // ========================================

  const cargarDashboard = useCallback(async () => {
    if (!token) {
      setError("No se encontró una sesión activa.");
      return;
    }

    try {
      setActualizando(true);
      setError(null);

      const datos = await obtenerResumenDashboard(token);

      setResumen(datos);
    } catch (errorDesconocido) {
      const mensaje =
        errorDesconocido instanceof Error
          ? errorDesconocido.message
          : "Ocurrió un error al actualizar el Dashboard.";

      setError(mensaje);
    } finally {
      setActualizando(false);
    }
  }, [token]);

  // ========================================
  // CARGAR DATOS AL ENTRAR AL DASHBOARD
  // ========================================

  useEffect(() => {
    if (verificando || !token) {
      return;
    }

    // Evitar actualizar el estado después
    // de desmontar el componente.
    let activo = true;

    async function consultarDashboard() {
      try {
        const datos = await obtenerResumenDashboard(token!);

        if (!activo) {
          return;
        }

        setResumen(datos);
        setError(null);
      } catch (errorDesconocido) {
        if (!activo) {
          return;
        }

        const mensaje =
          errorDesconocido instanceof Error
            ? errorDesconocido.message
            : "Ocurrió un error al cargar el Dashboard.";

        setError(mensaje);
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    void consultarDashboard();

    return () => {
      activo = false;
    };
  }, [verificando, token]);

  // ========================================
  // ADAPTAR DATOS
  // ========================================

  const productosStockBajo = adaptarProductosStockBajo(
    resumen?.productosStockBajo ?? [],
  );

  const solicitudesRecientes = adaptarSolicitudes(
    resumen?.solicitudesRecientes ?? [],
  );

  // ========================================
  // RENDERIZAR DASHBOARD
  // ========================================

  return (
    <div className="space-y-7">
      {/* ======================================
          BIENVENIDA
      ====================================== */}

      <section className="flex flex-wrap items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-frizalia-soft-pink">
          <IceCreamCone size={26} className="text-frizalia-text" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-frizalia-text">
            ¡Bienvenido, {usuario?.nombre ?? "Usuario"}!
          </h2>

          <p className="mt-1 text-sm text-frizalia-muted">
            Aquí encontrarás un resumen de la actividad de tu negocio.
          </p>
        </div>
      </section>

      {/* ======================================
          ESTADÍSTICAS PRINCIPALES
      ====================================== */}

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-frizalia-text">
              Resumen general
            </h3>

            <p className="text-sm text-frizalia-muted">
              Indicadores principales del negocio
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-frizalia-soft-pink px-3 py-1 text-xs font-medium text-frizalia-text">
              Datos reales y demostración
            </span>

            <button
              type="button"
              onClick={() => void cargarDashboard()}
              disabled={cargando || actualizando || verificando || !token}
              className="flex items-center gap-2 rounded-xl border border-frizalia-pink px-3 py-2 text-sm font-medium text-frizalia-text transition hover:bg-frizalia-soft-pink disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={actualizando ? "animate-spin" : ""}
              />

              {actualizando ? "Actualizando..." : "Actualizar"}
            </button>
          </div>
        </div>

        {/* ==================================
            MENSAJE DE ERROR
        ================================== */}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-frizalia-danger/30 bg-frizalia-danger/5 p-4"
          >
            <AlertTriangle
              size={20}
              className="mt-0.5 shrink-0 text-frizalia-danger"
            />

            <div>
              <p className="font-semibold text-frizalia-danger">
                No se pudieron cargar las estadísticas
              </p>

              <p className="mt-1 text-sm text-frizalia-muted">{error}</p>
            </div>
          </div>
        )}

        {/* ==================================
            INDICADOR DE CARGA
        ================================== */}

        {(cargando || verificando) && (
          <p role="status" className="text-sm text-frizalia-muted">
            Cargando estadísticas del negocio...
          </p>
        )}

        {/* ==================================
            TARJETAS DE ESTADÍSTICAS
        ================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            titulo="Ventas del día"
            valor={ventasHoyEjemplo}
            icono={ShoppingCart}
            color="rosa"
            descripcion="Dato de demostración"
          />

          <StatCard
            titulo="Ingresos del día"
            valor={formatoMoneda.format(ingresosHoyEjemplo)}
            icono={Wallet}
            color="amarillo"
            descripcion="Dato de demostración"
          />

          <StatCard
            titulo="Productos activos"
            valor={
              cargando && !resumen ? "..." : (resumen?.productosActivos ?? "—")
            }
            icono={Package}
            color="verde"
            descripcion="Productos disponibles en inventario"
          />

          <StatCard
            titulo="Solicitudes pendientes"
            valor={
              cargando && !resumen
                ? "..."
                : (resumen?.solicitudesPendientes ?? "—")
            }
            icono={ClipboardList}
            color="azul"
            descripcion="Solicitudes por atender"
          />
        </div>
      </section>

      {/* ======================================
          GRÁFICO DE VENTAS SEMANALES
      ====================================== */}

      <section className="space-y-2">
        <p className="text-xs text-frizalia-muted">
          Gráfico semanal con datos de demostración.
        </p>

        <SalesChart ventas={ventasSemanalesEjemplo} />
      </section>

      {/* ======================================
          INVENTARIO Y SOLICITUDES
      ====================================== */}

      <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        <LowStockList productos={productosStockBajo} />

        <RecentRequests solicitudes={solicitudesRecientes} />
      </section>
    </div>
  );
}
