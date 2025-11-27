/**
 * ProtectedRoute - Componente que protege rotas autenticadas
 * Redireciona para login se o usuário não está autenticado
 */

import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { ActivityIndicator, View } from "react-native";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const router = useRouter();
  const { isSignedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      router.replace("/(auth)/login");
    }
  }, [isSignedIn, isLoading, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#e91e63" />
      </View>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return <>{children}</>;
};
