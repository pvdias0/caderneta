/**
 * Modal para criar/editar pagamento
 */

import React, { useState, useEffect, useMemo } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { IMovimento } from "../types/movimento";
import { useThemeColors } from "../context/ThemeContext";
import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadows,
  ThemeColors,
} from "../theme";

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
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (pagamento) {
      // Editar pagamento existente
      // valor jÃ¡ vem em reais do backend (numeric(12,2)), nÃ£o precisa dividir por 100
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
      newErrors.valor = "Valor Ã© obrigatÃ³rio";
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
              <Ionicons name="close" size={24} color={colors.text} />
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
                  placeholderTextColor={colors.textTertiary}
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
                    textColor={colors.text}
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

          {/* Footer com botÃµes */}
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
                colors={[...colors.gradientPrimary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.saveGradient, loading && { opacity: 0.6 }]}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? "Salvando..." : "Salvar"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
      backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    content: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      paddingTop: Spacing.xl,
      paddingBottom: Spacing.xl,
      maxHeight: "90%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: FontSize.lg,
      fontWeight: FontWeight.bold,
      color: colors.text,
    },
    form: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.lg,
    },
    formGroup: {
      marginBottom: Spacing.xl,
    },
    label: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.semibold,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      height: 48,
      backgroundColor: colors.background,
    },
    currencyPrefix: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.bold,
      color: colors.primary,
      marginRight: Spacing.sm,
    },
    input: {
      flex: 1,
      fontSize: FontSize.md,
      color: colors.text,
    },
    inputError: {
      borderColor: colors.danger,
    },
    errorText: {
      fontSize: FontSize.xs,
      color: colors.danger,
      marginTop: Spacing.xs,
    },
    dateButton: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      height: 48,
      gap: Spacing.md,
      backgroundColor: colors.background,
    },
    dateButtonText: {
      fontSize: FontSize.md,
      color: colors.text,
      fontWeight: FontWeight.medium,
    },
    datePickerContainer: {
      marginTop: Spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      overflow: "hidden",
      backgroundColor: colors.background,
    },
    datePickerClose: {
      backgroundColor: colors.primary,
      paddingVertical: Spacing.md,
      alignItems: "center",
    },
    datePickerCloseText: {
      color: colors.textInverse,
      fontSize: FontSize.md,
      fontWeight: FontWeight.semibold,
    },
    footer: {
      flexDirection: "row",
      gap: Spacing.md,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
      backgroundColor: colors.background,
    },
    cancelButtonText: {
      fontSize: FontSize.md,
      fontWeight: FontWeight.semibold,
      color: colors.textSecondary,
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
      color: colors.textInverse,
    },
  });
