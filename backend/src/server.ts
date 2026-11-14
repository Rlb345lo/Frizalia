
import express from "express";
import cors from "cors";
import "dotenv/config";

import { verificarConexion } from "./config/database.js";
import productosRoutes from "./routes/productos.routes.js";
import authRoutes from "./routes/auth.routes.js";
import solicitudesRoutes from "./routes/solicitudes.routes.js";

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

// Crear solicitudes de pedidos para recoger en local
app.use("/api/solicitudes", solicitudesRoutes);

// ==========================================
// INICIAR SERVIDOR
// ==========================================

async function iniciarServidor(): Promise<void> {
  try {
    // Comprobar que JWT_SECRET esté configurado
    if (
      !process.env.JWT_SECRET ||
      process.env.JWT_SECRET.length < 32
    ) {
      throw new Error(
        "JWT_SECRET no está configurado correctamente en .env"
      );
    }

    // Verificar conexión con MySQL
    await verificarConexion();

    // Iniciar servidor Express
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
