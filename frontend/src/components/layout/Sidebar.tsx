import { useEffect, useRef, useState, type ComponentType } from "react";

import { createPortal } from "react-dom";
import { NavLink, useNavigate } from "react-router";

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Wallet,
  ClipboardList,
  ChartNoAxesCombined,
  UserRound,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import logoFrizalia from "../../assets/logo_frizalia.png";
import { useAuth } from "../../hooks/useAuth";

// ==========================================
// TIPOS
// ==========================================

interface OpcionMenu {
  nombre: string;
  ruta: string;
  descripcion: string;
  icono: ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
}

interface TooltipActivo {
  nombre: string;
  descripcion: string;
  top: number;
  left: number;
}

// ==========================================
// CONSTANTES
// ==========================================

const CLAVE_SIDEBAR = "frizalia_sidebar";
const RETRASO_TOOLTIP = 900;

// ==========================================
// OPCIONES DEL MENÚ
// ==========================================

const menuPrincipal: OpcionMenu[] = [
  {
    nombre: "Dashboard",
    ruta: "/dashboard",
    icono: LayoutDashboard,
    descripcion: "Resumen general del negocio",
  },
  {
    nombre: "Inventario",
    ruta: "/inventario",
    icono: Package,
    descripcion: "Administrar productos y existencias",
  },
  {
    nombre: "Ventas",
    ruta: "/ventas",
    icono: ShoppingCart,
    descripcion: "Registrar y consultar ventas",
  },
  {
    nombre: "Caja",
    ruta: "/caja",
    icono: Wallet,
    descripcion: "Apertura y cierre de caja",
  },
  {
    nombre: "Solicitudes",
    ruta: "/solicitudes",
    icono: ClipboardList,
    descripcion: "Gestionar solicitudes de clientes",
  },
  {
    nombre: "Reportes",
    ruta: "/reportes",
    icono: ChartNoAxesCombined,
    descripcion: "Consultar estadísticas del negocio",
  },
];

const menuSecundario: OpcionMenu[] = [
  {
    nombre: "Perfil",
    ruta: "/perfil",
    icono: UserRound,
    descripcion: "Consultar información de tu cuenta",
  },
  {
    nombre: "Configuración",
    ruta: "/configuracion",
    icono: Settings,
    descripcion: "Preferencias del sistema",
  },
];

// ==========================================
// COMPONENTE SIDEBAR
// ==========================================

export default function Sidebar() {
  const navigate = useNavigate();
  const { usuario, cerrarSesion } = useAuth();

  // ==========================================
  // ESTADO DEL SIDEBAR
  // ==========================================

  const [expandido, setExpandido] = useState(() => {
    return localStorage.getItem(CLAVE_SIDEBAR) !== "cerrado";
  });

  // ==========================================
  // ESTADO DEL TOOLTIP
  // ==========================================

  const [tooltip, setTooltip] = useState<TooltipActivo | null>(null);

  const temporizadorTooltip = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  // ==========================================
  // LIMPIAR TEMPORIZADOR
  // ==========================================

  function cancelarTemporizador() {
    if (temporizadorTooltip.current !== null) {
      clearTimeout(temporizadorTooltip.current);
      temporizadorTooltip.current = null;
    }
  }

  function ocultarTooltip() {
    cancelarTemporizador();
    setTooltip(null);
  }

  // ==========================================
  // MOSTRAR TOOLTIP
  // ==========================================

  function mostrarTooltip(
    elemento: HTMLElement,
    nombre: string,
    descripcion: string,
  ) {
    cancelarTemporizador();
    setTooltip(null);

    if (expandido) return;

    const rect = elemento.getBoundingClientRect();

    const top = Math.max(
      55,
      Math.min(rect.top + rect.height / 2, window.innerHeight - 55),
    );

    const left = rect.right + 12;

    temporizadorTooltip.current = setTimeout(() => {
      setTooltip({
        nombre,
        descripcion,
        top,
        left,
      });

      temporizadorTooltip.current = null;
    }, RETRASO_TOOLTIP);
  }

  // ==========================================
  // LIMPIEZA AL DESMONTAR
  // ==========================================

  useEffect(() => {
    return () => {
      if (temporizadorTooltip.current !== null) {
        clearTimeout(temporizadorTooltip.current);
      }
    };
  }, []);

  // ==========================================
  // EXPANDIR / CONTRAER
  // ==========================================

  function alternarSidebar() {
    ocultarTooltip();

    const nuevoEstado = !expandido;

    setExpandido(nuevoEstado);

    localStorage.setItem(CLAVE_SIDEBAR, nuevoEstado ? "abierto" : "cerrado");
  }

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  function handleCerrarSesion() {
    ocultarTooltip();
    cerrarSesion();
    navigate("/login", { replace: true });
  }

  // ==========================================
  // ENLACES REUTILIZABLES
  // ==========================================

  function renderizarEnlace(opcion: OpcionMenu) {
    const Icono = opcion.icono;

    return (
      <NavLink
        key={opcion.ruta}
        to={opcion.ruta}
        end
        aria-label={opcion.nombre}
        onMouseEnter={(event) => {
          mostrarTooltip(
            event.currentTarget,
            opcion.nombre,
            opcion.descripcion,
          );
        }}
        onMouseLeave={ocultarTooltip}
        onFocus={(event) => {
          if (!expandido) {
            mostrarTooltip(
              event.currentTarget,
              opcion.nombre,
              opcion.descripcion,
            );
          }
        }}
        onBlur={ocultarTooltip}
        onClick={ocultarTooltip}
        className={({ isActive }) =>
          `flex min-h-12 items-center rounded-xl py-3 text-sm font-medium transition-colors ${
            expandido ? "gap-3 px-4" : "justify-center px-2"
          } ${
            isActive
              ? "bg-frizalia-soft-pink text-frizalia-text"
              : "text-frizalia-muted hover:bg-frizalia-cream hover:text-frizalia-text"
          }`
        }
      >
        <Icono size={21} strokeWidth={1.8} className="shrink-0" />

        {expandido && <span className="truncate">{opcion.nombre}</span>}
      </NavLink>
    );
  }

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <>
      <aside
        className={`flex h-screen shrink-0 flex-col border-r border-frizalia-soft-pink bg-white transition-[width] duration-300 ${
          expandido ? "w-64" : "w-[76px]"
        }`}
      >
        {/* ======================================
            LOGO OFICIAL Y BOTÓN PLEGABLE
        ====================================== */}

        <div
          className={`flex items-center border-b border-frizalia-soft-pink py-4 ${
            expandido ? "justify-between gap-2 px-3" : "flex-col gap-2 px-2"
          }`}
        >
          {/* LOGO Y NOMBRE */}
          <NavLink
            to="/dashboard"
            onClick={ocultarTooltip}
            aria-label="Ir al Dashboard de Frizalia"
            className="flex min-w-0 items-center gap-2"
          >
            <img
              src={logoFrizalia}
              alt="Logo de Frizalia"
              className={`shrink-0 object-contain ${
                expandido ? "h-12 w-12" : "h-12 w-12"
              }`}
            />

            {expandido && (
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-frizalia-text">
                  Frizalia
                </h1>

                <p className="text-xs text-frizalia-muted">Administración</p>
              </div>
            )}
          </NavLink>

          {/* BOTÓN PLEGABLE */}
          <button
            type="button"
            onClick={alternarSidebar}
            aria-label={
              expandido ? "Contraer menú lateral" : "Expandir menú lateral"
            }
            aria-expanded={expandido}
            title={expandido ? "Contraer menú" : "Expandir menú"}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-frizalia-muted transition hover:bg-frizalia-cream hover:text-frizalia-text"
          >
            {expandido ? (
              <PanelLeftClose size={20} />
            ) : (
              <PanelLeftOpen size={20} />
            )}
          </button>
        </div>

        {/* ======================================
            NAVEGACIÓN
        ====================================== */}

        <nav
          aria-label="Navegación administrativa"
          className="flex-1 space-y-6 overflow-y-auto px-3 py-5"
        >
          {/* MENÚ PRINCIPAL */}
          <div>
            {expandido && (
              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-frizalia-muted">
                Principal
              </p>
            )}

            <div className="space-y-1">
              {menuPrincipal.map(renderizarEnlace)}
            </div>
          </div>

          {/* MENÚ SECUNDARIO */}
          <div>
            {expandido && (
              <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-frizalia-muted">
                Cuenta
              </p>
            )}

            <div className="space-y-1">
              {menuSecundario.map(renderizarEnlace)}
            </div>
          </div>
        </nav>

        {/* ======================================
            USUARIO Y CERRAR SESIÓN
        ====================================== */}

        <div className="border-t border-frizalia-soft-pink p-3">
          {/* INFORMACIÓN DEL USUARIO */}
          <div
            className={`mb-2 flex items-center rounded-xl bg-frizalia-cream p-3 ${
              expandido ? "gap-3" : "justify-center"
            }`}
            onMouseEnter={(event) => {
              mostrarTooltip(
                event.currentTarget,
                usuario?.nombre ?? "Usuario",
                usuario?.rol ?? "Sin rol",
              );
            }}
            onMouseLeave={ocultarTooltip}
          >
            <UserRound size={22} className="shrink-0 text-frizalia-text" />

            {expandido && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-frizalia-text">
                  {usuario?.nombre ?? "Usuario"}
                </p>

                <p className="truncate text-xs text-frizalia-muted">
                  {usuario?.rol ?? "Sin rol"}
                </p>
              </div>
            )}
          </div>

          {/* CERRAR SESIÓN */}
          <button
            type="button"
            onClick={handleCerrarSesion}
            onMouseEnter={(event) => {
              mostrarTooltip(
                event.currentTarget,
                "Cerrar sesión",
                "Salir del sistema administrativo",
              );
            }}
            onMouseLeave={ocultarTooltip}
            onFocus={(event) => {
              if (!expandido) {
                mostrarTooltip(
                  event.currentTarget,
                  "Cerrar sesión",
                  "Salir del sistema administrativo",
                );
              }
            }}
            onBlur={ocultarTooltip}
            aria-label="Cerrar sesión"
            className={`flex w-full items-center rounded-xl py-3 text-sm font-medium text-frizalia-danger transition hover:bg-frizalia-danger/10 ${
              expandido ? "gap-3 px-4" : "justify-center px-2"
            }`}
          >
            <LogOut size={21} strokeWidth={1.8} className="shrink-0" />

            {expandido && <span>Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* ======================================
          TOOLTIP FLOTANTE
      ====================================== */}

      {!expandido &&
        tooltip &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: "fixed",
              top: tooltip.top,
              left: tooltip.left,
              transform: "translateY(-50%)",
              zIndex: 9999,
            }}
            className="pointer-events-none max-w-56 rounded-xl border border-frizalia-soft-pink bg-white px-4 py-3 shadow-lg"
          >
            <p className="text-sm font-semibold text-frizalia-text">
              {tooltip.nombre}
            </p>

            <p className="mt-1 text-xs text-frizalia-muted">
              {tooltip.descripcion}
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}
