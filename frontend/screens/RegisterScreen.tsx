/**
 * Tela de Registro
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
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "expo-router";

export const RegisterScreen: React.FC = () => {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();

  const [nomeUsuario, setNomeUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  const handleRegister = async () => {
    if (!nomeUsuario || !email || !senha || !confirmarSenha) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert("Erro", "As senhas não conferem");
      return;
    }

    if (senha.length < 6) {
      Alert.alert("Erro", "A senha deve ter pelo menos 6 caracteres");
      return;
    }

    try {
      await register(nomeUsuario, email, senha);
      Alert.alert(
        "Sucesso",
        "Usuário registrado com sucesso! Faça login para continuar."
      );
      // Voltar para login usando replace (sem histórico)
      router.replace("login" as any);
    } catch (error) {
      Alert.alert(
        "Erro de Registro",
        error instanceof Error ? error.message : "Erro desconhecido"
      );
    }
  };

  const handleBack = () => {
    router.replace("login" as any);
  };

  React.useEffect(() => {
    if (error) {
      Alert.alert("Erro", error);
      clearError();
    }
  }, [error, clearError]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Comece a usar a Caderneta</Text>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Nome de Usuário</Text>
          <TextInput
            style={styles.input}
            placeholder="seu_usuario"
            placeholderTextColor="#ccc"
            value={nomeUsuario}
            onChangeText={setNomeUsuario}
            editable={!isLoading}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com"
            placeholderTextColor="#ccc"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#ccc"
            value={senha}
            onChangeText={setSenha}
            editable={!isLoading}
            secureTextEntry
          />

          <Text style={styles.label}>Confirmar Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#ccc"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            editable={!isLoading}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Registrar</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleBack} disabled={isLoading}>
            <Text style={styles.backLink}>
              Já tem conta? <Text style={styles.backLinkBold}>Fazer login</Text>
            </Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 40,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    maxWidth: 400,
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
  backLink: {
    textAlign: "center",
    marginTop: 16,
    color: "#666",
    fontSize: 14,
  },
  backLinkBold: {
    color: "#e91e63",
    fontWeight: "600",
  },
});
