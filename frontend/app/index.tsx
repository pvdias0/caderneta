import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { View, ActivityIndicator } from "react-native";

/**
 * Index page - redireciona para login ou clientes baseado em autenticação
 */
export default function Index() {
  const router = useRouter();
  const { isSignedIn, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isSignedIn) {
        // Redirecionar para home (primeira aba)
        router.replace("/(tabs)/home");
      } else {
        // Redirecionar para login
        router.replace("/(auth)/login");
      }
    }
  }, [isSignedIn, isLoading, router]);

  // Mostrar loading enquanto verifica autenticação
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#e91e63" />
    </View>
  );
}
