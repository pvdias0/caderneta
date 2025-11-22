import { Tabs } from "expo-router";

/**
 * Layout das abas de navegação - Apenas Home (sem bottom tab bar)
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { display: "none" }, // Remover bottom tab bar
        headerShown: false, // Custom header na página home
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // Esconder esta aba
        }}
      />
      <Tabs.Screen
        name="clientes"
        options={{
          href: null, // Protegida por rota condicional, não mostrar em abas
        }}
      />
      <Tabs.Screen
        name="estoque"
        options={{
          href: null, // Protegida por rota condicional, não mostrar em abas
        }}
      />
    </Tabs>
  );
}
