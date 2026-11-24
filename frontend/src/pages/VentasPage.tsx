import { useCallback, useEffect, useRef, useState } from "react";
import { History, Plus, RefreshCw, ShoppingCart } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { obtenerProductos, obtenerCategorias } from "../services/inventarioApi";
import { obtenerCajaActual } from "../services/cajaApi";
import { registrarVenta } from "../services/ventasApi";
import type { ProductoInventario, CategoriaInventario } from "../types/inventario";
import type { ResumenCaja } from "../types/caja";
import CatalogoProductos from "../components/ventas/CatalogoProductos";
import CarritoVenta from "../components/ventas/CarritoVenta";
import CobrarVentaModal from "../components/ventas/CobrarVentaModal";
import HistorialVentasModal from "../components/ventas/HistorialVentasModal";
import { centavos, moneda, mensajeError } from "../components/ventas/utilidades";
import type { LineaCarrito } from "../components/ventas/utilidades";

export default function VentasPage() {
  const {token}=useAuth();
  const [productos,setProductos]=useState<ProductoInventario[]>([]);
  const [categorias,setCategorias]=useState<CategoriaInventario[]>([]);
  const [caja,setCaja]=useState<ResumenCaja|null>(null);
  const [carrito,setCarrito]=useState<LineaCarrito[]>([]);
  const [cargando,setCargando]=useState(true);
  const [procesando,setProcesando]=useState(false);
  const [cobro,setCobro]=useState(false);
  const [historial,setHistorial]=useState(false);
  const [error,setError]=useState("");
  const [errorCobro,setErrorCobro]=useState("");
  const [mensaje,setMensaje]=useState("");
  const bloqueo=useRef(false);
  const cargar=useCallback(async()=>{
    setCargando(true);setError("");setCaja(null);
    try {
      if(!token) throw new Error("No existe una sesión activa.");
      const [p,c,r]=await Promise.all([obtenerProductos(),obtenerCategorias(),obtenerCajaActual(token)]);
      setProductos(p);setCategorias(c);setCaja(r);
      setCarrito(anterior=>anterior.flatMap(l=>{
        const actual=p.find(x=>x.id_producto===l.producto.id_producto);
        return actual && actual.disponible===1 && actual.stock>0 ? [{producto:actual,cantidad:Math.min(l.cantidad,actual.stock)}] : [];
      }));
    } catch(e){setError(mensajeError(e));} finally{setCargando(false);}
  },[token]);
  useEffect(()=>{void Promise.resolve().then(cargar);},[cargar]);
  const abierta=caja?.caja.estado==="ABIERTA";
  const ocupado=cargando||procesando||cobro;
  const total=carrito.reduce((s,l)=>s+centavos(l.producto.precio)*l.cantidad,0);
  const puedeCobrar=!!token&&abierta&&carrito.length>0&&Number.isSafeInteger(total)&&total>=0&&total<=9999999999;
  function agregar(id:number,cantidad:number){
    if(ocupado)return;
    const p=productos.find(x=>x.id_producto===id);
    if(!p||p.disponible!==1||!Number.isInteger(cantidad)||cantidad<=0)return;
    setCarrito(prev=>{const l=prev.find(x=>x.producto.id_producto===id);const nueva=(l?.cantidad??0)+cantidad;if(nueva>p.stock)return prev;return l?prev.map(x=>x.producto.id_producto===id?{producto:p,cantidad:nueva}:x):[...prev,{producto:p,cantidad}];});
  }
  function cambiar(id:number,cantidad:number){
    if(ocupado||!Number.isInteger(cantidad))return;
    setCarrito(prev=>cantidad<=0?prev.filter(l=>l.producto.id_producto!==id):prev.map(l=>l.producto.id_producto===id&&cantidad<=l.producto.stock&&l.producto.disponible===1?{...l,cantidad}:l));
  }
  function vaciar(){if(!ocupado&&(!carrito.length||window.confirm("¿Vaciar el pedido actual?"))) {setCarrito([]);setMensaje("");}}
  async function confirmar(monto:number){
    if(!token||!puedeCobrar||bloqueo.current||!Number.isFinite(monto)||centavos(monto)<total)return;
    bloqueo.current=true;setProcesando(true);setErrorCobro("");setMensaje("");
    try{
      const resultado=await registrarVenta({productos:carrito.map(l=>({id_producto:l.producto.id_producto,cantidad:l.cantidad})),metodo_pago:"EFECTIVO",monto_recibido:monto},token);
      setCarrito([]);setCobro(false);
      setMensaje(`${resultado.mensaje} Folio: ${resultado.venta.folio}. Total: ${moneda(resultado.venta.total)}. Cambio: ${moneda(resultado.venta.cambio??0)}.`);
      await cargar();
    }catch(e){setErrorCobro(`${mensajeError(e)} Si hubo una falla de conexión, revisa el historial antes de intentar cobrar nuevamente.`);}
    finally{bloqueo.current=false;setProcesando(false);}
  }
  return <div className="space-y-5 text-slate-800">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-bold"><ShoppingCart className="text-frizalia-text"/>Ventas – Punto de Venta</h1><p className="mt-1 text-sm text-slate-500">Selecciona productos, agrega cantidades y realiza el cobro presencial.</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={ocupado} onClick={()=>void cargar()} className="flex items-center gap-2 rounded-xl border border-frizalia-pink bg-white px-3 py-2 text-sm disabled:opacity-40"><RefreshCw size={17} className={cargando?"animate-spin":""}/>Actualizar</button><button type="button" disabled={!token||ocupado} onClick={()=>setHistorial(true)} className="flex items-center gap-2 rounded-xl border border-frizalia-pink bg-white px-3 py-2 text-sm disabled:opacity-40"><History size={17}/>Historial</button><button type="button" disabled={ocupado} onClick={vaciar} className="flex items-center gap-2 rounded-xl bg-frizalia-yellow px-3 py-2 text-sm font-semibold text-frizalia-text disabled:opacity-40"><Plus size={17}/>Nueva venta</button></div></header>
    <p className={`rounded-xl p-3 text-sm font-semibold ${abierta?"bg-emerald-50 text-emerald-800":"bg-amber-50 text-amber-800"}`}>{cargando?"Consultando caja...":error?"No se pudo verificar la caja.":abierta?`Caja #${caja.caja.id_caja} abierta · Cobro en efectivo`:"Caja cerrada. Abre una caja para registrar ventas."}</p>
    {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}{mensaje&&<p role="status" className="break-words rounded-xl bg-emerald-50 p-4 text-emerald-800">{mensaje}</p>}
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]"><CatalogoProductos productos={productos} categorias={categorias} carrito={carrito} bloqueado={ocupado} agregar={agregar}/><CarritoVenta carrito={carrito} total={total} bloqueado={ocupado} puedeCobrar={puedeCobrar} cambiar={cambiar} vaciar={vaciar} cobrar={()=>{setErrorCobro("");setCobro(true);}}/></div>
    {cobro&&<CobrarVentaModal total={total} procesando={procesando} error={errorCobro} cerrar={()=>{if(!procesando)setCobro(false);}} confirmar={monto=>void confirmar(monto)}/>}
    {historial&&token&&<HistorialVentasModal token={token} cerrar={()=>setHistorial(false)}/>}
  </div>;
}
