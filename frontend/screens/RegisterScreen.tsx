/**
 * Tela de Registro - Modern & Juicy
 */

import React, { useState, useEffect, useRef } from "react";
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
  Animated,
  StatusBar,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "expo-router";
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from "../theme";

export const RegisterScreen: React.FC = () => {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuth();

  const [nomeUsuario, setNomeUsuario] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
      Alert.alert("Sucesso", "Conta criada! Faça login para continuar.");
      router.replace("login" as any);
    } catch (err) {
      Alert.alert(
        "Erro de Registro",
        err instanceof Error ? err.message : "Erro desconhecido"
      );
    }
  };

  useEffect(() => {
    if (error) {
      Alert.alert("Erro", error);
      clearError();
    }
  }, [error, clearError]);

  const renderInput = (
    field: string,
    icon: keyof typeof Ionicons.glyphMap,
    placeholder: string,
    value: string,
    onChangeText: (t: string) => void,
    options?: {
      secure?: boolean;
      showToggle?: boolean;
      showState?: boolean;
      onToggle?: () => void;
      keyboard?: any;
      autoCapitalize?: any;
    }
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{field}</Text>
      <View
        style={[
          styles.inputContainer,
          focusedField === field && styles.inputFocused,
        ]}
      >
        <Ionicons
          name={icon}
          size={20}
          color={focusedField === field ? Colors.primary : Colors.textTertiary}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          editable={!isLoading}
          secureTextEntry={options?.secure && !options?.showState}
          keyboardType={options?.keyboard || "default"}
          autoCapitalize={options?.autoCapitalize || "none"}
          autoCorrect={false}
          onFocus={() => setFocusedField(field)}
          onBlur={() => setFocusedField(null)}
        />
        {options?.showToggle && (
          <TouchableOpacity
            onPress={options?.onToggle}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name={options?.showState ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={Colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />

      {/* Header */}
      <LinearGradient
        colors={[...Colors.gradientPrimary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <TouchableOpacity
          onPress={() => router.replace("login" as any)}
          style={styles.backBtn}
          disabled={isLoading}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Animated.View style={{ opacity: fadeAnim, alignItems: "center" }}>
          <View style={styles.heroIconCircle}>
            <Ionicons name="person-add" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.heroTitle}>Criar Conta</Text>
          <Text style={styles.heroSubtitle}>Comece a usar a Caderneta</Text>
        </Animated.View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.formWrapper}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.formCard,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {renderInput("Nome de Usuário", "person-outline", "seu_usuario", nomeUsuario, setNomeUsuario)}

            {renderInput("Email", "mail-outline", "seu@email.com", email, setEmail, {
              keyboard: "email-address",
            })}

            {renderInput("Senha", "lock-closed-outline", "Mínimo 6 caracteres", senha, setSenha, {
              secure: true,
              showToggle: true,
              showState: showPassword,
              onToggle: () => setShowPassword(!showPassword),
            })}

            {renderInput(
              "Confirmar Senha",
              "shield-checkmark-outline",
              "Repita a senha",
              confirmarSenha,
              setConfirmarSenha,
              {
                secure: true,
                showToggle: true,
                showState: showConfirm,
                onToggle: () => setShowConfirm(!showConfirm),
              }
            )}

            {/* Register Button */}
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              activeOpacity={0.85}
              style={styles.buttonWrapper}
            >
              <LinearGradient
                colors={
                  isLoading
                    ? [Colors.textTertiary, Colors.textTertiary]
                    : [...Colors.gradientPrimary]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Criar Conta</Text>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Já tem conta? </Text>
              <TouchableOpacity
                onPress={() => router.replace("login" as any)}
                disabled={isLoading}
              >
                <Text style={styles.loginLink}>Fazer login</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  hero: {
    paddingTop: Platform.OS === "ios" ? 60 : 48,
    paddingBottom: 40,
    alignItems: "center",
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 56 : 44,
    left: Spacing.xl,
    zIndex: 10,
    padding: Spacing.sm,
  },
  heroIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
    ...Shadows.lg,
  },
  heroTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.heavy,
    color: Colors.textInverse,
  },
  heroSubtitle: {
    fontSize: FontSize.sm,
    color: "rgba(255,255,255,0.8)",
    marginTop: Spacing.xs,
  },
  formWrapper: {
    flex: 1,
    marginTop: -Spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xxxl,
  },
  formCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.xl,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    ...Shadows.lg,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  inputFocused: {
    borderColor: Colors.primaryLight,
    backgroundColor: Colors.primarySoft,
  },
  inputIcon: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    paddingVertical: Platform.OS === "ios" ? 16 : 14,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  buttonWrapper: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    ...Shadows.button,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: Spacing.sm,
  },
  buttonText: {
    color: Colors.textInverse,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
  },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: FontWeight.bold,
  },
});
