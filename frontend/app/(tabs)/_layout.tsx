import React from "react";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../hooks/useAuth";
import { TouchableOpacity, Alert } from "react-native";

export default function TabLayout() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert("Logout", "Deseja sair da aplicação?", [
      {
        text: "Cancelar",
        onPress: () => {},
        style: "cancel",
      },
      {
        text: "Sair",
        onPress: async () => {
          try {
            await logout();
          } catch {
            Alert.alert("Erro", "Erro ao fazer logout");
          }
        },
        style: "destructive",
      },
    ]);
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#e91e63",
        tabBarInactiveTintColor: "#999",
        headerShown: true,
        headerStyle: {
          backgroundColor: "#f5f5f5",
        },
        headerTitleStyle: {
          fontWeight: "600",
        },
        headerRight: () => (
          <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
            <Ionicons name="log-out" size={24} color="#e91e63" />
          </TouchableOpacity>
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          title: "Clientes",
          tabBarIcon: ({ color }) => (
            <Ionicons name="people" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="produtos"
        options={{
          title: "Produtos",
          tabBarIcon: ({ color }) => (
            <Ionicons name="cube" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
