import { useState } from "react";
import { useLocation } from "react-router";

import { Search, Bell, CalendarDays, UserRound } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";

// ==========================================
// TÍTULOS DE LAS SECCIONES
// ==========================================

const titulos: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/inventario": "Inventario",
  "/ventas": "Ventas",
  "/caja": "Caja",
  "/solicitudes": "Solicitudes",
  "/reportes": "Reportes",
  "/perfil": "Mi perfil",
  "/configuracion": "Configuración",
};

// ==========================================
// COMPONENTE HEADER
// ==========================================

export default function Header() {
  const location = useLocation();
  const { usuario } = useAuth();

  // ==========================================
  // ESTADOS
  // ==========================================

  const [busqueda, setBusqueda] = useState("");

  // ==========================================
  // INFORMACIÓN DE LA PÁGINA
  // ==========================================

  const titulo = titulos[location.pathname] ?? "Frizalia";

  const fechaActual = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <header className="flex min-h-20 flex-wrap items-center justify-between gap-4 border-b border-frizalia-soft-pink bg-white px-6 py-4">
      {/* ======================================
          TÍTULO DE LA SECCIÓN
      ====================================== */}

      <div>
        <h1 className="text-2xl font-bold text-frizalia-text">{titulo}</h1>

        <p className="text-sm text-frizalia-muted">
          Sistema administrativo de Frizalia
        </p>
      </div>

      {/* ======================================
          HERRAMIENTAS DEL HEADER
      ====================================== */}

      <div className="flex flex-wrap items-center gap-4">
        {/* BUSCADOR */}
        <div className="hidden items-center gap-2 rounded-xl border border-frizalia-soft-pink bg-frizalia-cream px-4 md:flex">
          <Search size={19} className="text-frizalia-muted" />

          <input
            type="search"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar..."
            aria-label="Buscar"
            className="w-40 bg-transparent py-3 text-sm text-frizalia-text outline-none placeholder:text-frizalia-muted"
          />
        </div>

        {/* FECHA */}
        <div className="hidden items-center gap-2 text-sm text-frizalia-muted xl:flex">
          <CalendarDays size={19} />

          <span className="capitalize">{fechaActual}</span>
        </div>

        {/* NOTIFICACIONES */}
        <button
          type="button"
          aria-label="Notificaciones"
          title="Notificaciones (próximamente)"
          disabled
          className="flex h-11 w-11 cursor-not-allowed items-center justify-center rounded-xl text-frizalia-muted opacity-60"
        >
          <Bell size={21} />
        </button>

        {/* ======================================
            INFORMACIÓN DEL USUARIO
        ====================================== */}

        <div className="flex items-center gap-3 border-l border-frizalia-soft-pink pl-4">
          {/* ICONO DEL USUARIO */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-frizalia-soft-pink">
            <UserRound size={21} className="text-frizalia-text" />
          </div>

          {/* NOMBRE DEL USUARIO */}
          <div className="min-w-0">
            <p
              className="max-w-40 truncate text-sm font-semibold text-frizalia-text"
              title={usuario?.nombre ?? "Usuario"}
            >
              {usuario?.nombre ?? "Usuario"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
