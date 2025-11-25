import dotenv from 'dotenv';
import path from 'path';

// Carregar .env baseado em NODE_ENV
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : process.env.NODE_ENV === 'staging'
    ? '.env.staging'
    : '.env.local';

dotenv.config({ path: path.resolve(envFile) });

/**
 * Configurações centralizadas da aplicação
 * Acesso a todas as constantes e variáveis de ambiente
 */
export const config = {
  // Ambiente
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isStaging: process.env.NODE_ENV === 'staging',
  isProduction: process.env.NODE_ENV === 'production',

  // Servidor
  server: {
    port: parseInt(process.env.API_PORT || '8080', 10),
    apiUrl: process.env.API_URL || 'https://caderneta-backend.onrender.com',
  },

  // Banco de Dados
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'caderneta',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-key-change-in-production',
    expire: process.env.JWT_EXPIRE || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret',
    refreshExpire: process.env.JWT_REFRESH_EXPIRE || '7d',
  },

  // CORS
  cors: {
    origin: '*',
    credentials: true,
  },

  // Rate Limit
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10) * 60 * 1000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
};

export default config;
