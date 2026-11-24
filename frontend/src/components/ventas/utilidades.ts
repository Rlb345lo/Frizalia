import type { ProductoInventario } from "../../types/inventario";
export interface LineaCarrito { producto: ProductoInventario; cantidad: number }
export const centavos = (valor: string | number) => Math.round(Number(valor) * 100);
export const moneda = (valor: string | number) => new Intl.NumberFormat("es-MX", {style: "currency", currency: "MXN"}).format(Number(valor));
export const fecha = (valor: string) => new Date(valor.replace(" ", "T")).toLocaleString("es-MX");
export const mensajeError = (error: unknown) => error instanceof Error ? error.message : "Ocurrió un error inesperado.";
