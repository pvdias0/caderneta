/**
 * Dashboard Card - Modern & Juicy
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from "../theme";

export interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  variation?: number;
  color?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon,
  variation = 0,
  color = Colors.primary,
}) => {
  const isPositive = variation >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <View style={styles.textContent}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.value, { color }]}>{value}</Text>
        </View>
        {variation !== 0 && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isPositive ? Colors.successSoft : Colors.dangerSoft,
              },
            ]}
          >
            <Ionicons
              name={isPositive ? "trending-up" : "trending-down"}
              size={12}
              color={isPositive ? Colors.success : Colors.danger}
            />
            <Text
              style={[
                styles.badgeText,
                { color: isPositive ? Colors.success : Colors.danger },
              ]}
            >
              {isPositive ? "+" : ""}
              {variation}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.lg,
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  value: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
});
