import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";

import { Mail, LockKeyhole, Eye, EyeOff } from "lucide-react";

import imagenFrizalia from "../assets/frizalia_paleteria_neveria.png";

import {
  iniciarSesion,
  tieneAccesoAdministrativo,
} from "../services/auth.service";

import { useAuth } from "../hooks/useAuth";

// ==========================================
// PÁGINA DE INICIO DE SESIÓN
// ==========================================

export default function LoginPage() {
  const navigate = useNavigate();
  const { guardarSesion } = useAuth();

  // ==========================================
  // ESTADOS DEL FORMULARIO
  // ==========================================

  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");

  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const [recordarme, setRecordarme] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  // ==========================================
  // INICIAR SESIÓN
  // ==========================================

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (cargando) return;

    setError("");
    setCargando(true);

    try {
      // Enviar credenciales al backend
      const respuesta = await iniciarSesion({
        correo,
        password: contrasena,
      });

      // Verificar acceso administrativo
      if (!tieneAccesoAdministrativo(respuesta.usuario)) {
        setError(
          "Esta aplicación es exclusiva para administradores y empleados.",
        );
        return;
      }

      // Guardar token y usuario en AuthContext
      guardarSesion(respuesta, recordarme);

      // Limpiar contraseña
      setContrasena("");

      // Navegar al Dashboard
      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al iniciar sesión.",
      );
    } finally {
      setCargando(false);
    }
  }

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <main className="flex min-h-screen items-center justify-center bg-frizalia-cream px-4 py-8 lg:px-8">
      {/* ======================================
          CONTENEDOR PRINCIPAL
      ====================================== */}

      <div className="grid w-full max-w-6xl overflow-hidden rounded-[30px] bg-white shadow-2xl lg:min-h-[650px] lg:grid-cols-2">
        {/* ======================================
            PANEL IZQUIERDO - FRIZALIA
        ====================================== */}

        <div className="relative hidden overflow-hidden bg-frizalia-pink lg:block">
          <img
            src={imagenFrizalia}
            alt="Frizalia - Paletería y Heladería"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
        </div>

        {/* ======================================
            PANEL DERECHO - FORMULARIO
        ====================================== */}

        <div className="flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-14">
          {/* ENCABEZADO */}
          <div className="mb-9 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-frizalia-text sm:text-5xl">
              Frizalia
            </h1>

            <h2 className="mt-8 text-2xl font-bold text-frizalia-text sm:text-3xl">
              Iniciar sesión
            </h2>

            <p className="mt-2 text-sm text-frizalia-muted sm:text-base">
              Accede al sistema administrativo
            </p>
          </div>

          {/* ======================================
              FORMULARIO
          ====================================== */}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* CORREO ELECTRÓNICO */}
            <div>
              <label
                htmlFor="correo"
                className="mb-2 block text-sm font-medium text-frizalia-text"
              >
                Correo electrónico
              </label>

              <div className="flex items-center rounded-2xl border border-frizalia-soft-pink bg-frizalia-cream px-4 transition focus-within:border-frizalia-pink focus-within:ring-2 focus-within:ring-frizalia-pink/30">
                <Mail
                  size={20}
                  strokeWidth={1.8}
                  aria-hidden="true"
                  className="mr-3 shrink-0 text-frizalia-muted"
                />

                <input
                  id="correo"
                  type="email"
                  required
                  autoComplete="email"
                  value={correo}
                  onChange={(event) => setCorreo(event.target.value)}
                  placeholder="Correo electrónico"
                  disabled={cargando}
                  className="w-full min-w-0 bg-transparent py-4 text-sm text-frizalia-text outline-none placeholder:text-frizalia-muted disabled:opacity-60"
                />
              </div>
            </div>

            {/* CONTRASEÑA */}
            <div>
              <label
                htmlFor="contrasena"
                className="mb-2 block text-sm font-medium text-frizalia-text"
              >
                Contraseña
              </label>

              <div className="flex items-center rounded-2xl border border-frizalia-soft-pink bg-frizalia-cream px-4 transition focus-within:border-frizalia-pink focus-within:ring-2 focus-within:ring-frizalia-pink/30">
                <LockKeyhole
                  size={20}
                  strokeWidth={1.8}
                  aria-hidden="true"
                  className="mr-3 shrink-0 text-frizalia-muted"
                />

                <input
                  id="contrasena"
                  type={mostrarContrasena ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={contrasena}
                  onChange={(event) => setContrasena(event.target.value)}
                  placeholder="Contraseña"
                  disabled={cargando}
                  className="w-full min-w-0 bg-transparent py-4 text-sm text-frizalia-text outline-none placeholder:text-frizalia-muted disabled:opacity-60"
                />

                {/* MOSTRAR / OCULTAR CONTRASEÑA */}
                <button
                  type="button"
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                  aria-label={
                    mostrarContrasena
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  aria-pressed={mostrarContrasena}
                  className="ml-2 flex shrink-0 items-center justify-center text-frizalia-muted transition hover:text-frizalia-text"
                >
                  {mostrarContrasena ? (
                    <EyeOff size={20} strokeWidth={1.8} />
                  ) : (
                    <Eye size={20} strokeWidth={1.8} />
                  )}
                </button>
              </div>
            </div>

            {/* ======================================
                RECORDARME Y RECUPERAR
            ====================================== */}

            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-frizalia-text">
                <input
                  type="checkbox"
                  checked={recordarme}
                  onChange={(event) => setRecordarme(event.target.checked)}
                  className="h-4 w-4 accent-frizalia-pink"
                />
                Recordarme
              </label>

              <Link
                to="/recuperar-contrasena"
                className="font-medium text-frizalia-danger transition hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {/* ======================================
                MENSAJES DE ERROR
            ====================================== */}

            {error && (
              <div
                role="alert"
                className="rounded-2xl border border-frizalia-danger/30 bg-frizalia-danger/10 px-4 py-3 text-sm text-frizalia-danger"
              >
                {error}
              </div>
            )}

            {/* ======================================
                BOTÓN INICIAR SESIÓN
            ====================================== */}

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-2xl bg-frizalia-yellow px-6 py-4 font-semibold text-frizalia-text shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {cargando ? "Verificando credenciales..." : "Iniciar sesión"}
            </button>
          </form>

          {/* ======================================
              REGISTRARSE
          ====================================== */}

          <p className="mt-7 text-center text-sm text-frizalia-muted">
            ¿No tienes una cuenta?{" "}
            <Link
              to="/registro"
              className="font-semibold text-frizalia-danger transition hover:underline"
            >
              Registrarse
            </Link>
          </p>

          {/* ======================================
              PIE DE PÁGINA
          ====================================== */}

          <div className="mt-9 border-t border-frizalia-soft-pink pt-6 text-center">
            <Link
              to="/terminos"
              className="text-sm text-frizalia-muted underline transition hover:text-frizalia-text"
            >
              Términos y condiciones
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
