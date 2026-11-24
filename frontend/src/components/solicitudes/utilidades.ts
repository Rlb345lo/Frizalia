import type { EstadoSolicitud } from "../../types/solicitudes";
export const etiquetas: Record<EstadoSolicitud, string> = { PENDIENTE: "Pendiente", ACEPTADA: "Aceptada", EN_PREPARACION: "En preparación", LISTA: "Lista", ENTREGADA: "Entregada", RECHAZADA: "Rechazada", CANCELADA: "Cancelada" };
export const moneda = (valor: string | number) => new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(valor));
export const fecha = (valor: string | null) => valor && Number.isFinite(Date.parse(valor)) ? new Date(valor).toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" }) : "—";
export const mensajeError = (e: unknown) => e instanceof Error ? e.message : "Ocurrió un error inesperado";
export const boton = "rounded-lg border border-frizalia-soft-pink bg-white px-3 py-2 text-sm font-medium text-frizalia-text hover:bg-frizalia-soft-pink disabled:opacity-50 disabled:cursor-not-allowed";
export const primario = "rounded-lg bg-frizalia-yellow px-3 py-2 text-sm font-semibold text-frizalia-text hover:bg-frizalia-pink disabled:opacity-50 disabled:cursor-not-allowed";
export const campo = "w-full rounded-lg border border-frizalia-pink bg-white px-3 py-2 text-sm text-frizalia-text focus:border-frizalia-pink";
