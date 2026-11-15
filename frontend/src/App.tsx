import { Navigate, Route, Routes } from "react-router";
import type { ReactNode } from "react";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import InventarioPage from "./pages/InventarioPage";

import AdminLayout from "./components/layout/AdminLayout";
import { useAuth } from "./hooks/useAuth";

// ==========================================
// PROPIEDADES DE RUTA PROTEGIDA
// ==========================================

interface RutaProtegidaProps {
  children: ReactNode;
}

// ==========================================
// RUTA PROTEGIDA
// ==========================================

function RutaProtegida({ children }: RutaProtegidaProps) {
  const { autenticado, verificando, errorSesion, reintentarVerificacion } =
    useAuth();

  // VERIFICANDO SESIÓN
  if (verificando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-frizalia-cream">
        <p className="text-frizalia-muted">Verificando sesión...</p>
      </main>
    );
  }

  // ERROR DE VERIFICACIÓN
  if (errorSesion) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-frizalia-cream px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-lg">
          <h2 className="text-xl font-bold text-frizalia-text">
            No se pudo verificar la sesión
          </h2>

          <p className="mt-3 text-sm text-frizalia-muted">{errorSesion}</p>

          <button
            type="button"
            onClick={() => {
              void reintentarVerificacion();
            }}
            className="mt-6 rounded-xl bg-frizalia-yellow px-6 py-3 font-semibold text-frizalia-text"
          >
            Reintentar
          </button>
        </div>
      </main>
    );
  }

  // USUARIO SIN SESIÓN
  if (!autenticado) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// ==========================================
// APLICACIÓN
// ==========================================

function App() {
  return (
    <Routes>
      {/* RUTA INICIAL */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* LOGIN */}
      <Route path="/login" element={<LoginPage />} />

      {/* DASHBOARD ADMINISTRATIVO */}
      <Route
        path="/dashboard"
        element={
          <RutaProtegida>
            <AdminLayout>
              <DashboardPage />
            </AdminLayout>
          </RutaProtegida>
        }
      />

      {/* INVENTARIO */}
      <Route
        path="/inventario"
        element={
          <RutaProtegida>
            <AdminLayout>
              <InventarioPage />
            </AdminLayout>
          </RutaProtegida>
        }
      />

      {/* RUTAS DESCONOCIDAS */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
