
import express from "express";
import cors from "cors";
import "dotenv/config";

import { verificarConexion } from "./config/database.js";

// ==========================================
// IMPORTACIÓN DE RUTAS
// ==========================================

import productosRoutes from "./routes/productos.routes.js";
import authRoutes from "./routes/auth.routes.js";
import solicitudesRoutes from "./routes/solicitudes.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import categoriasRoutes from "./routes/categorias.routes.js";
import movimientosInventarioRoutes from "./routes/movimientosInventario.routes.js";

// ==========================================
// CONFIGURACIÓN DEL SERVIDOR
// ==========================================

const app = express();
const PORT = Number(process.env.PORT || 3000);

// ==========================================
// MIDDLEWARES GENERALES
// ==========================================

// Permitir solicitudes desde React y Flutter
app.use(cors());

// Permitir recibir datos en formato JSON
app.use(express.json({ limit: "20kb" }));

// ==========================================
// RUTA PRINCIPAL
// ==========================================

app.get("/", (_req, res) => {
  res.json({
    mensaje: "Bienvenido a la API de Frizalia 🍦",
    estado: "activo",
  });
});

// ==========================================
// RUTAS DE PRODUCTOS
// ==========================================

app.use("/api/productos", productosRoutes);

// ==========================================
// RUTAS DE AUTENTICACIÓN
// ==========================================

app.use("/api/auth", authRoutes);

// ==========================================
// RUTAS DE SOLICITUDES
// ==========================================

app.use("/api/solicitudes", solicitudesRoutes);

// ==========================================
// RUTAS DEL DASHBOARD
// ==========================================

// El router del Dashboard ya contiene
// sus middlewares de autenticación.
app.use("/api/dashboard", dashboardRoutes);

// ==========================================
// RUTAS DE CATEGORÍAS
// ==========================================

app.use("/api/categorias", categoriasRoutes);

// ==========================================
// RUTAS DE MOVIMIENTOS DE INVENTARIO
// ==========================================

// Permite:
// GET  /api/movimientos-inventario
// GET  /api/movimientos-inventario/producto/:id
// POST /api/movimientos-inventario

// Las rutas están protegidas con JWT
// y permisos de administrador.

app.use(
  "/api/movimientos-inventario",
  movimientosInventarioRoutes
);

// ==========================================
// INICIAR SERVIDOR
// ==========================================

async function iniciarServidor(): Promise<void> {
  try {
    // ======================================
    // VALIDAR CONFIGURACIÓN JWT
    // ======================================

    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32
    ) {
      throw new Error(
        "JWT_SECRET no está configurado correctamente en .env"
      );
    }

    // ======================================
    // VERIFICAR CONEXIÓN CON MYSQL
    // ======================================

    await verificarConexion();

    // ======================================
    // INICIAR SERVIDOR EXPRESS
    // ======================================

    app.listen(PORT, () => {
      console.log(
        `🚀 Servidor ejecutándose en http://localhost:${PORT}`
      );

      console.log(
        `🍦 Productos: http://localhost:${PORT}/api/productos`
      );

      console.log(
        `🔐 Autenticación: http://localhost:${PORT}/api/auth`
      );

      console.log(
        `📦 Solicitudes: http://localhost:${PORT}/api/solicitudes`
      );

      console.log(
        `📊 Dashboard: http://localhost:${PORT}/api/dashboard/resumen`
      );

      console.log(
        `🏷️ Categorías: http://localhost:${PORT}/api/categorias`
      );

      console.log(
        `🏷️ Categorías activas: http://localhost:${PORT}/api/categorias/activas`
      );

      console.log(
        `📋 Movimientos: http://localhost:${PORT}/api/movimientos-inventario`
      );

      console.log(
        `📦 Historial por producto: http://localhost:${PORT}/api/movimientos-inventario/producto/7`
      );
    });
  } catch (error) {
    console.error(
      "No se pudo iniciar el servidor:",
      error
    );

    process.exit(1);
  }
}

void iniciarServidor();
