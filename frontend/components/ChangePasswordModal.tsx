/**
 * Modal para Mudar Senha
 */

import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { apiService } from "../services/api";
import { useThemeColors } from "../context/ThemeContext";
import {
  Spacing,
  BorderRadius,
  FontSize,
  FontWeight,
  Shadows,
  ThemeColors,
} from "../theme";

export interface ChangePasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    // ValidaÃ§Ãµes
    if (!currentPassword.trim()) {
      Alert.alert("Erro", "Por favor, insira sua senha atual");
      return;
    }

    if (!newPassword.trim()) {
      Alert.alert("Erro", "Por favor, insira a nova senha");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Erro", "A nova senha deve ter no mÃ­nimo 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As senhas nÃ£o coincidem");
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert("Erro", "A nova senha nÃ£o pode ser igual Ã  senha atual");
      return;
    }

    try {
      setLoading(true);
      await apiService.changePassword(currentPassword, newPassword);

      // Limpar campos
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao mudar senha";
      Alert.alert("Erro", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Limpar campos ao fechar
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    onClose();
  };

  const PasswordInput = ({
    label,
    value,
    onChangeText,
    showPassword,
    onToggleShow,
    placeholder,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    showPassword: boolean;
    onToggleShow: () => void;
    placeholder: string;
  }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordInputWrapper}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          secureTextEntry={!showPassword}
          value={value}
          onChangeText={onChangeText}
          editable={!loading}
          placeholderTextColor={colors.textTertiary}
        />
        <TouchableOpacity
          onPress={onToggleShow}
          disabled={loading}
          style={styles.eyeButton}
        >
          <Ionicons
            name={showPassword ? "eye" : "eye-off"}
            size={20}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.overlay}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={false}
          >
            <View style={styles.modalContent}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Mudar Senha</Text>
                <TouchableOpacity onPress={handleClose} disabled={loading}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Campos de Entrada */}
              <View style={styles.formContainer}>
                <PasswordInput
                  label="Senha Atual"
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  showPassword={showCurrentPassword}
                  onToggleShow={() =>
                    setShowCurrentPassword(!showCurrentPassword)
                  }
                  placeholder="Digite sua senha atual"
                />

                <PasswordInput
                  label="Nova Senha"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  showPassword={showNewPassword}
                  onToggleShow={() => setShowNewPassword(!showNewPassword)}
                  placeholder="Digite a nova senha"
                />

                <PasswordInput
                  label="Confirmar Senha"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  showPassword={showConfirmPassword}
                  onToggleShow={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  placeholder="Confirme a nova senha"
                />
              </View>

              {/* BotÃµes */}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleChangePassword}
                  disabled={loading}
                  activeOpacity={0.85}
                  style={styles.button}
                >
                  <LinearGradient
                    colors={[...colors.gradientPrimary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.submitGradient, loading && { opacity: 0.6 }]}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.submitButtonText}>Mudar Senha</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.4)",
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: Spacing.lg,
    },
    overlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: colors.surface,
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
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: FontSize.lg,
      fontWeight: FontWeight.bold,
      color: colors.text,
    },
    formContainer: {
      marginBottom: Spacing.xl,
    },
    inputContainer: {
      marginBottom: Spacing.lg,
    },
    label: {
      fontSize: FontSize.sm,
      fontWeight: FontWeight.semibold,
      marginBottom: Spacing.sm,
      color: colors.text,
    },
    passwordInputWrapper: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.background,
      height: 48,
    },
    input: {
      flex: 1,
      fontSize: FontSize.md,
      color: colors.text,
    },
    eyeButton: {
      padding: Spacing.sm,
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
      backgroundColor: colors.background,
      paddingVertical: Spacing.md,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: BorderRadius.md,
    },
    cancelButtonText: {
      color: colors.textSecondary,
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
      color: colors.textInverse,
      fontSize: FontSize.md,
      fontWeight: FontWeight.semibold,
    },
  });
