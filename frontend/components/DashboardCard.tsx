/**
 * Dashboard Card - Modern & Juicy
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";
import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadows,
  ThemeColors,
} from "../theme";

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
  color,
}) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const effectiveColor = color || colors.primary;
  const isPositive = variation >= 0;

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${effectiveColor}15` },
          ]}
        >
          <Ionicons name={icon} size={22} color={effectiveColor} />
        </View>
        <View style={styles.textContent}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.value, { color: effectiveColor }]}>{value}</Text>
        </View>
        {variation !== 0 && (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isPositive
                  ? colors.successSoft
                  : colors.dangerSoft,
              },
            ]}
          >
            <Ionicons
              name={isPositive ? "trending-up" : "trending-down"}
              size={12}
              color={isPositive ? colors.success : colors.danger}
            />
            <Text
              style={[
                styles.badgeText,
                { color: isPositive ? colors.success : colors.danger },
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

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
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
      color: colors.textTertiary,
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
