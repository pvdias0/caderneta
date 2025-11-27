/**
 * Card de Produto
 * Exibe informações do produto com checkbox para seleção múltipla
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IProduto } from "../types/produto";

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

  const handleToggleSelect = () => {
    onSelect?.(produto.id_produto, !isSelected);
  };

  const estoqueBaixo = produto.quantidade_estoque <= 5;

  return (
    <TouchableOpacity
      onPress={showCheckbox ? handleToggleSelect : undefined}
      activeOpacity={showCheckbox ? 0.7 : 1}
    >
      <View style={[styles.card, isSelected && styles.cardSelected]}>
        {/* Header com nome e checkbox */}
        <View style={styles.cardHeader}>
          {showCheckbox && (
            <TouchableOpacity
              onPress={handleToggleSelect}
              style={styles.checkboxContainer}
            >
              <View
                style={[styles.checkbox, isSelected && styles.checkboxChecked]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          )}
          <View style={styles.produtoInfo}>
            <View style={styles.iconContainer}>
              <Ionicons name="cube" size={40} color="#ff9800" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.nome} numberOfLines={1}>
                {produto.nome}
              </Text>
              <Text style={styles.valor}>
                {formatCurrency(produto.valor_produto)}
              </Text>
            </View>
          </View>
          {!showCheckbox && (
            <TouchableOpacity
              onPress={() => onEdit?.(produto)}
              style={styles.editButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="pencil" size={20} color="#ff9800" />
            </TouchableOpacity>
          )}
        </View>

        {/* Informações do produto */}
        <View style={styles.cardContent}>
          {/* Quantidade em Estoque */}
          <View
            style={[
              styles.estoqueContainer,
              estoqueBaixo && styles.estoqueBaixoContainer,
            ]}
          >
            <View style={styles.estoqueInfo}>
              <Ionicons
                name={estoqueBaixo ? "alert-circle" : "checkmark-circle"}
                size={16}
                color={estoqueBaixo ? "#f44336" : "#4caf50"}
              />
              <Text style={styles.estoqueLabel}>
                {estoqueBaixo ? "Estoque baixo" : "Estoque"}
              </Text>
            </View>
            <Text
              style={[
                styles.estoqueValue,
                estoqueBaixo && styles.estoqueBaixoValue,
              ]}
            >
              {produto.quantidade_estoque} un.
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#ff9800",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    backgroundColor: "#fff8f0",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 12,
  },
  checkboxContainer: {
    padding: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#ff9800",
    borderColor: "#ff9800",
  },
  produtoInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  editButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  nome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  valor: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ff9800",
  },
  cardContent: {
    gap: 8,
  },
  estoqueContainer: {
    backgroundColor: "#f0f7f4",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: "#4caf50",
  },
  estoqueBaixoContainer: {
    backgroundColor: "#fef5f5",
    borderLeftColor: "#f44336",
  },
  estoqueInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  estoqueLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  estoqueValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4caf50",
  },
  estoqueBaixoValue: {
    color: "#f44336",
  },
});
