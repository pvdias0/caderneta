/**
 * Modal de Recuperação de Senha
 * Fluxo completo: email -> validar token -> nova senha
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInUp } from 'react-native-reanimated';
import { useForgotPassword } from '../hooks/useForgotPassword';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const {
    loading,
    error,
    success,
    step,
    forgotPassword,
    validateResetToken,
    resetPassword,
    reset,
  } = useForgotPassword();

  // Estados do formulário
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleClose = () => {
    reset();
    setEmail('');
    setResetToken('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Erro', 'Por favor, insira seu email');
      return;
    }

    try {
      await forgotPassword(email);
      Alert.alert('Sucesso', 'Verifique seu email para obter o link de recuperação');
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao solicitar recuperação');
    }
  };

  const handleValidateToken = async () => {
    if (!resetToken) {
      Alert.alert('Erro', 'Por favor, insira o código de verificação');
      return;
    }

    const isValid = await validateResetToken(email, resetToken);
    if (!isValid) {
      Alert.alert('Erro', 'Código inválido ou expirado');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Erro', 'A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não correspondem');
      return;
    }

    try {
      await resetPassword(email, resetToken, newPassword, confirmPassword);
      Alert.alert('Sucesso!', 'Sua senha foi redefinida. Faça login com a nova senha.');
      handleClose();
      onSuccess?.();
    } catch (err: any) {
      Alert.alert('Erro', err.message || 'Erro ao redefinir senha');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Animated.View entering={FadeIn.duration(200)} style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <Animated.View entering={SlideInUp.springify().damping(20)} style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Recuperar Senha</Text>
              <TouchableOpacity
                onPress={handleClose}
                disabled={loading}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false} 
              style={styles.scrollView}
              contentContainerStyle={styles.scrollViewContent}
            >
              {/* Step 1: Email */}
              {step === 'email' && (
                <Animated.View entering={FadeIn.duration(300)}>
                  <View style={styles.stepContainer}>
                    <Ionicons name="mail-outline" size={48} color="#4CAF50" style={styles.icon} />
                    
                    <Text style={styles.stepTitle}>Insira seu email</Text>
                    <Text style={styles.stepDescription}>
                      Enviaremos um link de recuperação para seu email cadastrado
                    </Text>

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
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={14} color="#d32f2f" />
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.button, loading && styles.buttonDisabled]}
                      onPress={handleForgotPassword}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="send" size={18} color="#fff" style={{ marginRight: 8 }} />
                          <Text style={styles.buttonText}>Enviar Link</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}

              {/* Step 2: Verify Token */}
              {step === 'verify' && (
                <Animated.View entering={FadeIn.duration(300)}>
                  <View style={styles.stepContainer}>
                    <Ionicons name="checkmark-circle-outline" size={48} color="#2196F3" style={styles.icon} />
                    
                    <Text style={styles.stepTitle}>Verifique seu email</Text>
                    <Text style={styles.stepDescription}>
                      Enviamos um link para redefinir sua senha. Cole o código aqui:
                    </Text>

                    <TextInput
                      style={[styles.input, error && styles.inputError]}
                      placeholder="Código de verificação"
                      placeholderTextColor="#ccc"
                      value={resetToken}
                      onChangeText={setResetToken}
                      editable={!loading}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />

                    {error && (
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={14} color="#d32f2f" />
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.button, loading && styles.buttonDisabled]}
                      onPress={handleValidateToken}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 8 }} />
                          <Text style={styles.buttonText}>Verificar Código</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => reset()}
                      disabled={loading}
                    >
                      <Text style={styles.backButtonText}>← Voltar</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}

              {/* Step 3: Reset Password */}
              {step === 'reset' && (
                <Animated.View entering={FadeIn.duration(300)}>
                  <View style={styles.stepContainer}>
                    <Ionicons name="lock-closed-outline" size={48} color="#FF9800" style={styles.icon} />
                    
                    <Text style={styles.stepTitle}>Crie uma nova senha</Text>
                    <Text style={styles.stepDescription}>
                      Digite uma senha segura com no mínimo 6 caracteres
                    </Text>

                    {/* Nova Senha */}
                    <View style={styles.passwordInputContainer}>
                      <Ionicons name="lock-closed" size={20} color="#666" style={styles.passwordIcon} />
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="Nova senha"
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
                          name={showPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color="#666"
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Confirmar Senha */}
                    <View style={styles.passwordInputContainer}>
                      <Ionicons name="lock-closed" size={20} color="#666" style={styles.passwordIcon} />
                      <TextInput
                        style={styles.passwordInput}
                        placeholder="Confirmar senha"
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
                          name={showConfirmPassword ? 'eye-off' : 'eye'}
                          size={20}
                          color="#666"
                        />
                      </TouchableOpacity>
                    </View>

                    {error && (
                      <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={14} color="#d32f2f" />
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    )}

                    <TouchableOpacity
                      style={[styles.button, loading && styles.buttonDisabled]}
                      onPress={handleResetPassword}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={18} color="#fff" style={{ marginRight: 8 }} />
                          <Text style={styles.buttonText}>Redefinir Senha</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => reset()}
                      disabled={loading}
                    >
                      <Text style={styles.backButtonText}>← Voltar</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}

              {/* Step 4: Complete */}
              {step === 'complete' && success && (
                <Animated.View entering={FadeIn.duration(300)}>
                  <View style={styles.stepContainer}>
                    <Ionicons name="checkmark-circle" size={64} color="#4CAF50" style={styles.icon} />
                    
                    <Text style={styles.stepTitle}>Sucesso!</Text>
                    <Text style={styles.stepDescription}>
                      Sua senha foi redefinida com sucesso. Agora você pode fazer login com a nova senha.
                    </Text>

                    <TouchableOpacity
                      style={[styles.button, styles.successButton]}
                      onPress={handleClose}
                    >
                      <Ionicons name="arrow-back" size={18} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={styles.buttonText}>Voltar ao Login</Text>
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxHeight: '85%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  stepContainer: {
    padding: 24,
    gap: 16,
  },
  icon: {
    alignSelf: 'center',
    marginBottom: 12,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  inputError: {
    borderColor: '#d32f2f',
    backgroundColor: '#ffebee',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  passwordIcon: {
    marginRight: 4,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    flex: 1,
  },
  button: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  successButton: {
    backgroundColor: '#4CAF50',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#666',
    fontWeight: '500',
    fontSize: 14,
  },
});
