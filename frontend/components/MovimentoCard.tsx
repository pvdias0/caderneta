/**
 * Card de Movimento (Compra/Pagamento)
 * Exibe informações do movimento com opções de editar e deletar
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IMovimento } from "../types/movimento";

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
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const isCompra = movimento.tipo === "COMPRA";
  const iColor = isCompra ? "#f44336" : "#4caf50";
  const typeLabel = isCompra ? "Compra" : "Pagamento";

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
      {/* Header: tipo e data */}
      <View style={styles.cardHeader}>
        <View style={styles.typeContainer}>
          <View style={[styles.typeIcon, { backgroundColor: iColor }]}>
            <Ionicons
              name={isCompra ? "cart" : "cash"}
              size={16}
              color="#fff"
            />
          </View>
          <View>
            <Text style={styles.typeLabel}>{typeLabel}</Text>
            <Text style={styles.dateText}>
              {formatDate(movimento.data_movimento)}
            </Text>
          </View>
        </View>

        {/* Botões de ação */}
        <View style={styles.actionButtons}>
          {onEdit && (
            <TouchableOpacity
              onPress={() => onEdit(movimento)}
              style={styles.actionButton}
            >
              <Ionicons name="pencil" size={18} color="#1976d2" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.actionButton}
            >
              <Ionicons name="trash" size={18} color="#f44336" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Detalhes */}
      <View style={styles.cardContent}>
        {/* Valor */}
        <View style={styles.valueRow}>
          <Text style={styles.valueLabel}>Valor</Text>
          <Text style={[styles.valueAmount, { color: iColor }]}>
            {formatCurrency(movimento.valor)}
          </Text>
        </View>

        {/* Itens da compra (se houver) */}
        {isCompra && movimento.itens && movimento.itens.length > 0 && (
          <View style={styles.itensContainer}>
            <Text style={styles.itensTitle}>
              {movimento.itens.length} item
              {movimento.itens.length !== 1 ? "ns" : ""}
            </Text>
            {movimento.itens.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <Text style={styles.itemText} numberOfLines={1}>
                  • {item.nome_produto || `Produto ${item.id_produto}`}
                </Text>
                <Text style={styles.itemText}>
                  {item.quantidade}x {formatCurrency(item.valor_unitario)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#e91e63",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    color: "#999",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f5f5f5",
  },
  cardContent: {
    gap: 12,
  },
  valueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  valueLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  valueAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
  itensContainer: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: "#ff9800",
  },
  itensTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    gap: 8,
  },
  itemText: {
    fontSize: 12,
    color: "#666",
  },
});
