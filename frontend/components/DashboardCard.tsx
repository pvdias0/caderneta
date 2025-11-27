/**
 * Componente de Card do Dashboard
 * Exibe um estatístico com ícone, título, valor e variação
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  variation?: number; // percentual de variação (+ ou -)
  color?: string; // cor do ícone e borda
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  variation = 0,
  color = "#e91e63",
}) => {
  const isPositive = variation >= 0;
  const trendIcon = isPositive ? "trending-up" : "trending-down";
  const trendColor = isPositive ? "#4caf50" : "#f44336";

  return (
    <View style={[styles.card, { borderLeftColor: color }]}>
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon} size={24} color={color} />
        </View>
        {variation !== 0 && (
          <View style={styles.trendContainer}>
            <Ionicons name={trendIcon} size={16} color={trendColor} />
            <Text style={[styles.trendText, { color: trendColor }]}>
              {isPositive ? "+" : ""}
              {variation}%
            </Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600",
  },
  content: {
    gap: 4,
  },
  title: {
    fontSize: 14,
    color: "#999",
    fontWeight: "500",
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
});
