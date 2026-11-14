
export type RolUsuario =
  | "CLIENTE"
  | "EMPLEADO"
  | "ADMINISTRADOR";

// Representa un usuario almacenado en MySQL
export interface Usuario {
  id_usuario: number;
  nombre: string;
  correo: string;
  password_hash: string;
  telefono: string | null;
  rol: RolUsuario;
  activo: number;
  fecha_registro: Date | null;
}

// Datos necesarios para registrar un cliente
export interface RegistroUsuario {
  nombre: string;
  correo: string;
  password: string;
  telefono?: string | null;
}

// Datos necesarios para iniciar sesión
export interface LoginUsuario {
  correo: string;
  password: string;
}

// Información que podemos devolver al cliente
export interface UsuarioPublico {
  id_usuario: number;
  nombre: string;
  correo: string;
  telefono: string | null;
  rol: RolUsuario;
}

// Excluye la contraseña protegida de la respuesta
export function usuarioPublico(
  usuario: Usuario
): UsuarioPublico {
  return {
    id_usuario: usuario.id_usuario,
    nombre: usuario.nombre,
    correo: usuario.correo,
    telefono: usuario.telefono,
    rol: usuario.rol,
  };
}
