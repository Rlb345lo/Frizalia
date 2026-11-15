import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  ErrorHTTP,
  obtenerPerfil,
  tieneAccesoAdministrativo,
} from "../services/auth.service";

import type {
  LoginRespuesta,
  UsuarioAutenticado,
} from "../services/auth.service";

import { AuthContext } from "./auth.context";

// ==========================================
// TIPOS Y CONSTANTES
// ==========================================

interface Sesion {
  token: string;
  usuario: UsuarioAutenticado;
}

const CLAVE_SESION = "frizalia_sesion";

// ==========================================
// ALMACENAMIENTO
// ==========================================

function limpiarAlmacenamiento() {
  localStorage.removeItem(CLAVE_SESION);
  sessionStorage.removeItem(CLAVE_SESION);
}

function obtenerSesionGuardada(): Sesion | null {
  try {
    const texto =
      localStorage.getItem(CLAVE_SESION) ??
      sessionStorage.getItem(CLAVE_SESION);

    if (!texto) return null;

    const datos: unknown = JSON.parse(texto);

    if (
      typeof datos !== "object" ||
      datos === null ||
      !("token" in datos) ||
      typeof datos.token !== "string" ||
      !("usuario" in datos) ||
      typeof datos.usuario !== "object" ||
      datos.usuario === null
    ) {
      limpiarAlmacenamiento();
      return null;
    }

    return datos as Sesion;
  } catch {
    limpiarAlmacenamiento();
    return null;
  }
}

// ==========================================
// PROVEEDOR DE AUTENTICACIÓN
// ==========================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sesion, setSesion] = useState<Sesion | null>(obtenerSesionGuardada);

  const [verificando, setVerificando] = useState(
    () => obtenerSesionGuardada() !== null,
  );

  const [errorSesion, setErrorSesion] = useState<string | null>(null);

  // Identificador de la verificación vigente.
  // Evita que una respuesta antigua sobrescriba
  // una sesión recién iniciada.
  const versionSesion = useRef(0);

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  const cerrarSesion = useCallback(() => {
    // Invalidar verificaciones anteriores
    versionSesion.current += 1;

    limpiarAlmacenamiento();

    setSesion(null);
    setErrorSesion(null);
    setVerificando(false);
  }, []);

  // ==========================================
  // VERIFICAR SESIÓN GUARDADA
  // ==========================================

  const verificarSesion = useCallback(async () => {
    const versionActual = ++versionSesion.current;

    const guardada = obtenerSesionGuardada();

    // No existe una sesión guardada
    if (!guardada) {
      setSesion(null);
      setErrorSesion(null);
      setVerificando(false);
      return;
    }

    setVerificando(true);
    setErrorSesion(null);

    try {
      // Consultar el perfil en el backend
      const usuario = await obtenerPerfil(guardada.token);

      // Ignorar respuestas de verificaciones antiguas
      if (versionActual !== versionSesion.current) {
        return;
      }

      // Comprobar permisos administrativos
      if (!tieneAccesoAdministrativo(usuario)) {
        cerrarSesion();
        return;
      }

      // Actualizar los datos de la sesión
      const sesionActualizada: Sesion = {
        token: guardada.token,
        usuario,
      };

      // Conservar el almacenamiento original
      if (localStorage.getItem(CLAVE_SESION)) {
        localStorage.setItem(CLAVE_SESION, JSON.stringify(sesionActualizada));
      } else {
        sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesionActualizada));
      }

      setSesion(sesionActualizada);
    } catch (error) {
      // Ignorar errores de verificaciones antiguas
      if (versionActual !== versionSesion.current) {
        return;
      }

      // ======================================
      // ERROR 401: TOKEN INVÁLIDO O EXPIRADO
      // ======================================

      if (error instanceof ErrorHTTP && error.status === 401) {
        limpiarAlmacenamiento();

        setSesion(null);
        setErrorSesion(null);

        return;
      }

      // ======================================
      // OTROS ERRORES
      // ======================================

      const mensaje =
        error instanceof Error
          ? error.message
          : "No se pudo verificar la sesión.";

      // No eliminar el token almacenado:
      // podría tratarse de un error temporal.
      setSesion(null);
      setErrorSesion(mensaje);
    } finally {
      // Finalizar únicamente la verificación vigente
      if (versionActual === versionSesion.current) {
        setVerificando(false);
      }
    }
  }, [cerrarSesion]);

  // ==========================================
  // VERIFICACIÓN INICIAL
  // ==========================================

  useEffect(() => {
    // Ejecutar la verificación de forma asíncrona
    // para evitar actualizaciones síncronas
    // de estado dentro del efecto.
    const iniciarVerificacion = async () => {
      await Promise.resolve();
      await verificarSesion();
    };

    void iniciarVerificacion();

    return () => {
      // Invalidar verificaciones pendientes
      // cuando se limpie el efecto.
      versionSesion.current += 1;
    };
  }, [verificarSesion]);

  // ==========================================
  // GUARDAR SESIÓN
  // ==========================================

  function guardarSesion(respuesta: LoginRespuesta, recordarme: boolean) {
    // Verificar acceso administrativo
    if (!tieneAccesoAdministrativo(respuesta.usuario)) {
      throw new Error("Esta cuenta no tiene acceso administrativo.");
    }

    // Invalidar verificaciones anteriores
    versionSesion.current += 1;

    const nuevaSesion: Sesion = {
      token: respuesta.token,
      usuario: respuesta.usuario,
    };

    // Limpiar sesiones anteriores
    limpiarAlmacenamiento();

    // Elegir dónde guardar la sesión
    const almacenamiento = recordarme ? localStorage : sessionStorage;

    almacenamiento.setItem(CLAVE_SESION, JSON.stringify(nuevaSesion));

    // Actualizar el contexto
    setSesion(nuevaSesion);
    setErrorSesion(null);
    setVerificando(false);
  }

  // ==========================================
  // CONTEXTO
  // ==========================================

  return (
    <AuthContext.Provider
      value={{
        usuario:
          !verificando && !errorSesion ? (sesion?.usuario ?? null) : null,

        token: !verificando && !errorSesion ? (sesion?.token ?? null) : null,

        autenticado: sesion !== null && !verificando && !errorSesion,

        verificando,
        errorSesion,
        guardarSesion,
        cerrarSesion,
        reintentarVerificacion: verificarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
