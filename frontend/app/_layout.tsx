import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";
import { ThemeProvider } from "../context/ThemeContext";
import RootLayoutNav from "./RootLayoutNav";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <SocketProvider>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </SocketProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
