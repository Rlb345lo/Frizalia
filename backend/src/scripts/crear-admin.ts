import "dotenv/config";
import bcrypt from "bcrypt";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { pool } from "../config/database.js";

// ==========================================
// CREAR PRIMER ADMINISTRADOR DE FRIZALIA
// ==========================================

async function crearAdministrador(): Promise<void> {
  const rl = createInterface({
    input: stdin,
    output: stdout,
  });

  try {
    // Verificar que no exista un administrador.
    const [administradores] = await pool.execute<
      import("mysql2").RowDataPacket[]
    >(
      `SELECT id_usuario
       FROM usuarios
       WHERE rol = 'ADMINISTRADOR'
       LIMIT 1`,
    );

    if (administradores.length > 0) {
      console.log("Ya existe un administrador. No se creará otra cuenta.");
      return;
    }

    console.log("\n=== Primer administrador de Frizalia ===\n");

    const nombre = (await rl.question("Nombre: ")).trim();

    const correo = (await rl.question("Correo electrónico: "))
      .trim()
      .toLowerCase();

    const password = await rl.question("Contraseña: ");

    if (!nombre || nombre.length > 100) {
      throw new Error("Nombre no válido.");
    }

    if (correo.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      throw new Error("Correo electrónico no válido.");
    }

    if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) {
      throw new Error(
        "La contraseña debe tener al menos 8 caracteres y no superar 72 bytes.",
      );
    }

    // Comprobar si el correo ya está registrado.
    const [usuarios] = await pool.execute<import("mysql2").RowDataPacket[]>(
      `SELECT id_usuario
       FROM usuarios
       WHERE correo = ?
       LIMIT 1`,
      [correo],
    );

    if (usuarios.length > 0) {
      throw new Error("El correo ya pertenece a una cuenta existente.");
    }

    // Proteger la contraseña.
    const passwordHash = await bcrypt.hash(password, 12);

    // Crear administrador.
    const [resultado] = await pool.execute<import("mysql2").ResultSetHeader>(
      `INSERT INTO usuarios
        (nombre, correo, password_hash, telefono, rol, activo)
       VALUES (?, ?, ?, NULL, 'ADMINISTRADOR', 1)`,
      [nombre, correo, passwordHash],
    );

    console.log("\nAdministrador creado correctamente.");
    console.log(`ID: ${resultado.insertId}`);
    console.log(`Nombre: ${nombre}`);
    console.log(`Correo: ${correo}`);
    console.log("Rol: ADMINISTRADOR");
  } finally {
    rl.close();
    await pool.end();
  }
}

crearAdministrador().catch((error: unknown) => {
  console.error(
    error instanceof Error
      ? error.message
      : "No se pudo crear el administrador.",
  );

  process.exitCode = 1;
});
