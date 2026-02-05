/**
 * Tela de Recuperação de Senha
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { Ionicons } from "@expo/vector-icons";

export const ForgotPasswordScreen: React.FC = () => {
  const router = useRouter();
  const {
    loading,
    error,
    step,
    forgotPassword,
    validateResetToken,
    resetPassword,
    reset,
  } = useForgotPassword();

  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleForgotPassword = async () => {
    if (!email || !email.includes("@")) {
      Alert.alert("Erro", "Por favor, insira um email válido");
      return;
    }

    try {
      await forgotPassword(email);
      Alert.alert(
        "Sucesso",
        "Verifique seu email para obter o código de recuperação"
      );
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao solicitar recuperação");
    }
  };

  const handleValidateToken = async () => {
    if (!resetToken) {
      Alert.alert("Erro", "Por favor, insira o código de verificação");
      return;
    }

    const isValid = await validateResetToken(email, resetToken);
    if (!isValid) {
      Alert.alert("Erro", error || "Código inválido ou expirado");
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Erro", "A senha deve ter no mínimo 6 caracteres");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As senhas não correspondem");
      return;
    }

    try {
      await resetPassword(email, resetToken, newPassword, confirmPassword);
      Alert.alert(
        "Sucesso!",
        "Sua senha foi redefinida. Faça login com a nova senha."
      );
      router.replace("/(auth)/login");
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao redefinir senha");
    }
  };

  const handleBack = () => {
    reset();
    setEmail("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    router.back();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Header com botão voltar */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBack}
            disabled={loading}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recuperar Senha</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Step 1: Email */}
        {step === "email" && (
          <View style={styles.stepContainer}>
            <Ionicons name="mail" size={48} color="#e91e63" style={styles.icon} />
            <Text style={styles.title}>Insira seu email</Text>
            <Text style={styles.subtitle}>
              Enviaremos um código para redefinir sua senha
            </Text>

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="seu@email.com"
              placeholderTextColor="#ccc"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {error && (
              <Text style={styles.errorText}>❌ {error}</Text>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Enviar Código</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Verify Token */}
        {step === "verify" && (
          <View style={styles.stepContainer}>
            <Text style={styles.emoji}>✉️</Text>
            <Text style={styles.title}>Verifique seu email</Text>
            <Text style={styles.subtitle}>
              Enviamos um código para {email}
            </Text>

            <Text style={styles.label}>Código de Verificação</Text>
            <TextInput
              style={[styles.input, error && styles.inputError]}
              placeholder="Digite o código recebido"
              placeholderTextColor="#ccc"
              value={resetToken}
              onChangeText={setResetToken}
              editable={!loading}
              autoCapitalize="none"
              autoCorrect={false}
            />

            {error && (
              <Text style={styles.errorText}>❌ {error}</Text>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleValidateToken}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verificar Código</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => reset()}
              disabled={loading}
              style={styles.changeEmailButton}
            >
              <Text style={styles.changeEmailText}>Usar outro email</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Reset Password */}
        {step === "reset" && (
          <View style={styles.stepContainer}>
            <Text style={styles.emoji}>🔐</Text>
            <Text style={styles.title}>Crie uma nova senha</Text>
            <Text style={styles.subtitle}>
              Digite uma senha segura e não esqueça dela
            </Text>

            <Text style={styles.label}>Nova Senha</Text>
            <View
              style={[
                styles.passwordInputContainer,
                error && styles.inputError,
              ]}
            >
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="#ccc"
                value={newPassword}
                onChangeText={setNewPassword}
                editable={!loading}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirmar Senha</Text>
            <View
              style={[
                styles.passwordInputContainer,
                error && styles.inputError,
              ]}
            >
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="#ccc"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-off" : "eye"}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {error && (
              <Text style={styles.errorText}>❌ {error}</Text>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Redefinir Senha</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => reset()}
              disabled={loading}
              style={styles.changeEmailButton}
            >
              <Text style={styles.changeEmailText}>Usar outro email</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingTop: 40,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  stepContainer: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 40,
  },
  icon: {
    alignSelf: "center",
    marginBottom: 16,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
    color: "#333",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 14,
    color: "#333",
  },
  inputError: {
    borderColor: "#d32f2f",
    backgroundColor: "#ffebee",
  },
  passwordInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: "#333",
  },
  errorText: {
    fontSize: 12,
    color: "#d32f2f",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#e91e63",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  changeEmailButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: "center",
  },
  changeEmailText: {
    color: "#2196F3",
    fontWeight: "500",
    fontSize: 14,
  },
});
