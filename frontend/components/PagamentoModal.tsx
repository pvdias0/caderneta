/**
 * Modal para criar/editar pagamento
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { IMovimento } from "../types/movimento";

export interface PagamentoModalProps {
  visible: boolean;
  pagamento?: IMovimento;
  onClose: () => void;
  onSave: (data: { valor_pagamento: number; data_pagamento?: string }) => void;
  loading?: boolean;
}

export const PagamentoModal: React.FC<PagamentoModalProps> = ({
  visible,
  pagamento,
  onClose,
  onSave,
  loading = false,
}) => {
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (pagamento) {
      // Editar pagamento existente
      // valor já vem em reais do backend (numeric(12,2)), não precisa dividir por 100
      const valorDisplay = pagamento.valor || 0;
      setValor(Number(valorDisplay).toFixed(2).replace(".", ","));
      setData(new Date(pagamento.data_movimento));
    } else {
      // Novo pagamento
      setValor("");
      setData(new Date());
    }
    setErrors({});
  }, [pagamento, visible]);

  const formatPrice = (text: string): string => {
    const numbers = text.replace(/\D/g, "");
    if (numbers.length === 0) return "";

    const num = parseInt(numbers, 10);
    const integerPart = Math.floor(num / 100);
    const decimalPart = num % 100;

    const formatted = integerPart
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    const withDecimals = `${formatted},${decimalPart
      .toString()
      .padStart(2, "0")}`;

    return withDecimals;
  };

  const handlePriceChange = (text: string) => {
    setValor(formatPrice(text));
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setData(selectedDate);
    }
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!valor.trim()) {
      newErrors.valor = "Valor é obrigatório";
    } else {
      const valorNum = parseFloat(valor.replace(/\./g, "").replace(/,/g, "."));
      if (valorNum <= 0) {
        newErrors.valor = "Valor deve ser maior que zero";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const valorNum = parseFloat(valor.replace(/\./g, "").replace(/,/g, "."));
    const dataPagamento = data.toISOString();

    onSave({
      valor_pagamento: valorNum,
      data_pagamento: dataPagamento,
    });
  };

  const formatDisplayDate = (date: Date): string => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.backdrop} />
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {pagamento ? "Editar Pagamento" : "Novo Pagamento"}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Valor */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Valor *</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencyPrefix}>R$</Text>
                <TextInput
                  style={[styles.input, errors.valor && styles.inputError]}
                  placeholder="0,00"
                  placeholderTextColor="#ccc"
                  value={valor}
                  onChangeText={handlePriceChange}
                  keyboardType="numeric"
                  editable={!loading}
                  maxLength={15}
                />
              </View>
              {errors.valor && (
                <Text style={styles.errorText}>{errors.valor}</Text>
              )}
            </View>

            {/* Data */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Data do Pagamento</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
              >
                <Ionicons name="calendar" size={20} color="#e91e63" />
                <Text style={styles.dateButtonText}>
                  {formatDisplayDate(data)}
                </Text>
              </TouchableOpacity>

              {showDatePicker && (
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={data}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={handleDateChange}
                    textColor="#333"
                  />
                  {Platform.OS === "ios" && (
                    <TouchableOpacity
                      style={styles.datePickerClose}
                      onPress={closeDatePicker}
                    >
                      <Text style={styles.datePickerCloseText}>Confirmar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer com botões */}
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
              <Text style={styles.saveButtonText}>
                {loading ? "Salvando..." : "Salvar"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 20,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  form: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: "#fff",
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: "600",
    color: "#e91e63",
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  inputError: {
    borderColor: "#f44336",
  },
  errorText: {
    fontSize: 12,
    color: "#f44336",
    marginTop: 4,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  datePickerContainer: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f9f9f9",
  },
  datePickerClose: {
    backgroundColor: "#e91e63",
    paddingVertical: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  datePickerCloseText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  button: {
    flex: 1,
    height: 48,
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
    backgroundColor: "#e91e63",
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
