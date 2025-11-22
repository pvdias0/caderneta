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
    </Tabs>
  );
}
