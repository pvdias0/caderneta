import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { apiService, LoginResponse } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Interface do contexto de autenticação
 */
export interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    nome_usuario: string,
    email: string,
    senha: string
  ) => Promise<void>;
  error: string | null;
}

/**
 * Criar contexto de autenticação
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provider de autenticação
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Restaurar sessão ao montar o componente
   */
  useEffect(() => {
    restoreSession();
  }, []);

  /**
   * Restaurar sessão do AsyncStorage
   */
  const restoreSession = async () => {
    try {
      setIsLoading(true);
      const accessToken = await AsyncStorage.getItem("accessToken");
      const refreshToken = await AsyncStorage.getItem("refreshToken");
      const userData = await AsyncStorage.getItem("user");

      if (accessToken && refreshToken) {
        apiService.setTokens(accessToken, refreshToken);

        if (userData) {
          setUser(JSON.parse(userData));
        }
      }
    } catch (error) {
      console.error("❌ Erro ao restaurar sessão:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fazer login
   */
  const login = async (email: string, senha: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.login(email, senha);

      if (response.status !== 200 || !response.data) {
        throw new Error(response.error || "Erro ao fazer login");
      }

      // Armazenar tokens
      const { tokens, user: userData } = response.data;
      await AsyncStorage.setItem("accessToken", tokens.accessToken);
      await AsyncStorage.setItem("refreshToken", tokens.refreshToken);
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      setUser(userData);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fazer logout
   */
  const logout = async () => {
    try {
      setIsLoading(true);
      await apiService.logout();
      await AsyncStorage.removeItem("accessToken");
      await AsyncStorage.removeItem("refreshToken");
      await AsyncStorage.removeItem("user");
      setUser(null);
      apiService.clearTokens();
    } catch (err) {
      console.error("❌ Erro ao fazer logout:", err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Registrar novo usuário
   */
  const register = async (
    nome_usuario: string,
    email: string,
    senha: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await apiService.register(nome_usuario, email, senha);

      if (response.status !== 201 && response.status !== 200) {
        throw new Error(response.error || "Erro ao registrar");
      }

      // ✅ Registro bem-sucedido - usuário precisa fazer login manualmente
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        logout,
        register,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para usar o contexto de autenticação
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return context;
}
