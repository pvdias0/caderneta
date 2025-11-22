#!/usr/bin/env node

/**
 * Script para gerenciar ambientes
 * Uso: node scripts/env-manager.js <comando> [ambiente]
 *
 * Comandos:
 *   list              - Lista variáveis de ambiente carregadas
 *   set <ambiente>    - Configura qual ambiente usar
 *   validate          - Valida se todas as variáveis necessárias existem
 */

const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const args = process.argv.slice(2);
const command = args[0];
const environment = args[1] || "local";

const PROJECT_ROOT = path.dirname(path.dirname(__filename));
const ENV_FILE = path.join(PROJECT_ROOT, `.env.${environment}`);

// Variáveis obrigatórias por ambiente
const REQUIRED_VARS = {
  backend: {
    all: [
      "NODE_ENV",
      "API_PORT",
      "API_URL",
      "DB_HOST",
      "DB_PORT",
      "DB_USER",
      "DB_PASSWORD",
      "DB_NAME",
    ],
    production: ["JWT_SECRET", "JWT_REFRESH_SECRET"],
  },
  frontend: {
    all: ["EXPO_PUBLIC_ENV", "EXPO_PUBLIC_API_URL"],
    production: [],
  },
};

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Arquivo não encontrado: ${filePath}`);
    process.exit(1);
  }

  const result = dotenv.config({ path: filePath });
  if (result.error) {
    console.error(`❌ Erro ao carregar .env: ${result.error}`);
    process.exit(1);
  }

  return result.parsed || {};
}

function listVars() {
  const env = loadEnv(ENV_FILE);

  console.log(`\n📋 Variáveis carregadas de: ${path.basename(ENV_FILE)}\n`);

  Object.entries(env).forEach(([key, value]) => {
    // Mascarar valores sensíveis
    const isSensitive = ["PASSWORD", "SECRET", "TOKEN"].some((s) =>
      key.includes(s)
    );
    const displayValue = isSensitive ? "***" : value;
    console.log(`  ${key}: ${displayValue}`);
  });

  console.log();
}

function validate() {
  const env = loadEnv(ENV_FILE);
  const nodeEnv = env.NODE_ENV || env.EXPO_PUBLIC_ENV || "local";
  const isProduction = nodeEnv === "production" || environment === "production";

  // Detectar se é backend ou frontend
  const isBackend = fs.existsSync(path.join(PROJECT_ROOT, "src/index.ts"));
  const requiredVars = isBackend
    ? [
        ...REQUIRED_VARS.backend.all,
        ...(isProduction ? REQUIRED_VARS.backend.production : []),
      ]
    : [
        ...REQUIRED_VARS.frontend.all,
        ...(isProduction ? REQUIRED_VARS.frontend.production : []),
      ];

  const missing = requiredVars.filter((v) => !env[v]);

  if (missing.length === 0) {
    console.log(`\n✅ Todas as variáveis necessárias estão configuradas!\n`);
    listVars();
  } else {
    console.error(`\n❌ Variáveis faltando:\n`);
    missing.forEach((v) => console.error(`  - ${v}`));
    console.error();
    process.exit(1);
  }
}

function setEnvironment() {
  // Este script apenas informa qual .env usar
  console.log(`\n📍 Para usar o ambiente '${environment}', execute:\n`);

  if (process.platform === "win32") {
    console.log(`  Desenvolvimento (Backend):`);
    console.log(`    $env:NODE_ENV='${environment}'; npm run dev\n`);
    console.log(`  Desenvolvimento (Frontend):`);
    console.log(`    $env:EXPO_PUBLIC_ENV='${environment}'; npx expo start\n`);
  } else {
    console.log(`  Desenvolvimento (Backend):`);
    console.log(`    NODE_ENV=${environment} npm run dev\n`);
    console.log(`  Desenvolvimento (Frontend):`);
    console.log(`    EXPO_PUBLIC_ENV=${environment} npx expo start\n`);
  }

  console.log(`\n  Arquivo .env usado: .env.${environment}\n`);
}

function showHelp() {
  console.log(`
🔧 Gerenciador de Ambientes - Caderneta

Uso: node scripts/env-manager.js <comando> [ambiente]

Comandos:
  list              Lista variáveis de ambiente carregadas
  set <ambiente>    Exibe comando para configurar ambiente (development/staging/production)
  validate          Valida se todas as variáveis necessárias existem

Exemplos:
  node scripts/env-manager.js list local
  node scripts/env-manager.js list staging
  node scripts/env-manager.js validate production
  node scripts/env-manager.js set staging

Ambientes:
  local             Desenvolvimento local (.env.local)
  staging           Staging (.env.staging)
  production        Produção (.env.production)
  `);
}

// Executar comando
switch (command) {
  case "list":
    listVars();
    break;
  case "validate":
    validate();
    break;
  case "set":
    setEnvironment();
    break;
  default:
    showHelp();
}
