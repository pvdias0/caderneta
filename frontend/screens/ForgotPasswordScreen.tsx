/**
 * Tela de Recuperação de Senha - Modern & Juicy
 */

import React, { useState, useRef } from "react";
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
  ScrollView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useForgotPassword } from "../hooks/useForgotPassword";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadows } from "../theme";

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
  const [code1, setCode1] = useState("");
  const [code2, setCode2] = useState("");
  const [code3, setCode3] = useState("");
  const [code4, setCode4] = useState("");
  const [code5, setCode5] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const codeRef2 = useRef<TextInput>(null);
  const codeRef3 = useRef<TextInput>(null);
  const codeRef4 = useRef<TextInput>(null);
  const codeRef5 = useRef<TextInput>(null);

  const handleForgotPassword = async () => {
    if (!email || !email.includes("@")) {
      Alert.alert("Erro", "Por favor, insira um email válido");
      return;
    }
    try {
      await forgotPassword(email);
      Alert.alert("Sucesso", "Verifique seu email para obter o código de recuperação");
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao solicitar recuperação");
    }
  };

  const handleValidateToken = async () => {
    const fullCode = `${code1}${code2}${code3}${code4}${code5}`;
    if (!fullCode || fullCode.length !== 5) {
      Alert.alert("Erro", "Por favor, insira todos os 5 caracteres do código");
      return;
    }
    const isValid = await validateResetToken(email, fullCode);
    if (isValid) {
      setResetToken(fullCode);
    } else {
      Alert.alert("Erro", error || "Código inválido ou expirado");
      setCode1(""); setCode2(""); setCode3(""); setCode4(""); setCode5("");
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
      Alert.alert("Sucesso!", "Sua senha foi redefinida. Faça login com a nova senha.");
      router.replace("/(auth)/login");
    } catch (err: any) {
      Alert.alert("Erro", err.message || "Erro ao redefinir senha");
    }
  };

  const setters = [setCode1, setCode2, setCode3, setCode4, setCode5];
  const nextRefs = [codeRef2, codeRef3, codeRef4, codeRef5, null];

  const handleCodeInput = (inputIndex: number, text: string) => {
    const upperText = text.toUpperCase();
    const idx = inputIndex - 1;

    // Empty = user pressed backspace
    if (upperText.length === 0) {
      setters[idx]("");
      return;
    }

    // Paste: distribute across all inputs
    if (upperText.length > 1) {
      const chars = upperText.split("").slice(0, 5);
      chars.forEach((ch, i) => setters[i]?.(ch));
      for (let i = chars.length; i < 5; i++) setters[i]?.("");
      return;
    }

    // Single character: set and advance
    setters[idx](upperText);
    nextRefs[idx]?.current?.focus();
  };

  const handleBack = () => {
    reset();
    setEmail(""); setResetToken(""); setNewPassword(""); setConfirmPassword("");
    router.back();
  };

  const stepConfig: Record<string, { icon: "mail" | "mail-open" | "lock-closed" | "checkmark-circle"; title: string; sub: string }> = {
    email: { icon: "mail", title: "Insira seu email", sub: "Enviaremos um código para redefinir sua senha" },
    verify: { icon: "mail-open", title: "Verifique seu email", sub: `Enviamos um código de 5 caracteres para ${email}` },
    reset: { icon: "lock-closed", title: "Crie uma nova senha", sub: "Digite uma senha segura e não esqueça dela" },
    complete: { icon: "checkmark-circle", title: "Senha redefinida", sub: "Sua senha foi alterada com sucesso" },
  };

  const current = stepConfig[step] || stepConfig.email;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primaryDark} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Gradient Hero */}
          <LinearGradient
            colors={[...Colors.gradientPrimary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <TouchableOpacity onPress={handleBack} disabled={loading} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.heroContent}>
              <View style={styles.iconCircle}>
                <Ionicons name={current.icon} size={32} color={Colors.primary} />
              </View>
              <Text style={styles.heroTitle}>{current.title}</Text>
              <Text style={styles.heroSub}>{current.sub}</Text>
            </View>
          </LinearGradient>

          {/* Form Card */}
          <View style={styles.card}>
            {/* Step 1: Email */}
            {step === "email" && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="mail-outline" size={18} color={Colors.textTertiary} />
                    <TextInput
                      style={styles.input}
                      placeholder="seu@email.com"
                      placeholderTextColor={Colors.textTertiary}
                      value={email}
                      onChangeText={setEmail}
                      editable={!loading}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
                {error && <Text style={styles.errorText}>{error}</Text>}
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  disabled={loading}
                  activeOpacity={0.85}
                  style={styles.btnContainer}
                >
                  <LinearGradient
                    colors={[...Colors.gradientPrimary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.gradientBtn, loading && { opacity: 0.6 }]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.btnText}>Enviar Código</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* Step 2: Verify Token */}
            {step === "verify" && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Código de Verificação</Text>
                  <View style={styles.codeRow}>
                    <TextInput
                      style={styles.codeInput}
                      placeholder="-"
                      placeholderTextColor={Colors.textTertiary}
                      value={code1}
                      onChangeText={(text) => handleCodeInput(1, text)}
                      editable={!loading}
                      maxLength={5}
                      autoCapitalize="characters"
                      textContentType="oneTimeCode"
                    />
                    <TextInput
                      ref={codeRef2}
                      style={styles.codeInput}
                      placeholder="-"
                      placeholderTextColor={Colors.textTertiary}
                      value={code2}
                      onChangeText={(text) => handleCodeInput(2, text)}
                      editable={!loading}
                      maxLength={1}
                      autoCapitalize="characters"
                    />
                    <TextInput
                      ref={codeRef3}
                      style={styles.codeInput}
                      placeholder="-"
                      placeholderTextColor={Colors.textTertiary}
                      value={code3}
                      onChangeText={(text) => handleCodeInput(3, text)}
                      editable={!loading}
                      maxLength={1}
                      autoCapitalize="characters"
                    />
                    <TextInput
                      ref={codeRef4}
                      style={styles.codeInput}
                      placeholder="-"
                      placeholderTextColor={Colors.textTertiary}
                      value={code4}
                      onChangeText={(text) => handleCodeInput(4, text)}
                      editable={!loading}
                      maxLength={1}
                      autoCapitalize="characters"
                    />
                    <TextInput
                      ref={codeRef5}
                      style={styles.codeInput}
                      placeholder="-"
                      placeholderTextColor={Colors.textTertiary}
                      value={code5}
                      onChangeText={(text) => handleCodeInput(5, text)}
                      editable={!loading}
                      maxLength={1}
                      autoCapitalize="characters"
                    />
                  </View>
                </View>
                {error && <Text style={styles.errorText}>{error}</Text>}
                <TouchableOpacity
                  onPress={handleValidateToken}
                  disabled={loading}
                  activeOpacity={0.85}
                  style={styles.btnContainer}
                >
                  <LinearGradient
                    colors={[...Colors.gradientPrimary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.gradientBtn, loading && { opacity: 0.6 }]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.btnText}>Verificar Código</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => reset()} disabled={loading} style={styles.linkBtn}>
                  <Text style={styles.linkText}>Usar outro email</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Step 3: Reset Password */}
            {step === "reset" && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nova Senha</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color={Colors.textTertiary} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.textTertiary}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      editable={!loading}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={Colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirmar Senha</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={18} color={Colors.textTertiary} />
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.textTertiary}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      editable={!loading}
                      secureTextEntry={!showConfirmPassword}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Ionicons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={18} color={Colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {error && <Text style={styles.errorText}>{error}</Text>}
                <TouchableOpacity
                  onPress={handleResetPassword}
                  disabled={loading}
                  activeOpacity={0.85}
                  style={styles.btnContainer}
                >
                  <LinearGradient
                    colors={[...Colors.gradientPrimary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.gradientBtn, loading && { opacity: 0.6 }]}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.btnText}>Redefinir Senha</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => reset()} disabled={loading} style={styles.linkBtn}>
                  <Text style={styles.linkText}>Usar outro email</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    paddingTop: Platform.OS === "ios" ? 60 : 48,
    paddingBottom: Spacing.huge,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: BorderRadius.xxl,
    borderBottomRightRadius: BorderRadius.xxl,
  },
  backBtn: {
    padding: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: BorderRadius.sm,
    alignSelf: "flex-start",
    marginBottom: Spacing.xl,
  },
  heroContent: {
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  heroTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
  },
  heroSub: {
    fontSize: FontSize.sm,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  card: {
    marginTop: -Spacing.xxl,
    marginHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
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
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  codeInput: {
    width: 50,
    height: 56,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
    textAlign: "center",
    backgroundColor: Colors.primarySoft,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginBottom: Spacing.md,
  },
  btnContainer: {
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    marginTop: Spacing.sm,
    ...Shadows.button,
  },
  gradientBtn: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
    borderRadius: BorderRadius.md,
  },
  btnText: {
    color: Colors.textInverse,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  linkBtn: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  linkText: {
    color: Colors.info,
    fontWeight: FontWeight.medium,
    fontSize: FontSize.sm,
  },
});
