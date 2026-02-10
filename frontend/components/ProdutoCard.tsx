/**
 * Card de Produto - Modern & Juicy
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IProduto } from "../types/produto";
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from "../theme";

export interface ProdutoCardProps {
  produto: IProduto;
  isSelected?: boolean;
  onSelect?: (produtoId: number, isSelected: boolean) => void;
  showCheckbox?: boolean;
  onEdit?: (produto: IProduto) => void;
}

export const ProdutoCard: React.FC<ProdutoCardProps> = ({
  produto,
  isSelected = false,
  onSelect,
  showCheckbox = false,
  onEdit,
}) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const lowStock = produto.quantidade_estoque <= 5;

  return (
    <TouchableOpacity
      onPress={showCheckbox ? () => onSelect?.(produto.id_produto, !isSelected) : undefined}
      activeOpacity={showCheckbox ? 0.7 : 1}
    >
      <View style={[styles.card, isSelected && styles.cardSelected]}>
        <View style={styles.row}>
          {showCheckbox && (
            <TouchableOpacity
              onPress={() => onSelect?.(produto.id_produto, !isSelected)}
              style={styles.checkWrap}
            >
              <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.iconCircle}>
            <Ionicons name="cube" size={22} color={Colors.warning} />
          </View>

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {produto.nome}
            </Text>
            <Text style={styles.price}>{formatCurrency(produto.valor_produto)}</Text>
          </View>

          {!showCheckbox && (
            <TouchableOpacity
              onPress={() => onEdit?.(produto)}
              style={styles.editBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="pencil-outline" size={18} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Stock badge */}
        <View style={[styles.stockRow, lowStock && styles.stockRowLow]}>
          <View style={styles.stockBadge}>
            <View
              style={[
                styles.stockDot,
                { backgroundColor: lowStock ? Colors.danger : Colors.success },
              ]}
            />
            <Text style={styles.stockLabel}>
              {lowStock ? "Estoque baixo" : "Em estoque"}
            </Text>
          </View>
          <Text style={[styles.stockValue, lowStock && { color: Colors.danger }]}>
            {produto.quantidade_estoque} un.
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardSelected: {
    backgroundColor: Colors.warningSoft,
    borderWidth: 1.5,
    borderColor: Colors.warning,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  checkWrap: {
    marginRight: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.warningSoft,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  price: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.warning,
  },
  editBtn: {
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
  },
  stockRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.successSoft,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  stockRowLow: {
    backgroundColor: Colors.dangerSoft,
  },
  stockBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stockLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
  },
  stockValue: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.success,
  },
});
