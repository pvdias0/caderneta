import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useAuth } from "../../context/auth.context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";
import apiService from "../../services/api";

/**
 * Página de Home/Dashboard
 */
export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [totalAReceber, setTotalAReceber] = useState<number>(0);
  const [loadingTotal, setLoadingTotal] = useState(false);

  const carregarTotalAReceber = useCallback(async () => {
    try {
      setLoadingTotal(true);
      console.log("🔄 Carregando total a receber...");
      const response = await apiService.getTotalAReceberGeral();
      console.log("✅ Response:", response);
      if (response.status === 200 && response.data) {
        // O backend retorna: { data: { total_a_receber: 11 }, success: true }
        const totalData = (response.data as any)?.data || response.data;
        const total = parseFloat(String(totalData.total_a_receber || 0));
        console.log("💰 Total carregado:", total);
        setTotalAReceber(total);
      } else {
        console.log("⚠️ Status não é 200 ou dados vazios:", response);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar total a receber:", error);
    } finally {
      setLoadingTotal(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarTotalAReceber();
    }, [carregarTotalAReceber])
  );

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login" as any);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Overlay para fechar dropdown ao clicar fora */}
      {showProfileMenu && (
        <Pressable
          style={styles.overlay}
          onPress={() => setShowProfileMenu(false)}
        />
      )}

      {/* Custom Header */}
      <View style={styles.customHeader}>
        <Text style={styles.headerTitle}>📘 Caderneta </Text>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => setShowProfileMenu(!showProfileMenu)}
        >
          <Ionicons name="person-circle" size={32} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Profile Dropdown Menu */}
      {showProfileMenu && (
        <View style={styles.profileDropdown}>
          <View style={styles.profileDropdownContent}>
            <Text style={styles.dropdownLabel}>Perfil do Usuário</Text>
            <View style={styles.dropdownDivider} />
            <View style={styles.profileInfo}>
              <Text style={styles.profileLabel}>Nome:</Text>
              <Text style={styles.profileValue}>
                {user?.nome_usuario || "N/A"}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileLabel}>Email:</Text>
              <Text style={styles.profileValue}>{user?.email || "N/A"}</Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButtonDropdown}
              onPress={() => {
                handleLogout();
                setShowProfileMenu(false);
              }}
            >
              <Ionicons name="log-out" size={18} color="#fff" />
              <Text style={styles.logoutButtonDropdownText}>Sair da Conta</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Bem-vindo!</Text>
          <Text style={styles.welcomeSubtitle}>
            Selecione uma opção para continuar
          </Text>
        </View>

        {/* Total a Receber Card */}
        <View style={styles.receivableCard}>
          <Text style={styles.receivableLabel}>Total a Receber</Text>
          {loadingTotal ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <Text style={styles.receivableAmount}>
              R$ {totalAReceber.toFixed(2).replace(".", ",")}
            </Text>
          )}
        </View>

        {/* Quick Actions - Only 2 options */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ações Rápidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/clientes" as any)}
            >
              <Text style={styles.actionButtonText}>👥</Text>
              <Text style={styles.actionButtonLabel}>Clientes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push("/estoque" as any)}
            >
              <Text style={styles.actionButtonText}>📦</Text>
              <Text style={styles.actionButtonLabel}>Estoque</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
