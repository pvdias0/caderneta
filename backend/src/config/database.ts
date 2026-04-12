import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";
import path from "path";

const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : process.env.NODE_ENV === "staging"
      ? ".env.staging"
      : ".env.local";

dotenv.config({ path: path.resolve(envFile) });

const dbSslMode = (process.env.DB_SSL || "false").toLowerCase();
const useDbSsl = ["true", "1", "require"].includes(dbSslMode);
const rejectUnauthorized = !["false", "0", "no-verify"].includes(
  (process.env.DB_SSL_REJECT_UNAUTHORIZED || "true").toLowerCase(),
);

const poolConfig: PoolConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: process.env.NODE_ENV === "production" ? 20 : 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  application_name: `caderneta-${process.env.NODE_ENV || "dev"}`,
  ssl: useDbSsl
    ? {
        rejectUnauthorized,
      }
    : false,
};

const requiredEnvVars = [
  "DB_HOST",
  "DB_PORT",
  "DB_USER",
  "DB_PASSWORD",
  "DB_NAME",
];
const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
  console.error(`Variaveis de ambiente faltando: ${missingVars.join(", ")}`);
  console.error(`Carregando de: ${envFile}`);
  process.exit(1);
}

console.log(
  `DB SSL: ${useDbSsl ? `habilitado (rejectUnauthorized=${rejectUnauthorized})` : "desabilitado"}`,
);

const pool = new Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Erro inesperado no pool de conexoes:", err);
});

pool.on("connect", () => {
  console.log(
    `Conexao PostgreSQL estabelecida (${process.env.NODE_ENV || "development"})`,
  );
});

export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const result = await pool.query("SELECT NOW() as current_time");
    console.log("Banco de dados conectado com sucesso");
    console.log(`Hora do servidor: ${result.rows[0].current_time}`);
    return true;
  } catch (error) {
    console.error("Falha na conexao com o banco de dados:", error);
    return false;
  }
}

export async function closeDatabaseConnection(): Promise<void> {
  try {
    await pool.end();
    console.log("Conexao com banco de dados encerrada");
  } catch (error) {
    console.error("Erro ao encerrar conexao:", error);
  }
}

export default pool;
