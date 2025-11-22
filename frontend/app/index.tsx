import { useAuth } from "../context/auth.context";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

/**
 * Página raiz - redireciona com base no estado de autenticação
 */
export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();

  // Enquanto carrega a sessão, mostra um loading
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Se autenticado, vai para home (tabs)
  // Se não autenticado, vai para login
  return isAuthenticated ? (
    <Redirect href="/(tabs)" />
  ) : (
    <Redirect href="/login" />
  );
}
