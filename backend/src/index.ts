import express, { Express, Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
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
import pdfRoutes from "./routes/pdf.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app: Express = express();
const httpServer = createServer(app);

// ==================== LOGS DE INICIALIZAÇÃO ====================
console.log("\n🚀 Inicializando Caderneta API...\n");

// Variáveis de ambiente
console.log("📋 Variáveis de Ambiente:");
console.log(`  ✓ NODE_ENV: ${process.env.NODE_ENV || "não definido"}`);
console.log(`  ✓ API_PORT: ${process.env.API_PORT || "não definido"}`);
console.log(`  ✓ API_URL: ${process.env.API_URL || "não definido"}`);
console.log(`  ✓ DB_HOST: ${process.env.DB_HOST || "não definido"}`);
console.log(`  ✓ DB_PORT: ${process.env.DB_PORT || "não definido"}`);
console.log(`  ✓ DB_USER: ${process.env.DB_USER || "não definido"}`);
console.log(`  ✓ DB_NAME: ${process.env.DB_NAME || "não definido"}`);
console.log(
  `  ✓ JWT_SECRET: ${process.env.JWT_SECRET ? "✅ Configurado" : "❌ Não definido"}`,
);
console.log(
  `  ✓ JWT_REFRESH_SECRET: ${process.env.JWT_REFRESH_SECRET ? "✅ Configurado" : "❌ Não definido"}`,
);
console.log(
  `  ✓ BREVO_API_KEY: ${process.env.BREVO_API_KEY ? "✅ Configurado" : "❌ Não definido"}`,
);
console.log(
  `  ✓ BREVO_SENDER_EMAIL: ${process.env.BREVO_SENDER_EMAIL || "não definido"}`,
);
console.log(
  `  ✓ BREVO_SENDER_NAME: ${process.env.BREVO_SENDER_NAME || "não definido"}\n`,
);

// Confiar em proxy (Cloudflare, Nginx, etc)
app.set("trust proxy", 1);

// ==================== SOCKET.IO ====================
export const io = new Server(httpServer, {
  cors: {
    origin: config.cors.origin,
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("🔌 Cliente conectado:", socket.id);

  // Cliente entra na sala do seu usuário
  socket.on("entrar-sala-usuario", (usuarioId: number) => {
    socket.join(`usuario-${usuarioId}`);
    console.log(`👤 Usuário ${usuarioId} entrou na sala`);
  });

  socket.on("disconnect", () => {
    console.log("❌ Cliente desconectado:", socket.id);
  });
});

// Função para notificar mudança no total a receber
export function notificarTotalAReceberAtualizado(
  usuarioId: number,
  novoTotal: number,
) {
  io.to(`usuario-${usuarioId}`).emit("total-atualizado", novoTotal);
  console.log(
    `📡 Notificado usuário ${usuarioId}: novo total = R$ ${novoTotal}`,
  );
}

// Função para notificar mudança no saldo de um cliente específico
export function notificarSaldoClienteAtualizado(
  usuarioId: number,
  clienteId: number,
  novoSaldo: number,
) {
  io.to(`usuario-${usuarioId}`).emit("saldo-cliente-atualizado", {
    cliente_id: clienteId,
    saldo_devedor: novoSaldo,
    timestamp: new Date().toISOString(),
  });
  console.log(`📡 Cliente ${clienteId}: saldo atualizado para R$ ${novoSaldo}`);
}

// ==================== MIDDLEWARE ====================

// Segurança
app.use(helmet());

// CORS configurável por ambiente
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  }),
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

// Rotas de dashboard
app.use("/api/v1/dashboard", dashboardRoutes);

// Rotas de clientes
app.use("/api/v1/clientes", clienteRoutes);

// Rotas de movimentos (aninhadas em clientes)
app.use("/api/v1/clientes/:clienteId/movimentos", movimentoRoutes);

// Rotas de PDF (aninhadas em clientes)
app.use("/api/v1/clientes/:clienteId", pdfRoutes);

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

    // Iniciar servidor HTTP com Socket.io
    httpServer.listen(config.server.port, "0.0.0.0", () => {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🚀 SERVIDOR CADERNETA INICIADO`);
      console.log(`${"=".repeat(60)}`);
      console.log(`📍 Porta: ${config.server.port}`);
      console.log(`🌍 Ambiente: ${config.env.toUpperCase()}`);
      console.log(`📡 URL: ${config.server.apiUrl}`);
      console.log(
        `🗄️  Banco: ${config.database.host}:${config.database.port}/${config.database.name}`,
      );
      console.log(`✅ API pronta em http://localhost:${config.server.port}`);
      console.log(
        `✅ Health check: http://localhost:${config.server.port}/api/v1/health`,
      );
      console.log(
        `✅ DB check: http://localhost:${config.server.port}/api/v1/health/db`,
      );
      console.log(`🔌 WebSocket ativo em ws://localhost:${config.server.port}`);
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
