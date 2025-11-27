/**
 * Hook customizado para usar AuthContext
 */

import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { IAuthContext } from "../types/auth";

export const useAuth = (): IAuthContext => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }

  return context;
};
