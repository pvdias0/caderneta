/**
 * Card de Movimento (Compra/Pagamento) - Modern & Juicy
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IMovimento } from "../types/movimento";
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from "../theme";

export interface MovimentoCardProps {
  movimento: IMovimento;
  onEdit?: (movimento: IMovimento) => void;
  onDelete?: (movimento: IMovimento) => void;
}

export const MovimentoCard: React.FC<MovimentoCardProps> = ({
  movimento,
  onEdit,
  onDelete,
}) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(dateString));
  };

  const isCompra = movimento.tipo === "COMPRA";
  const typeColor = isCompra ? Colors.danger : Colors.success;
  const typeBg = isCompra ? Colors.dangerSoft : Colors.successSoft;
  const typeLabel = isCompra ? "Compra" : "Pagamento";
  const typeIcon = isCompra ? "cart" : "cash";

  const handleDelete = () => {
    Alert.alert(
      `Deletar ${typeLabel}`,
      `Tem certeza que deseja deletar este ${typeLabel.toLowerCase()}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Deletar",
          style: "destructive",
          onPress: () => onDelete?.(movimento),
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.typeRow}>
          <View style={[styles.typeBadge, { backgroundColor: typeBg }]}>
            <Ionicons name={typeIcon as any} size={14} color={typeColor} />
            <Text style={[styles.typeText, { color: typeColor }]}>{typeLabel}</Text>
          </View>
          <Text style={styles.dateText}>{formatDate(movimento.data_movimento)}</Text>
        </View>

        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity onPress={() => onEdit(movimento)} style={styles.actionBtn}>
              <Ionicons name="create-outline" size={16} color={Colors.info} />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={16} color={Colors.danger} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Value */}
      <View style={styles.valueRow}>
        <Text style={styles.valueLabel}>Valor</Text>
        <Text style={[styles.valueAmount, { color: typeColor }]}>
          {isCompra ? "- " : "+ "}
          {formatCurrency(movimento.valor)}
        </Text>
      </View>

      {/* Items */}
      {isCompra && movimento.itens && movimento.itens.length > 0 && (
        <View style={styles.itemsBox}>
          {movimento.itens.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemName} numberOfLines={1}>
                {item.nome_produto || `Produto ${item.id_produto}`}
              </Text>
              <Text style={styles.itemQty}>
                {Math.round(item.quantidade)} x {formatCurrency(item.valor_unitario)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  typeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  typeText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
  },
  dateText: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  actionBtn: {
    padding: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
  },
  valueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  valueLabel: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
  valueAmount: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  itemsBox: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    marginRight: Spacing.md,
  },
  itemQty: {
    fontSize: FontSize.sm,
    color: Colors.textTertiary,
    fontWeight: FontWeight.medium,
  },
});
