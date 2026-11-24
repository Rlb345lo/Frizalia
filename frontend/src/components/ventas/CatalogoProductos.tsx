import { useState } from "react";
import { Search } from "lucide-react";
import type { ProductoInventario, CategoriaInventario } from "../../types/inventario";
import type { LineaCarrito } from "./utilidades";
import ProductoVentaCard from "./ProductoVentaCard";
interface Props { productos: ProductoInventario[]; categorias: CategoriaInventario[]; carrito: LineaCarrito[]; bloqueado: boolean; agregar: (id: number, cantidad: number) => void }
export default function CatalogoProductos({productos, categorias, carrito, bloqueado, agregar}: Props) {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState<number | null>(null);
  const texto = busqueda.trim().toLowerCase();
  const filtrados = productos.filter(p => (categoria === null || p.id_categoria === categoria) && [p.nombre, p.categoria, p.presentacion ?? ""].some(v => v.toLowerCase().includes(texto)));
  return <section className="min-w-0 space-y-4">
    <div className="space-y-3 rounded-2xl border border-frizalia-soft-pink bg-white p-4 shadow-sm">
      <div className="relative"><Search size={18} className="absolute left-3 top-3 text-slate-400"/><input type="search" aria-label="Buscar producto" placeholder="Buscar producto..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 outline-none focus:border-frizalia-pink"/></div>
      <div className="flex flex-wrap gap-2">{[{id_categoria: null, nombre: "Todos"}, ...categorias.filter(c => c.activa === 1)].map(c => <button type="button" key={c.id_categoria ?? "todos"} aria-pressed={categoria === c.id_categoria} onClick={() => setCategoria(c.id_categoria)} className={`rounded-xl px-4 py-2 text-sm font-semibold ${categoria === c.id_categoria ? "bg-frizalia-pink text-frizalia-text" : "bg-frizalia-soft-pink text-frizalia-text hover:bg-frizalia-pink"}`}>{c.nombre}</button>)}</div>
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">{filtrados.map(p => <ProductoVentaCard key={p.id_producto} producto={p} enCarrito={carrito.find(l => l.producto.id_producto === p.id_producto)?.cantidad ?? 0} bloqueado={bloqueado} agregar={agregar}/>)}</div>
    {!filtrados.length && <p className="rounded-xl bg-white p-8 text-center text-slate-500">No se encontraron productos.</p>}
  </section>;
}
