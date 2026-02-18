/**
 * Card de Cliente - Modern & Juicy
 */

import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ICliente } from "../types/cliente";
import { useThemeColors } from "../context/ThemeContext";
import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadows,
  ThemeColors,
} from "../theme";

export interface ClienteCardProps {
  cliente: ICliente;
  isSelected?: boolean;
  onSelect?: (clienteId: number, isSelected: boolean) => void;
  showCheckbox?: boolean;
}

export const ClienteCard: React.FC<ClienteCardProps> = ({
  cliente,
  isSelected = false,
  onSelect,
  showCheckbox = false,
}) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const hasDebt = cliente.saldo_devedor > 0;
  const initial = (cliente.nome || "?").charAt(0).toUpperCase();

  return (
    <View style={[styles.card, isSelected && styles.cardSelected]}>
      <View style={styles.row}>
        {showCheckbox && (
          <TouchableOpacity
            onPress={() => onSelect?.(cliente.id_cliente, !isSelected)}
            style={styles.checkWrap}
          >
            <View
              style={[styles.checkbox, isSelected && styles.checkboxActive]}
            >
              {isSelected && (
                <Ionicons name="checkmark" size={14} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
        )}

        <View style={[styles.avatar, hasDebt && styles.avatarDebt]}>
          <Text style={[styles.avatarText, hasDebt && styles.avatarTextDebt]}>
            {initial}
          </Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {cliente.nome}
          </Text>
          {cliente.email ? (
            <Text style={styles.detail} numberOfLines={1}>
              {cliente.email}
            </Text>
          ) : cliente.telefone ? (
            <Text style={styles.detail}>{cliente.telefone}</Text>
          ) : null}
        </View>

        <View style={styles.saldoBox}>
          <Text style={[styles.saldoValue, hasDebt && styles.saldoDebt]}>
            {formatCurrency(cliente.saldo_devedor)}
          </Text>
          <Text style={styles.saldoLabel}>saldo</Text>
        </View>
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
      marginBottom: Spacing.md,
      ...Shadows.sm,
    },
    cardSelected: {
      backgroundColor: colors.primarySoft,
      borderWidth: 1.5,
      borderColor: colors.primaryLight,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    checkWrap: {
      marginRight: Spacing.md,
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    checkboxActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.background,
      justifyContent: "center",
      alignItems: "center",
      marginRight: Spacing.md,
    },
    avatarDebt: {
      backgroundColor: colors.primarySoft,
    },
    avatarText: {
      fontSize: FontSize.lg,
      fontWeight: FontWeight.bold,
      color: colors.textSecondary,
    },
    avatarTextDebt: {
      color: colors.primary,
    },
    info: {
      flex: 1,
      marginRight: Spacing.md,
    },
    name: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.semibold,
      color: colors.text,
      marginBottom: 2,
    },
    detail: {
      fontSize: FontSize.sm,
      color: colors.textTertiary,
    },
    saldoBox: {
      alignItems: "flex-end",
    },
    saldoValue: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.bold,
      color: colors.textSecondary,
    },
    saldoDebt: {
      color: colors.primary,
    },
    saldoLabel: {
      fontSize: FontSize.xs,
      color: colors.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
  });
