/**
 * Configuração da API - Flexível por ambiente
 */

// URL da API baseada no ambiente
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export const config = {
  apiUrl: API_URL,
  isDevelopment: process.env.EXPO_PUBLIC_ENV === 'development',
  isStaging: process.env.EXPO_PUBLIC_ENV === 'staging',
  isProduction: process.env.EXPO_PUBLIC_ENV === 'production',
};

export default config;
