import type { ReactNode } from "react";

import Sidebar from "./Sidebar";
import Header from "./Header";

// ==========================================
// PROPIEDADES DEL COMPONENTE
// ==========================================

interface AdminLayoutProps {
  children: ReactNode;
}

// ==========================================
// COMPONENTE ADMIN LAYOUT
// ==========================================

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-frizalia-cream">
      {/* ======================================
          SIDEBAR
      ====================================== */}

      <Sidebar />

      {/* ======================================
          CONTENEDOR PRINCIPAL
      ====================================== */}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* HEADER */}
        <Header />

        {/* CONTENIDO DINÁMICO */}
        <main className="min-h-0 flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
