/**
 * Tela Inicial - Home
 * Exibe informações do usuário, estatísticas do dashboard e opção para mudar senha
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";
import { DashboardCard } from "../components/DashboardCard";
import { IDashboardStats } from "../types/dashboard";
import { useRealtimeUpdates } from "../hooks/useRealtimeUpdates";

export const HomeScreen: React.FC = () => {
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState<IDashboardStats | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [expandedDashboard, setExpandedDashboard] = useState(false);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDashboardStats();

      // Garantir que todos os valores são números válidos
      const validatedData = {
        totalAReceber: Number(data?.totalAReceber) || 0,
        clientesAtivos: Number(data?.clientesAtivos) || 0,
        vendasMes: Number(data?.vendasMes) || 0,
        ticketMedio: Number(data?.ticketMedio) || 0,
        variacao: {
          totalAReceber: Number(data?.variacao?.totalAReceber) || 0,
          clientesAtivos: Number(data?.variacao?.clientesAtivos) || 0,
          vendasMes: Number(data?.variacao?.vendasMes) || 0,
          ticketMedio: Number(data?.variacao?.ticketMedio) || 0,
        },
      };

      setDashboardData(validatedData);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados do dashboard");
    } finally {
      setLoading(false);
    }
  };

  // Callback para atualizar dashboard quando saldo muda
  const handleSaldoAtualizado = () => {
    // Recarregar dados do dashboard quando saldo de cliente mudar
    loadDashboardData();
  };

  // Usar hook para escutar atualizações em tempo real
  useRealtimeUpdates(user?.id || null, handleSaldoAtualizado);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatCurrency = (value: number | undefined | null): string => {
    const numValue = Number(value) || 0;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Seção de Perfil do Usuário */}
      <View style={styles.profileSection}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={60} color="#e91e63" />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {user?.nome_usuario || "Usuário"}
            </Text>
            <Text style={styles.userEmail}>{user?.email || ""}</Text>
          </View>
        </View>
      </View>

      {/* Seção de Dashboard - Expansível */}
      <View style={styles.dashboardSection}>
        <TouchableOpacity
          style={styles.dashboardHeader}
          onPress={() => setExpandedDashboard(!expandedDashboard)}
          activeOpacity={0.7}
        >
          <View style={styles.dashboardTitleContainer}>
            <Ionicons name="bar-chart" size={20} color="#e91e63" />
            <Text style={styles.dashboardTitle}>Dashboard</Text>
          </View>
          <Ionicons
            name={expandedDashboard ? "chevron-up" : "chevron-down"}
            size={24}
            color="#666"
          />
        </TouchableOpacity>

        {expandedDashboard && (
          <View style={styles.dashboardContent}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#e91e63" />
                <Text style={styles.loadingText}>Carregando...</Text>
              </View>
            ) : dashboardData ? (
              <>
                <DashboardCard
                  title="Total a Receber"
                  value={formatCurrency(dashboardData.totalAReceber)}
                  icon="cash"
                  variation={dashboardData.variacao?.totalAReceber}
                  color="#e91e63"
                />
                <DashboardCard
                  title="Clientes Ativos"
                  value={dashboardData.clientesAtivos}
                  icon="people"
                  variation={dashboardData.variacao?.clientesAtivos}
                  color="#2196f3"
                />
                <DashboardCard
                  title="Vendas no Mês"
                  value={formatCurrency(dashboardData.vendasMes)}
                  icon="trending-up"
                  variation={dashboardData.variacao?.vendasMes}
                  color="#4caf50"
                />
                <DashboardCard
                  title="Ticket Médio"
                  value={formatCurrency(dashboardData.ticketMedio)}
                  icon="calculator"
                  variation={dashboardData.variacao?.ticketMedio}
                  color="#ff9800"
                />
              </>
            ) : (
              <Text style={styles.errorText}>
                Não foi possível carregar os dados
              </Text>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  profileSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#999",
  },
  dashboardSection: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dashboardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  dashboardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dashboardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  dashboardContent: {
    padding: 16,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#999",
  },
  errorText: {
    textAlign: "center",
    color: "#f44336",
    fontSize: 14,
    paddingVertical: 20,
  },
});
