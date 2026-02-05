/**
 * Hook para recuperação de senha
 */

import { useState } from 'react';
import { apiService } from '../services/api';

interface UseForgotPasswordReturn {
  loading: boolean;
  error: string | null;
  success: boolean;
  step: 'email' | 'verify' | 'reset' | 'complete';
  forgotPassword: (email: string) => Promise<void>;
  validateResetToken: (email: string, token: string) => Promise<boolean>;
  resetPassword: (email: string, token: string, newPassword: string, confirmPassword: string) => Promise<void>;
  reset: () => void;
}

export function useForgotPassword(): UseForgotPasswordReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<'email' | 'verify' | 'reset' | 'complete'>('email');

  const forgotPassword = async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      if (!email || !email.includes('@')) {
        throw new Error('Por favor, insira um email válido');
      }

      await apiService.request('POST', '/api/v1/auth/forgot-password', {
        email,
      });

      setStep('verify');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao solicitar recuperação de senha');
    } finally {
      setLoading(false);
    }
  };

  const validateResetToken = async (email: string, token: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiService.request('GET', `/api/v1/auth/validate-reset-token?email=${email}&token=${token}`);
      
      if ((response as any).valid) {
        setStep('reset');
        return true;
      }
      
      throw new Error('Token inválido ou expirado');
    } catch (err: any) {
      setError(err.message || 'Erro ao validar token');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (
    email: string,
    token: string,
    newPassword: string,
    confirmPassword: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (!newPassword || !confirmPassword) {
        throw new Error('Por favor, preencha todos os campos');
      }

      if (newPassword.length < 6) {
        throw new Error('A senha deve ter no mínimo 6 caracteres');
      }

      if (newPassword !== confirmPassword) {
        throw new Error('As senhas não correspondem');
      }

      await apiService.request('POST', '/api/v1/auth/reset-password', {
        email,
        token,
        newPassword,
        confirmPassword,
      });

      setStep('complete');
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir senha');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setSuccess(false);
    setStep('email');
  };

  return {
    loading,
    error,
    success,
    step,
    forgotPassword,
    validateResetToken,
    resetPassword,
    reset,
  };
}
