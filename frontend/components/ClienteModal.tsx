/**
 * Modal para Criar/Editar Cliente
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ICliente, ICreateClienteDTO } from "../types/cliente";
import { apiService } from "../services/api";
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from "../theme";

export interface ClienteModalProps {
  visible: boolean;
  cliente?: ICliente | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClienteModal: React.FC<ClienteModalProps> = ({
  visible,
  cliente,
  onClose,
  onSuccess,
}) => {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [loading, setLoading] = useState(false);

  // Função para formatar telefone
  const formatPhoneNumber = (value: string): string => {
    // Remove tudo que não é número
    const cleaned = value.replace(/\D/g, "");

    // Limita a 11 caracteres
    if (cleaned.length === 0) return "";
    if (cleaned.length <= 2) return `(${cleaned}`;
    if (cleaned.length <= 7)
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(
      7,
      11
    )}`;
  };

  const handlePhoneChange = (value: string) => {
    setTelefone(formatPhoneNumber(value));
  };

  useEffect(() => {
    if (cliente) {
      setNome(cliente.nome);
      setEmail(cliente.email);
      setTelefone(cliente.telefone);
    } else {
      setNome("");
      setEmail("");
      setTelefone("");
    }
  }, [cliente, visible]);

  const isEditing = !!cliente;

  const validateForm = (): boolean => {
    if (!nome.trim()) {
      Alert.alert("Erro", "Nome do cliente é obrigatório");
      return false;
    }

    // Validação opcional de email (se preenchido)
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        Alert.alert("Erro", "Email inválido");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const dados: ICreateClienteDTO = {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
      };

      if (isEditing && cliente) {
        await apiService.updateCliente(cliente.id_cliente, dados);
        Alert.alert("Sucesso", "Cliente atualizado com sucesso");
      } else {
        await apiService.createCliente(dados);
        Alert.alert("Sucesso", "Cliente criado com sucesso");
      }

      onSuccess();
      handleClose();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao salvar cliente";
      Alert.alert("Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNome("");
    setEmail("");
    setTelefone("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {isEditing ? "Editar Cliente" : "Novo Cliente"}
              </Text>
              <TouchableOpacity onPress={handleClose} disabled={loading}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Formulário */}
            <View style={styles.form}>
              {/* Nome */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Nome</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="person"
                    size={18}
                    color="#999"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Nome completo"
                    value={nome}
                    onChangeText={setNome}
                    editable={!loading}
                    placeholderTextColor="#ccc"
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="mail"
                    size={18}
                    color="#999"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="email@example.com"
                    value={email}
                    onChangeText={setEmail}
                    editable={!loading}
                    keyboardType="email-address"
                    placeholderTextColor="#ccc"
                  />
                </View>
              </View>

              {/* Telefone */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Telefone</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons
                    name="call"
                    size={18}
                    color="#999"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="(11) 99999-9999"
                    value={telefone}
                    onChangeText={handlePhoneChange}
                    editable={!loading}
                    keyboardType="phone-pad"
                    maxLength={15}
                    placeholderTextColor="#ccc"
                  />
                </View>
              </View>
            </View>

            {/* Botões */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
                style={[styles.button]}
              >
                <LinearGradient
                  colors={[...Colors.gradientPrimary]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.submitGradient, loading && { opacity: 0.6 }]}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {isEditing ? "Atualizar" : "Criar"}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    width: "100%",
    maxWidth: 400,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    ...Shadows.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    marginBottom: Spacing.sm,
    color: Colors.text,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.background,
    height: 48,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
  },
  cancelButton: {
    backgroundColor: Colors.background,
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  submitGradient: {
    paddingVertical: Spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.md,
  },
  submitButtonText: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
});
