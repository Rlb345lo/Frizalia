import { useEffect, useRef, type ReactNode } from "react";
import { boton } from "./utilidades";
export default function ModalSolicitud({ titulo, ocupado = false, cerrar, children }: { titulo: string; ocupado?: boolean; cerrar: () => void; children: ReactNode }) {
 const ref = useRef<HTMLDialogElement>(null);
 useEffect(()=>{ const d=ref.current; d?.showModal(); return ()=>{d?.close();}; },[]);
 return <dialog ref={ref} aria-label={titulo} onCancel={e=>{e.preventDefault(); if(!ocupado) cerrar();}} className="m-auto max-h-[90vh] w-[min(94vw,36rem)] overflow-y-auto rounded-2xl bg-white p-5 text-frizalia-text shadow-xl backdrop:bg-slate-950/50"><header className="mb-4 flex items-center justify-between gap-3"><h2 className="text-xl font-bold">{titulo}</h2><button className={boton} disabled={ocupado} onClick={cerrar} aria-label="Cerrar modal">Cerrar</button></header>{children}</dialog>;
}
