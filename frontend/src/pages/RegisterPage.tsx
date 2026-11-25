import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { Eye, EyeOff } from "lucide-react";
import imagenFrizalia from "../assets/frizalia_paleteria_neveria.png";
import { registrarAdministrador } from "../services/auth.service";

export default function RegisterPage() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [claveRegistro, setClaveRegistro] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);
  const clase = "w-full rounded-2xl border border-frizalia-soft-pink bg-frizalia-cream px-4 py-3 text-sm text-frizalia-text outline-none focus:border-frizalia-pink focus:ring-2 focus:ring-frizalia-pink/30";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (cargando || exito) return;
    setError("");
    if (!nombre.trim()) { setError("Introduce tu nombre."); return; }
    if (password !== confirmacion) { setError("Las contraseñas no coinciden."); return; }
    if (password.length < 8 || new TextEncoder().encode(password).length > 72) {
      setError("La contraseña debe tener al menos 8 caracteres y no superar 72 bytes."); return;
    }
    setCargando(true);
    try {
      await registrarAdministrador({ nombre: nombre.trim(), correo: correo.trim(), telefono: telefono.trim(), password, claveRegistro });
      setPassword(""); setConfirmacion(""); setClaveRegistro(""); setExito(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar la cuenta.");
    } finally { setCargando(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-frizalia-cream px-4 py-8 lg:px-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[30px] bg-white shadow-2xl lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-frizalia-pink lg:block">
          <img src={imagenFrizalia} alt="Frizalia - Paletería y Heladería" className="absolute inset-0 h-full w-full object-cover object-center" />
        </div>
        <div className="flex flex-col justify-center px-6 py-8 sm:px-12 lg:px-14">
          <header className="mb-6 text-center">
            <h1 className="text-4xl font-bold text-frizalia-text">Frizalia</h1>
            <h2 className="mt-4 text-2xl font-bold text-frizalia-text">Crear cuenta administrativa</h2>
            <p className="mt-2 text-sm text-frizalia-muted">Registro exclusivo para personal autorizado.</p>
          </header>
          {exito ? (
            <div role="status" className="space-y-5 text-center">
              <p className="font-semibold text-frizalia-success">Cuenta administrativa creada correctamente.</p>
              <Link to="/login" className="block rounded-2xl bg-frizalia-yellow px-6 py-4 font-semibold text-frizalia-text">Ir a iniciar sesión</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <fieldset disabled={cargando} className="space-y-4 disabled:opacity-70">
                <label className="block text-sm font-medium text-frizalia-text">Nombre completo
                  <input className={clase} required maxLength={100} autoComplete="name" value={nombre} onChange={e => setNombre(e.target.value)} />
                </label>
                <label className="block text-sm font-medium text-frizalia-text">Correo electrónico
                  <input className={clase} required type="email" maxLength={150} autoComplete="email" value={correo} onChange={e => setCorreo(e.target.value)} />
                </label>
                <label className="block text-sm font-medium text-frizalia-text">Teléfono (opcional)
                  <input className={clase} type="tel" maxLength={20} autoComplete="tel" value={telefono} onChange={e => setTelefono(e.target.value)} />
                </label>
                <div>
                  <label htmlFor="registro-password" className="text-sm font-medium text-frizalia-text">Contraseña</label>
                  <div className="relative">
                    <input id="registro-password" className={clase + " pr-12"} required minLength={8} type={mostrar ? "text" : "password"} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} />
                    <button type="button" onClick={() => setMostrar(!mostrar)} aria-label={mostrar ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={mostrar} className="absolute right-4 top-3 text-frizalia-muted">{mostrar ? <EyeOff size={20} /> : <Eye size={20} />}</button>
                  </div>
                </div>
                <label className="block text-sm font-medium text-frizalia-text">Confirmar contraseña
                  <input className={clase} required type={mostrar ? "text" : "password"} autoComplete="new-password" value={confirmacion} onChange={e => setConfirmacion(e.target.value)} />
                </label>
                <label className="block text-sm font-medium text-frizalia-text">Clave de autorización administrativa
                  <input className={clase} required type="password" maxLength={256} autoComplete="off" value={claveRegistro} onChange={e => setClaveRegistro(e.target.value)} />
                </label>
                <p className="text-xs text-frizalia-muted">Solicita la clave al responsable del sistema.</p>
                {error && <p role="alert" className="rounded-xl bg-frizalia-danger/10 p-3 text-sm text-frizalia-danger">{error}</p>}
                <button type="submit" disabled={cargando} className="w-full rounded-2xl bg-frizalia-yellow px-6 py-4 font-semibold text-frizalia-text hover:brightness-95 disabled:opacity-60">{cargando ? "Registrando..." : "Crear cuenta"}</button>
              </fieldset>
            </form>
          )}
          {!exito && <p className="mt-6 text-center text-sm text-frizalia-muted">¿Ya tienes cuenta? <Link to="/login" className="font-semibold text-frizalia-danger hover:underline">Iniciar sesión</Link></p>}
        </div>
      </div>
    </main>
  );
}
