import express from "express";
import cors from "cors";
import "dotenv/config";

import { verificarConexion } from "./config/database.js";

// ==========================================
// IMPORTACION DE RUTAS
// ==========================================

import productosRoutes from "./routes/productos.routes.js";
import authRoutes from "./routes/auth.routes.js";
import solicitudesRoutes from "./routes/solicitudes.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import categoriasRoutes from "./routes/categorias.routes.js";
import movimientosInventarioRoutes from "./routes/movimientosInventario.routes.js";
import cajaRoutes from "./routes/caja.routes.js";
import ventasRoutes from "./routes/ventas.routes.js";
import reportesRoutes from "./routes/reportes.routes.js";

// ==========================================
// CONFIGURACION DEL SERVIDOR
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
// RUTAS DE AUTENTICACION
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
// sus middlewares de autenticacion.

app.use("/api/dashboard", dashboardRoutes);

// ==========================================
// RUTAS DE CATEGORIAS
// ==========================================

app.use("/api/categorias", categoriasRoutes);

// ==========================================
// RUTAS DE MOVIMIENTOS DE INVENTARIO
// ==========================================

// Permite:
// GET  /api/movimientos-inventario
// GET  /api/movimientos-inventario/producto/:id
// POST /api/movimientos-inventario

app.use("/api/movimientos-inventario", movimientosInventarioRoutes);

// ==========================================
// RUTAS DEL MODULO DE CAJA
// ==========================================

// Permite:
// GET  /api/caja/actual
// GET  /api/caja/historial
// POST /api/caja/abrir
// POST /api/caja/:id/cerrar
// GET  /api/caja/:id/resumen

app.use("/api/caja", cajaRoutes);

// ==========================================
// RUTAS DEL MODULO DE VENTAS
// ==========================================

// POST /api/ventas
// GET  /api/ventas
// GET  /api/ventas/:id

// Todas las rutas de Ventas requieren
// un token JWT valido.

app.use("/api/ventas", ventasRoutes);

// ==========================================
// INICIAR SERVIDOR
// ==========================================

app.use("/api/reportes", reportesRoutes);

async function iniciarServidor(): Promise<void> {
  try {
    // ======================================
    // VALIDAR CONFIGURACION JWT
    // ======================================

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET no esta configurado correctamente en .env");
    }

    // ======================================
    // VERIFICAR CONEXION CON MYSQL
    // ======================================

    await verificarConexion();

    // ======================================
    // INICIAR SERVIDOR EXPRESS
    // ======================================

    app.listen(PORT, () => {
      console.log(`🚀 Servidor ejecutandose en http://localhost:${PORT}`);

      console.log(`🍦 Productos: http://localhost:${PORT}/api/productos`);

      console.log(`🔹 Categorias: http://localhost:${PORT}/api/categorias`);

      console.log(
        `🔹 Categorias activas: http://localhost:${PORT}/api/categorias/activas`,
      );

      console.log(
        `📋 Movimientos: http://localhost:${PORT}/api/movimientos-inventario`,
      );

      console.log(
        `📦 Historial por producto: http://localhost:${PORT}/api/movimientos-inventario/producto/7`,
      );

      // ====================================
      // ENDPOINTS DE CAJA
      // ====================================

      console.log("");
      console.log("========== MODULO DE CAJA ==========");

      console.log(
        `💰 Caja actual: GET http://localhost:${PORT}/api/caja/actual`,
      );

      console.log(
        `📜 Historial: GET http://localhost:${PORT}/api/caja/historial`,
      );

      console.log(`🔓 Apertura: POST http://localhost:${PORT}/api/caja/abrir`);

      console.log(
        `🔒 Cierre: POST http://localhost:${PORT}/api/caja/:id/cerrar`,
      );

      console.log(
        `📊 Resumen: GET http://localhost:${PORT}/api/caja/:id/resumen`,
      );

      console.log("====================================");

      // ====================================
      // ENDPOINTS DE VENTAS
      // ====================================

      console.log("");
      console.log("========= MODULO DE VENTAS =========");

      console.log(
        `🛒 Registrar venta: POST http://localhost:${PORT}/api/ventas`,
      );

      console.log(`📜 Historial: GET http://localhost:${PORT}/api/ventas`);

      console.log(`🧾 Detalle: GET http://localhost:${PORT}/api/ventas/:id`);

      console.log("====================================");
    });
  } catch (error) {
    console.error("No se pudo iniciar el servidor:", error);

    process.exit(1);
  }
}

void iniciarServidor();
