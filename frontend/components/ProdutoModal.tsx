/**
 * Modal para criar/editar produtos
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiService } from "../services/api";
import { IProduto } from "../types/produto";

interface ProdutoModalProps {
  visible: boolean;
  produto?: IProduto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProdutoModal: React.FC<ProdutoModalProps> = ({
  visible,
  produto,
  onClose,
  onSuccess,
}) => {
  const [nome, setNome] = useState("");
  const [valor, setValor] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [loading, setLoading] = useState(false);

  const formatPrice = (text: string): string => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, "");

    if (numbers.length === 0) return "";

    // Converte para número e divide por 100 para pegar centavos
    const num = parseInt(numbers, 10);
    const integerPart = Math.floor(num / 100);
    const decimalPart = num % 100;

    // Formata com separador de milhares e vírgula
    const formatted = integerPart
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const withDecimals = `${formatted},${decimalPart
      .toString()
      .padStart(2, "0")}`;

    return withDecimals;
  };

  const handlePriceChange = (text: string) => {
    const formatted = formatPrice(text);
    setValor(formatted);
  };

  useEffect(() => {
    if (produto) {
      setNome(produto.nome);
      setValor(formatPrice(produto.valor_produto.toString()));
      setQuantidade(produto.quantidade_estoque.toString());
    } else {
      setNome("");
      setValor("");
      setQuantidade("");
    }
  }, [produto, visible]);

  const validateForm = (): boolean => {
    if (!nome.trim()) {
      Alert.alert("Erro", "Nome do produto é obrigatório");
      return false;
    }

    if (!valor.trim()) {
      Alert.alert("Erro", "Valor do produto é obrigatório");
      return false;
    }

    if (!quantidade.trim()) {
      Alert.alert("Erro", "Quantidade em estoque é obrigatória");
      return false;
    }

    const valorNum = parseFloat(valor.replace(/\./g, "").replace(/,/g, "."));
    const qtdNum = parseInt(quantidade, 10);

    if (isNaN(valorNum) || valorNum <= 0) {
      Alert.alert("Erro", "Valor deve ser um número maior que 0");
      return false;
    }

    if (isNaN(qtdNum) || qtdNum <= 0) {
      Alert.alert("Erro", "Quantidade deve ser um número inteiro maior que 0");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const valorConverted = parseFloat(
        valor.replace(/\./g, "").replace(/,/g, ".")
      );
      const data = {
        nome: nome.trim(),
        valor_produto: valorConverted,
        quantidade_estoque: parseInt(quantidade, 10),
      };

      if (produto) {
        await apiService.updateProduto(produto.id_produto, data);
        Alert.alert("Sucesso", "Produto atualizado com sucesso");
      } else {
        await apiService.createProduto(data);
        Alert.alert("Sucesso", "Produto criado com sucesso");
      }

      onSuccess();
      onClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao salvar produto";
      Alert.alert("Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} disabled={loading}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {produto ? "Editar Produto" : "Novo Produto"}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Nome */}
          <View style={styles.section}>
            <Text style={styles.label}>Nome do Produto *</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite o nome do produto"
              value={nome}
              onChangeText={setNome}
              editable={!loading}
              placeholderTextColor="#ccc"
            />
          </View>

          {/* Valor */}
          <View style={styles.section}>
            <Text style={styles.label}>Valor (R$) *</Text>
            <View style={styles.inputWithPrefix}>
              <Text style={styles.currencyPrefix}>R$</Text>
              <TextInput
                style={styles.currencyInput}
                placeholder="0,00"
                value={valor}
                onChangeText={handlePriceChange}
                editable={!loading}
                keyboardType="decimal-pad"
                placeholderTextColor="#ccc"
              />
            </View>
          </View>

          {/* Quantidade */}
          <View style={styles.section}>
            <Text style={styles.label}>Quantidade em Estoque *</Text>
            <View style={styles.inputWithPrefix}>
              <TextInput
                style={[styles.currencyInput, { flex: 1 }]}
                placeholder="0"
                value={quantidade}
                onChangeText={setQuantidade}
                editable={!loading}
                keyboardType="number-pad"
                placeholderTextColor="#ccc"
              />
              <Text style={styles.suffix}>un.</Text>
            </View>
          </View>

          <Text style={styles.requiredNote}>* Campos obrigatórios</Text>
        </ScrollView>

        {/* Botões */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.saveButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                {produto ? "Atualizar" : "Criar"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
  },
  inputWithPrefix: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    paddingHorizontal: 12,
  },
  currencyPrefix: {
    fontSize: 14,
    fontWeight: "600",
    color: "#999",
    marginRight: 4,
  },
  currencyInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: "#333",
  },
  suffix: {
    fontSize: 14,
    color: "#999",
    marginLeft: 4,
  },
  requiredNote: {
    fontSize: 12,
    color: "#999",
    marginTop: 12,
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#ff9800",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
