
import type { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../config/database.js";
import type { Usuario } from "../types/auth.js";

// Representa un registro obtenido de MySQL
type UsuarioRow = Usuario & RowDataPacket;

// ==========================================
// BUSCAR USUARIO POR CORREO
// ==========================================
export async function buscarUsuarioPorCorreo(
  correo: string
): Promise<Usuario | null> {
  const [rows] = await pool.execute<UsuarioRow[]>(
    `SELECT *
     FROM usuarios
     WHERE correo = ?
     LIMIT 1`,
    [correo]
  );

  return rows[0] ?? null;
}

// ==========================================
// BUSCAR USUARIO POR ID
// ==========================================
export async function buscarUsuarioPorId(
  id: number
): Promise<Usuario | null> {
  const [rows] = await pool.execute<UsuarioRow[]>(
    `SELECT *
     FROM usuarios
     WHERE id_usuario = ?
     LIMIT 1`,
    [id]
  );

  return rows[0] ?? null;
}

// ==========================================
// REGISTRAR NUEVO CLIENTE
// ==========================================
export async function crearCliente(
  nombre: string,
  correo: string,
  passwordHash: string,
  telefono: string | null
): Promise<number> {
  const [resultado] = await pool.execute<ResultSetHeader>(
    `INSERT INTO usuarios
      (nombre, correo, password_hash, telefono, rol)
     VALUES (?, ?, ?, ?, 'CLIENTE')`,
    [nombre, correo, passwordHash, telefono]
  );

  return resultado.insertId;
}
