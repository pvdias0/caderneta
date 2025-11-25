/**
 * Configuração centralizada - Suporte a múltiplos ambientes
 * Nenhum hardcode de URLs ou ports
 */

// Detectar ambiente
const ENV = process.env.EXPO_PUBLIC_ENV || "development";

// URL da API
const API_URL = process.env.EXPO_PUBLIC_API_URL ;

// Validar URL da API
if (!API_URL) {
  console.error("❌ EXPO_PUBLIC_API_URL não configurada no .env");
} else {
  console.log(`✅ API URL configurada: ${API_URL}`);
}

export const config = {
  // Ambiente
  env: ENV,
  isDevelopment: ENV === "development",
  isStaging: ENV === "staging",
  isProduction: ENV === "production",

  // API
  apiUrl: API_URL || "https://caderneta-backend.onrender.com",

  // Timeout
  apiTimeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || "30000", 10),

  // Logging
  enableLogging: process.env.EXPO_PUBLIC_ENABLE_LOGGING !== "false",
};

export default config;
