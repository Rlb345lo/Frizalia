
import mysql from "mysql2/promise";
import "dotenv/config";

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function verificarConexion(): Promise<void> {
  try {
    const conexion = await pool.getConnection();

    console.log("✅ Conexión con MySQL establecida");
    conexion.release();
  } catch (error) {
    console.error("❌ Error al conectar con MySQL:", error);
    throw error;
  }
}
