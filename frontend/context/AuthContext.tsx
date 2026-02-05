/**
 * AuthContext - Gerencia autenticação global da aplicação
 */

import React, {
  createContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import { IAuthContext, IUser } from "../types/auth";
import { apiService } from "../services/api";

interface AuthState {
  user: IUser | null;
  isLoading: boolean;
  isSignedIn: boolean;
  error: string | null;
}

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: IUser }
  | { type: "LOGIN_ERROR"; payload: string }
  | { type: "REGISTER_START" }
  | { type: "REGISTER_SUCCESS"; payload: IUser }
  | { type: "REGISTER_ERROR"; payload: string }
  | { type: "LOGOUT" }
  | { type: "RESTORE_TOKEN"; payload: IUser | null }
  | { type: "CLEAR_ERROR" };

const initialState: AuthState = {
  user: null,
  isLoading: true,
  isSignedIn: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        isSignedIn: true,
        error: null,
      };
    case "LOGIN_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case "REGISTER_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "REGISTER_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isLoading: false,
        isSignedIn: true,
        error: null,
      };
    case "REGISTER_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    case "LOGOUT":
      return {
        ...state,
        user: null,
        isSignedIn: false,
        isLoading: false,
      };
    case "RESTORE_TOKEN":
      return {
        ...state,
        user: action.payload,
        isSignedIn: action.payload !== null,
        isLoading: false,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

export const AuthContext = createContext<IAuthContext>({
  user: null,
  isLoading: true,
  isSignedIn: false,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  clearError: () => {},
});

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  /**
   * Restaura a sessão ao iniciar o app (se há token armazenado)
   */
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        await apiService.initialize();
        const token = apiService.getAccessToken();

        if (token) {
          // Tentar obter dados do usuário
          const response = await apiService.getMe();
          if (response.user) {
            dispatch({ type: "RESTORE_TOKEN", payload: response.user });
          }
        } else {
          dispatch({ type: "RESTORE_TOKEN", payload: null });
        }
      } catch (error) {
        console.error("Erro ao restaurar token:", error);
        dispatch({ type: "RESTORE_TOKEN", payload: null });
      }
    };

    bootstrapAsync();
  }, []);

  /**
   * Login
   */
  const login = useCallback(async (email: string, senha: string) => {
    dispatch({ type: "LOGIN_START" });

    try {
      const response = await apiService.login(email, senha);

      // Armazenar tokens
      await apiService.setTokens(
        response.tokens.accessToken,
        response.tokens.refreshToken
      );

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: response.user,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao fazer login";
      dispatch({ type: "LOGIN_ERROR", payload: errorMessage });
      throw error;
    }
  }, []);

  /**
   * Registro
   */
  const register = useCallback(
    async (nome_usuario: string, email: string, senha: string) => {
      dispatch({ type: "REGISTER_START" });

      try {
        await apiService.register(nome_usuario, email, senha);

        // Não autentica automaticamente após registro
        // Usuário precisa fazer login - volta para LOGIN
        dispatch({
          type: "RESTORE_TOKEN",
          payload: null,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Erro ao registrar";
        dispatch({ type: "REGISTER_ERROR", payload: errorMessage });
        throw error;
      }
    },
    []
  );

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      console.log("🚪 Iniciando logout...");
      await apiService.logout();
      console.log("✅ Logout realizado com sucesso");
    } catch (error) {
      console.error("❌ Erro ao fazer logout:", error);
    } finally {
      console.log("📤 Limpando estado de autenticação");
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const value: IAuthContext = {
    user: state.user,
    isLoading: state.isLoading,
    isSignedIn: state.isSignedIn,
    error: state.error,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
