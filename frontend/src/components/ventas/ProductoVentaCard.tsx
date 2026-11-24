import { useState } from "react";
import { Package, Plus, Minus, ShoppingCart } from "lucide-react";
import type { ProductoInventario } from "../../types/inventario";
import { moneda } from "./utilidades";
interface Props { producto: ProductoInventario; enCarrito: number; bloqueado: boolean; agregar: (id: number, cantidad: number) => void }
export default function ProductoVentaCard({producto, enCarrito, bloqueado, agregar}: Props) {
  const [cantidad, setCantidad] = useState(1);
  const [imagenFallida, setImagenFallida] = useState(false);
  const restante = Math.max(0, producto.stock - enCarrito);
  const actual = Math.min(cantidad, Math.max(1, restante));
  const disponible = producto.disponible === 1 && restante > 0 && !bloqueado;
  return <article className="flex min-w-0 flex-col gap-2 rounded-2xl border border-frizalia-soft-pink bg-white p-4 shadow-sm">
    <div className="flex h-24 items-center justify-center rounded-xl bg-frizalia-soft-pink text-frizalia-danger">
      {producto.imagen_url && !imagenFallida ? <img src={producto.imagen_url} alt={producto.nombre} onError={() => setImagenFallida(true)} className="h-full w-full rounded-xl object-contain"/> : <Package size={38}/>}
    </div>
    <h3 className="font-bold text-slate-800" title={producto.descripcion ?? producto.nombre}>{producto.nombre}</h3>
    <p className="text-xs text-slate-500">{producto.presentacion ?? producto.categoria}</p>
    <p className="mt-auto text-lg font-bold text-slate-900">{moneda(producto.precio)}</p>
    <p className={`text-sm ${producto.stock === 0 ? "text-red-600" : producto.stock <= producto.stock_minimo ? "text-amber-700" : "text-slate-600"}`}>Stock: {producto.stock}{enCarrito > 0 ? ` · En pedido: ${enCarrito}` : ""}</p>
    <div className="flex items-center justify-between rounded-lg border border-slate-200">
      <button type="button" aria-label="Reducir cantidad" disabled={!disponible || actual <= 1} onClick={() => setCantidad(actual - 1)} className="p-2 disabled:opacity-30"><Minus size={16}/></button>
      <span>{actual}</span>
      <button type="button" aria-label="Aumentar cantidad" disabled={!disponible || actual >= restante} onClick={() => setCantidad(actual + 1)} className="p-2 disabled:opacity-30"><Plus size={16}/></button>
    </div>
    <button type="button" disabled={!disponible} onClick={() => { agregar(producto.id_producto, actual); setCantidad(1); }} className="flex items-center justify-center gap-2 rounded-xl bg-frizalia-pink p-2 text-sm font-semibold text-frizalia-text hover:bg-pink-300 disabled:bg-slate-300"><ShoppingCart size={16}/>{producto.disponible !== 1 ? "Inactivo" : restante === 0 ? "Sin existencias disponibles" : "Agregar"}</button>
  </article>;
}
