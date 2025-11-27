import React from "react";
import { Stack } from "expo-router";

export default function ClientesStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen
        name="[id]"
        options={({ route }: any) => ({
          title: route.params?.clienteName || "Detalhes do Cliente",
          headerShown: false,
          headerStyle: {
            backgroundColor: "#f5f5f5",
          },
          headerTitleStyle: {
            fontWeight: "600",
          },
          headerTintColor: "#e91e63",
        })}
      />
    </Stack>
  );
}
