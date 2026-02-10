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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { apiService } from "../services/api";
import { IProduto } from "../types/produto";
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from "../theme";

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

    // Se tem menos de 3 dígitos, assume que está incompleto
    // Se tem 3+ dígitos, divide por 100 para pegar centavos
    let integerPart: number;
    let decimalPart: number;

    if (numbers.length <= 2) {
      integerPart = 0;
      decimalPart = parseInt(numbers, 10);
    } else {
      const num = parseInt(numbers, 10);
      integerPart = Math.floor(num / 100);
      decimalPart = num % 100;
    }

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
      // Converte o valor numérico para formato de string com 2 casas decimais
      const valorFormatado = produto.valor_produto.toFixed(2).replace(".", ",");
      setValor(valorFormatado);
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
            style={styles.button}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[...Colors.gradientPrimary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.saveGradient, loading && { opacity: 0.6 }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {produto ? "Atualizar" : "Criar"}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  inputWithPrefix: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  currencyPrefix: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    marginRight: Spacing.xs,
  },
  currencyInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  suffix: {
    fontSize: FontSize.md,
    color: Colors.textTertiary,
    marginLeft: Spacing.xs,
  },
  requiredNote: {
    fontSize: FontSize.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.md,
  },
  footer: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  cancelButton: {
    backgroundColor: Colors.background,
  },
  cancelButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textSecondary,
  },
  saveGradient: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  saveButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textInverse,
  },
});
