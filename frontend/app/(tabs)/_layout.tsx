import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

/**
 * Layout das abas de navegação
 */
export default function TabsLayout() {
  const colors = {
    tint: '#007AFF',
    background: '#ffffff',
    tabIconDefault: '#ccc',
    text: '#1a1a1a',
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.tabIconDefault,
          borderTopWidth: 1,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={28}
              name={focused ? 'home' : 'home-outline'}
              color={color}
            />
          ),
          headerTitle: 'Caderneta - Home',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              size={28}
              name={focused ? 'search' : 'search-outline'}
              color={color}
            />
          ),
          headerTitle: 'Explore',
        }}
      />
    </Tabs>
  );
}
