import { ClipboardList, ClipboardCheck } from "lucide-react";

// ==========================================
// TIPOS
// ==========================================

export type EstadoSolicitud =
  | "PENDIENTE"
  | "ACEPTADA"
  | "EN_PREPARACION"
  | "LISTA"
  | "ENTREGADA"
  | "RECHAZADA"
  | "CANCELADA";

export interface SolicitudReciente {
  id: number;
  cliente: string;
  fecha: string;
  estado: EstadoSolicitud;
}

interface RecentRequestsProps {
  solicitudes: SolicitudReciente[];
}

// ==========================================
// ESTILOS DE LOS ESTADOS
// ==========================================

const estilosEstado: Record<
  EstadoSolicitud,
  {
    texto: string;
    clases: string;
  }
> = {
  PENDIENTE: {
    texto: "En espera",
    clases: "bg-yellow-100 text-yellow-800",
  },

  ACEPTADA: {
    texto: "Aceptada",
    clases: "bg-green-100 text-green-800",
  },

  EN_PREPARACION: {
    texto: "En preparación",
    clases: "bg-blue-100 text-blue-800",
  },

  LISTA: {
    texto: "Lista para recoger",
    clases: "bg-purple-100 text-purple-800",
  },

  ENTREGADA: {
    texto: "Entregada",
    clases: "bg-emerald-100 text-emerald-800",
  },

  RECHAZADA: {
    texto: "Rechazada",
    clases: "bg-red-100 text-red-700",
  },

  CANCELADA: {
    texto: "Cancelada",
    clases: "bg-gray-100 text-gray-700",
  },
};

// ==========================================
// FORMATO DE FECHA
// ==========================================

const formatoFecha = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "America/Cancun",
});

function formatearFecha(fecha: string): string {
  const fechaValida = new Date(fecha);

  if (Number.isNaN(fechaValida.getTime())) {
    return fecha;
  }

  return formatoFecha.format(fechaValida);
}

// ==========================================
// COMPONENTE RECENT REQUESTS
// ==========================================

export default function RecentRequests({ solicitudes }: RecentRequestsProps) {
  return (
    <section className="rounded-3xl border border-frizalia-soft-pink bg-white p-5 shadow-sm sm:p-6">
      {/* ======================================
          ENCABEZADO
      ====================================== */}

      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-frizalia-soft-pink">
          <ClipboardList size={22} className="text-frizalia-text" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-frizalia-text">
            Solicitudes recientes
          </h3>

          <p className="text-sm text-frizalia-muted">
            Últimas solicitudes registradas
          </p>
        </div>
      </div>

      {/* ======================================
          LISTA DE SOLICITUDES
      ====================================== */}

      {solicitudes.length > 0 ? (
        <div className="mt-6 divide-y divide-frizalia-soft-pink">
          {solicitudes.map((solicitud) => {
            const estado = estilosEstado[solicitud.estado];

            return (
              <div
                key={solicitud.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
              >
                {/* INFORMACIÓN DEL CLIENTE */}

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-frizalia-text">
                    {solicitud.cliente}
                  </p>

                  <p className="mt-1 text-xs text-frizalia-muted">
                    Solicitud #{solicitud.id} ·{" "}
                    {formatearFecha(solicitud.fecha)}
                  </p>
                </div>

                {/* ESTADO */}

                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${estado.clases}`}
                >
                  {estado.texto}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        /* ======================================
            ESTADO VACÍO
        ====================================== */

        <div className="mt-6 flex flex-col items-center justify-center rounded-2xl bg-frizalia-cream px-4 py-8 text-center">
          <ClipboardCheck size={30} className="text-frizalia-success" />

          <p className="mt-3 text-sm font-semibold text-frizalia-text">
            Sin solicitudes recientes
          </p>

          <p className="mt-1 text-xs text-frizalia-muted">
            Todavía no hay solicitudes para mostrar.
          </p>
        </div>
      )}
    </section>
  );
}
