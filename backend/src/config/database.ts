import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";
import path from "path";

// Determinar qual arquivo .env usar baseado em NODE_ENV
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : process.env.NODE_ENV === "staging"
    ? ".env.staging"
    : ".env.local";

dotenv.config({ path: path.resolve(envFile) });

/**
 * Configuração dinâmica do pool de conexões PostgreSQL
 * Funciona em ambientes: local, staging, production
 */
const poolConfig: PoolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Configurações de pool para produção
  max: process.env.NODE_ENV === "production" ? 20 : 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  application_name: `caderneta-${process.env.NODE_ENV || "dev"}`,
  // SSL: ativar em produção/staging com host remoto, desativar para localhost
  ssl:
    (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging") &&
    process.env.DB_HOST !== "localhost"
      ? true // Validação SSL ativada apenas para hosts remotos
      : false, // Localhost não precisa SSL
};

// Validar que todas as variáveis necessárias estão definidas
const requiredEnvVars = [
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
  console.error(`❌ Variáveis de ambiente faltando: ${missingVars.join(", ")}`);
  console.error(`📝 Carregando de: ${envFile}`);
  process.exit(1);
}

const pool = new Pool(poolConfig);

// Event listeners para debug
pool.on("error", (err) => {
  console.error("❌ Erro inesperado no pool de conexões:", err);
});

pool.on("connect", () => {
  console.log(
    `✅ Conexão PostgreSQL estabelecida (${
      process.env.NODE_ENV || "development"
    })`
  );
});

/**
 * Função para testar conexão com o banco de dados
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const result = await pool.query("SELECT NOW() as current_time");
    console.log("✅ Banco de dados conectado com sucesso");
    console.log(`   Hora do servidor: ${result.rows[0].current_time}`);
    return true;
  } catch (error) {
    console.error("❌ Falha na conexão com o banco de dados:", error);
    return false;
  }
}

/**
 * Função para desconectar do pool
 */
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await pool.end();
    console.log("✅ Conexão com banco de dados encerrada");
  } catch (error) {
    console.error("❌ Erro ao encerrar conexão:", error);
  }
}

export default pool;
