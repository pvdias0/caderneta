import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import config from "./config/index.js";
import pool, {
  testDatabaseConnection,
  closeDatabaseConnection,
} from "./config/database.js";
import authRoutes from "./routes/auth.routes.js";
import clienteRoutes from "./routes/cliente.routes.js";
import produtoRoutes from "./routes/produto.routes.js";
import movimentoRoutes from "./routes/movimento.routes.js";

const app: Express = express();

// ==================== MIDDLEWARE ====================

// Segurança
app.use(helmet());

// CORS configurável por ambiente
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: "Muitas requisições, tente novamente mais tarde",
});
app.use(limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Cookie parsing (para HTTP-only cookies)
app.use(cookieParser());

// Logger middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ==================== ROTAS ====================

// Rota raiz
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "🎯 Caderneta API v1.0.0 - Sistema de Fiado Digitalizado",
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// Health check básico
app.get("/api/v1/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// Health check do banco de dados
app.get("/api/v1/health/db", async (req: Request, res: Response) => {
  try {
    const result = await pool.query("SELECT NOW() as current_time");
    res.status(200).json({
      status: "ok",
      database: "connected",
      timestamp: result.rows[0].current_time,
      environment: config.env,
    });
  } catch (error) {
    res.status(503).json({
      status: "error",
      database: "disconnected",
      error: String(error),
    });
  }
});

// Rotas de autenticação
app.use("/api/v1/auth", authRoutes);

// Rotas de clientes
app.use("/api/v1/clientes", clienteRoutes);

// Rotas de movimentos (aninhadas em clientes)
app.use("/api/v1/clientes/:clienteId/movimentos", movimentoRoutes);

// Rotas de produtos (estoque)
app.use("/api/v1/produtos", produtoRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Rota não encontrada",
    path: req.path,
    method: req.method,
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("❌ Erro não tratado:", err);
  res.status(500).json({
    error: "Erro interno do servidor",
    message: config.isDevelopment
      ? err.message
      : "Entre em contato com o suporte",
  });
});

// ==================== INICIALIZAÇÃO ====================

async function startServer() {
  try {
    // Testar conexão com banco de dados
    const dbConnected = await testDatabaseConnection();

    if (!dbConnected && config.isProduction) {
      throw new Error("❌ Falha ao conectar com o banco de dados em produção");
    }

    if (!dbConnected && !config.isDevelopment) {
      console.warn("⚠️ Aviso: Banco de dados não disponível em staging");
    }

    // Iniciar servidor
    app.listen(config.server.port, "0.0.0.0", () => {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🚀 SERVIDOR CADERNETA INICIADO`);
      console.log(`${"=".repeat(60)}`);
      console.log(`📍 Porta: ${config.server.port}`);
      console.log(`🌍 Ambiente: ${config.env.toUpperCase()}`);
      console.log(`📡 URL: ${config.server.apiUrl}`);
      console.log(
        `🗄️  Banco: ${config.database.host}:${config.database.port}/${config.database.name}`
      );
      console.log(`✅ API pronta em http://localhost:${config.server.port}`);
      console.log(
        `✅ Health check: http://localhost:${config.server.port}/api/v1/health`
      );
      console.log(
        `✅ DB check: http://localhost:${config.server.port}/api/v1/health/db`
      );
      console.log(`${"=".repeat(60)}\n`);
    });
  } catch (error) {
    console.error("❌ Falha ao iniciar servidor:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n📛 Encerrando servidor...");
  await closeDatabaseConnection();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n📛 Encerrando servidor...");
  await closeDatabaseConnection();
  process.exit(0);
});

export default app;

// Iniciar servidor
startServer().catch((error) => {
  console.error("Erro fatal:", error);
  process.exit(1);
});
