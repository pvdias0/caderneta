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
import { Ionicons } from "@expo/vector-icons";
import { ICliente, ICreateClienteDTO } from "../types/cliente";
import { apiService } from "../services/api";

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
                style={[
                  styles.button,
                  styles.submitButton,
                  loading && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isEditing ? "Atualizar" : "Criar"}
                  </Text>
                )}
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    maxWidth: 400,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  form: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fafafa",
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: "#e91e63",
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
