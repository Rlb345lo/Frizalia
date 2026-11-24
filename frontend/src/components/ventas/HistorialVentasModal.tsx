import { useEffect, useState } from "react";
import { obtenerHistorialVentas, obtenerVentaPorId } from "../../services/ventasApi";
import type { HistorialVentas, VentaConDetalles } from "../../types/ventas";
import { fecha, moneda, mensajeError } from "./utilidades";
import DetalleVentaModal from "./DetalleVentaModal";
interface Props { token: string; cerrar: () => void }
export default function HistorialVentasModal({token,cerrar}: Props) {
  const [historial,setHistorial]=useState<HistorialVentas|null>(null);
  const [detalle,setDetalle]=useState<VentaConDetalles|null>(null);
  const [error,setError]=useState("");
  const [consultando,setConsultando]=useState(false);
  useEffect(()=>{let activo=true; void obtenerHistorialVentas(token).then(d=>{if(activo)setHistorial(d);}).catch(e=>{if(activo)setError(mensajeError(e));});return()=>{activo=false;};},[token]);
  async function consultar(id:number){setConsultando(true);setError("");try{setDetalle(await obtenerVentaPorId(id,token));}catch(e){setError(mensajeError(e));}finally{setConsultando(false);}}
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><section role="dialog" aria-modal="true" aria-label="Historial de ventas" className="max-h-[90vh] w-full max-w-4xl space-y-4 overflow-auto rounded-2xl bg-white p-6"><div className="flex justify-between gap-2"><h2 className="text-xl font-bold">Historial de ventas {historial?`(${historial.total})`:""}</h2><button type="button" onClick={cerrar} className="text-frizalia-text">Cerrar</button></div>{error&&<p role="alert" className="text-red-700">{error}</p>}{!historial&&!error&&<p>Cargando ventas...</p>}{historial?.ventas.length===0&&<p>No hay ventas registradas.</p>}<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-frizalia-soft-pink"><tr>{["Folio","Fecha","Total","Método","Acción"].map(t=><th key={t} className="p-3">{t}</th>)}</tr></thead><tbody>{historial?.ventas.map(v=><tr key={v.id_venta} className="border-b border-slate-100"><td className="p-3">{v.folio}</td><td className="p-3">{fecha(v.fecha_venta)}</td><td className="p-3">{moneda(v.total)}</td><td className="p-3">{v.metodo_pago}</td><td className="p-3"><button type="button" disabled={consultando} onClick={()=>void consultar(v.id_venta)} className="font-semibold text-frizalia-text disabled:opacity-40">Ver detalle</button></td></tr>)}</tbody></table></div></section>{detalle&&<DetalleVentaModal datos={detalle} cerrar={()=>setDetalle(null)}/>}</div>;
}
