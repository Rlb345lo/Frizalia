import type { LucideIcon } from "lucide-react";

// ==========================================
// TIPOS
// ==========================================

export type StatCardColor = "rosa" | "amarillo" | "verde" | "azul";

interface StatCardProps {
  titulo: string;
  valor: string | number;
  icono: LucideIcon;
  color?: StatCardColor;
  descripcion?: string;
}

// ==========================================
// COLORES
// ==========================================

const estilosColor: Record<
  StatCardColor,
  {
    fondo: string;
    icono: string;
  }
> = {
  rosa: {
    fondo: "bg-frizalia-soft-pink",
    icono: "text-frizalia-text",
  },
  amarillo: {
    fondo: "bg-yellow-100",
    icono: "text-yellow-700",
  },
  verde: {
    fondo: "bg-green-100",
    icono: "text-green-700",
  },
  azul: {
    fondo: "bg-blue-100",
    icono: "text-blue-700",
  },
};

// ==========================================
// COMPONENTE STAT CARD
// ==========================================

export default function StatCard({
  titulo,
  valor,
  icono: Icono,
  color = "rosa",
  descripcion,
}: StatCardProps) {
  const estilo = estilosColor[color];

  return (
    <article className="rounded-2xl border border-frizalia-soft-pink bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* ENCABEZADO */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-medium text-frizalia-muted">{titulo}</h3>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${estilo.fondo}`}
        >
          <Icono size={22} strokeWidth={1.8} className={estilo.icono} />
        </div>
      </div>

      {/* VALOR */}
      <p className="mt-4 text-3xl font-bold tracking-tight text-frizalia-text">
        {valor}
      </p>

      {/* DESCRIPCIÓN */}
      {descripcion && (
        <p className="mt-2 text-xs text-frizalia-muted">{descripcion}</p>
      )}
    </article>
  );
}
