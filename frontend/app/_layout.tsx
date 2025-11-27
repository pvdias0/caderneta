import React from "react";
import { AuthProvider } from "../context/AuthContext";
import { SocketProvider } from "../context/SocketContext";
import RootLayoutNav from "./RootLayoutNav";

export default function RootLayout() {
  return (
    <SocketProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SocketProvider>
  );
}
