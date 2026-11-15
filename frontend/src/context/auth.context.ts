import { createContext } from "react";

import type {
  LoginRespuesta,
  UsuarioAutenticado,
} from "../services/auth.service";

export interface AuthContextType {
  usuario: UsuarioAutenticado | null;
  token: string | null;
  autenticado: boolean;
  verificando: boolean;
  errorSesion: string | null;

  guardarSesion: (respuesta: LoginRespuesta, recordarme: boolean) => void;

  cerrarSesion: () => void;
  reintentarVerificacion: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
