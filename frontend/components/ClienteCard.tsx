/**
 * Card de Cliente
 * Exibe informações do cliente com checkbox para seleção múltipla
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ICliente } from "../types/cliente";

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
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleToggleSelect = () => {
    onSelect?.(cliente.id_cliente, !isSelected);
  };

  return (
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
        <View style={styles.clienteInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={40} color="#e91e63" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.nome} numberOfLines={1}>
              {cliente.nome}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {cliente.email}
            </Text>
          </View>
        </View>
      </View>

      {/* Informações do cliente */}
      <View style={styles.cardContent}>
        {/* Telefone */}
        <View style={styles.infoRow}>
          <Ionicons name="call" size={14} color="#999" />
          <Text style={styles.infoText}>{cliente.telefone || "N/A"}</Text>
        </View>

        {/* Saldo Devedor */}
        <View style={styles.saldoContainer}>
          <Text style={styles.saldoLabel}>Saldo Devedor</Text>
          <Text
            style={[
              styles.saldoValue,
              cliente.saldo_devedor > 0 && styles.saldoPositivo,
            ]}
          >
            {formatCurrency(cliente.saldo_devedor)}
          </Text>
        </View>
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
  cardSelected: {
    backgroundColor: "#fff3f7",
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
    backgroundColor: "#e91e63",
    borderColor: "#e91e63",
  },
  clienteInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  nome: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  email: {
    fontSize: 12,
    color: "#999",
  },
  cardContent: {
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: "#666",
  },
  saldoContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderLeftWidth: 3,
    borderLeftColor: "#e91e63",
  },
  saldoLabel: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
  saldoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#e91e63",
  },
  saldoPositivo: {
    color: "#e91e63",
  },
});
