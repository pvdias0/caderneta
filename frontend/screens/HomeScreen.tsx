/**
 * Tela Inicial - Home / Dashboard
 * Modern & Juicy design with gradient header and animated cards
 */

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  StatusBar,
  Platform,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { apiService } from "../services/api";
import { DashboardCard } from "../components/DashboardCard";
import { IDashboardStats } from "../types/dashboard";
import { useRealtimeUpdates } from "../hooks/useRealtimeUpdates";
import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadows,
  ThemeColors,
} from "../theme";
import { useTheme, useThemeColors } from "../context/ThemeContext";
import { SwipeableTabView } from "../components/SwipeableTabView";

export const HomeScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [dashboardData, setDashboardData] = useState<IDashboardStats | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDashboardStats();
      setDashboardData({
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
      });
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSaldoAtualizado = () => loadDashboardData();
  useRealtimeUpdates(user?.id || null, handleSaldoAtualizado);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (value: number | undefined | null): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(Number(value) || 0);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <SwipeableTabView>
      <View style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.primaryDark}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {/* Gradient Profile Header */}
          <LinearGradient
            colors={[...colors.gradientPrimary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <Animated.View style={[styles.profileRow, { opacity: fadeAnim }]}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {(user?.nome_usuario || "U").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.greetingContainer}>
                <Text style={styles.greetingText}>{getGreeting()} 👋</Text>
                <Text style={styles.userName}>
                  {user?.nome_usuario || "Usuário"}
                </Text>
              </View>
              {/* Theme Toggle */}
              <TouchableOpacity
                onPress={toggleTheme}
                style={styles.headerBtn}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isDark ? "sunny" : "moon"}
                  size={22}
                  color="#fff"
                />
              </TouchableOpacity>
              {/* Logout */}
              <TouchableOpacity
                onPress={() => {
                  Alert.alert("Sair", "Deseja sair da aplicação?", [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Sair",
                      style: "destructive",
                      onPress: async () => {
                        try {
                          await logout();
                        } catch {
                          Alert.alert("Erro", "Erro ao fazer logout");
                        }
                      },
                    },
                  ]);
                }}
                style={styles.headerBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="log-out-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </Animated.View>

            {/* Main Stat Card */}
            {dashboardData && (
              <Animated.View
                style={[
                  styles.mainStatCard,
                  { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
              >
                <Text style={styles.mainStatLabel}>Total a Receber</Text>
                <Text style={styles.mainStatValue}>
                  {formatCurrency(dashboardData.totalAReceber)}
                </Text>
                {dashboardData.variacao?.totalAReceber !== 0 && (
                  <View style={styles.variationBadge}>
                    <Ionicons
                      name={
                        dashboardData.variacao.totalAReceber >= 0
                          ? "trending-up"
                          : "trending-down"
                      }
                      size={14}
                      color={
                        dashboardData.variacao.totalAReceber >= 0
                          ? colors.success
                          : colors.danger
                      }
                    />
                    <Text
                      style={[
                        styles.variationText,
                        {
                          color:
                            dashboardData.variacao.totalAReceber >= 0
                              ? colors.success
                              : colors.danger,
                        },
                      ]}
                    >
                      {dashboardData.variacao.totalAReceber >= 0 ? "+" : ""}
                      {dashboardData.variacao.totalAReceber}% este mês
                    </Text>
                  </View>
                )}
              </Animated.View>
            )}
          </LinearGradient>

          {/* Dashboard Cards */}
          <View style={styles.cardsSection}>
            <Text style={styles.sectionTitle}>Visão Geral</Text>

            {loading && !dashboardData ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Carregando dados...</Text>
              </View>
            ) : dashboardData ? (
              <View style={styles.cardsGrid}>
                <DashboardCard
                  title="Clientes Ativos"
                  value={dashboardData.clientesAtivos}
                  icon="people"
                  variation={dashboardData.variacao?.clientesAtivos}
                  color={colors.info}
                />
                <DashboardCard
                  title="Vendas no Mês"
                  value={formatCurrency(dashboardData.vendasMes)}
                  icon="cart"
                  variation={dashboardData.variacao?.vendasMes}
                  color={colors.success}
                />
                <DashboardCard
                  title="Ticket Médio"
                  value={formatCurrency(dashboardData.ticketMedio)}
                  icon="analytics"
                  variation={dashboardData.variacao?.ticketMedio}
                  color={colors.warning}
                />
              </View>
            ) : (
              <View style={styles.emptyBox}>
                <Ionicons
                  name="analytics-outline"
                  size={48}
                  color={colors.border}
                />
                <Text style={styles.emptyText}>Nenhum dado disponível</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SwipeableTabView>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: Platform.OS === "ios" ? 60 : 48,
      paddingBottom: Spacing.xxxl,
      paddingHorizontal: Spacing.xl,
      borderBottomLeftRadius: BorderRadius.xxl,
      borderBottomRightRadius: BorderRadius.xxl,
    },
    profileRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.xxl,
    },
    avatarCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: "rgba(255,255,255,0.25)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: Spacing.lg,
    },
    avatarText: {
      fontSize: FontSize.xl,
      fontWeight: FontWeight.bold,
      color: colors.textInverse,
    },
    greetingContainer: {
      flex: 1,
    },
    greetingText: {
      fontSize: FontSize.sm,
      color: "rgba(255,255,255,0.8)",
      marginBottom: 2,
    },
    userName: {
      fontSize: FontSize.xl,
      fontWeight: FontWeight.bold,
      color: colors.textInverse,
    },
    headerBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
      marginLeft: Spacing.sm,
    },
    mainStatCard: {
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: BorderRadius.lg,
      padding: Spacing.xl,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.2)",
    },
    mainStatLabel: {
      fontSize: FontSize.sm,
      color: "rgba(255,255,255,0.8)",
      fontWeight: FontWeight.medium,
      marginBottom: Spacing.xs,
    },
    mainStatValue: {
      fontSize: FontSize.xxxl,
      fontWeight: FontWeight.heavy,
      color: colors.textInverse,
      letterSpacing: -0.5,
    },
    variationBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      marginTop: Spacing.sm,
      backgroundColor: "rgba(255,255,255,0.9)",
      borderRadius: BorderRadius.full,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.xs,
      alignSelf: "flex-start",
    },
    variationText: {
      fontSize: FontSize.xs,
      fontWeight: FontWeight.semibold,
    },
    cardsSection: {
      padding: Spacing.xl,
      paddingBottom: 120,
    },
    sectionTitle: {
      fontSize: FontSize.lg,
      fontWeight: FontWeight.bold,
      color: colors.text,
      marginBottom: Spacing.lg,
    },
    cardsGrid: {
      gap: Spacing.md,
    },
    loadingBox: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Spacing.huge,
    },
    loadingText: {
      fontSize: FontSize.sm,
      color: colors.textTertiary,
      marginTop: Spacing.md,
    },
    emptyBox: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Spacing.huge,
    },
    emptyText: {
      fontSize: FontSize.md,
      color: colors.textTertiary,
      marginTop: Spacing.md,
    },
  });
