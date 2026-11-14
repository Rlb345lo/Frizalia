
import express from "express";
import cors from "cors";
import "dotenv/config";

import { verificarConexion } from "./config/database.js";
import productosRoutes from "./routes/productos.routes.js";

const app = express();
const PORT = Number(process.env.PORT || 3000);

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta principal
app.get("/", (_req, res) => {
  res.json({
    mensaje: "Bienvenido a la API de Frizalia 🍦",
    estado: "activo",
  });
});

// Rutas de productos
app.use("/api/productos", productosRoutes);

// Iniciar servidor
async function iniciarServidor(): Promise<void> {
  try {
    await verificarConexion();

    app.listen(PORT, () => {
      console.log(
        `🚀 Servidor ejecutándose en http://localhost:${PORT}`
      );
      console.log(
        `🍦 Productos: http://localhost:${PORT}/api/productos`
      );
    });
  } catch (error) {
    console.error("No se pudo iniciar el servidor:", error);
    process.exit(1);
  }
}

void iniciarServidor();
