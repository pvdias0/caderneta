# ✅ Configuração de Ambientes - Resumo das Mudanças

## 🎯 Objetivo Alcançado

Remover todos os hardcodes e criar uma estrutura flexível para **desenvolvimento**, **staging** e **produção**.

---

## 📦 O que foi criado/atualizado

### 1️⃣ Backend - Arquivos `.env`

| Arquivo           | Propósito                                        |
| ----------------- | ------------------------------------------------ |
| `.env.example`    | Template com comentários (não deve ser alterado) |
| `.env.local`      | **Desenvolvimento local** (já no git)            |
| `.env.staging`    | **Staging** (mude domínios/senhas reais)         |
| `.env.production` | **Produção** (mude domínios/senhas reais)        |

**Localização:** `/backend/.env.*`

### 2️⃣ Frontend - Arquivos `.env`

| Arquivo           | Propósito                                |
| ----------------- | ---------------------------------------- |
| `.env.example`    | Template com comentários                 |
| `.env.local`      | **Desenvolvimento local** ✅ Configurado |
| `.env.staging`    | **Staging** (genérico)                   |
| `.env.production` | **Produção** (genérico)                  |

**Localização:** `/frontend/.env.*`

### 3️⃣ Configuração Frontend

**Arquivo:** `/frontend/config.ts`

- ✅ Removido hardcode de `'http://localhost:3000'`
- ✅ Adicionado suporte a múltiplos ambientes
- ✅ Adicionado validação de variáveis obrigatórias
- ✅ Adicionado logging condicional por ambiente

### 4️⃣ Documentação & Scripts

| Arquivo                   | Descrição                                       |
| ------------------------- | ----------------------------------------------- |
| `/ENVIRONMENT_CONFIG.md`  | 📖 Guia completo de configuração (com exemplos) |
| `/.gitignore`             | 🔐 Protege `.env` e outros arquivos sensíveis   |
| `/scripts/env-manager.js` | 🔧 Script helper para gerenciar ambientes       |

---

## 🚀 Como Usar

### Desenvolvimento Local (Padrão)

**Backend:**

```bash
cd backend
npm run dev  # Usa .env.local automaticamente
```

**Frontend:**

```bash
cd frontend
npx expo start  # Usa .env.local automaticamente
```

### Staging

**Backend:**

```bash
cd backend
NODE_ENV=staging npm run dev
```

**Frontend:**

```bash
cd frontend
EXPO_PUBLIC_ENV=staging npx expo start
```

### Produção

**Backend:**

```bash
cd backend
NODE_ENV=production npm run build
NODE_ENV=production npm start
```

**Frontend (Build):**

```bash
cd frontend
EXPO_PUBLIC_ENV=production eas build
```

---

## 📋 Variáveis de Ambiente

### Backend

**Núcleo:**

```env
NODE_ENV=development          # development, staging, production
API_PORT=3000                 # Porta do servidor
API_URL=http://localhost:3000 # URL pública da API
```

**Banco de Dados:**

```env
DB_HOST=localhost             # Host do PostgreSQL
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=senha_local
DB_NAME=caderneta_dev
```

**Segurança (JWT):**

```env
JWT_SECRET=dev-secret-key...              # ⚠️ Gerar novo em produção
JWT_EXPIRE=24h
JWT_REFRESH_SECRET=dev-refresh-secret...  # ⚠️ Gerar novo em produção
JWT_REFRESH_EXPIRE=7d
```

**CORS & Rate Limiting:**

```env
CORS_ORIGIN=http://localhost:3001,...     # URLs permitidas
RATE_LIMIT_WINDOW=15                      # em minutos
RATE_LIMIT_MAX_REQUESTS=1000              # por janela
```

### Frontend

```env
EXPO_PUBLIC_ENV=development               # development, staging, production
EXPO_PUBLIC_API_URL=http://localhost:3000 # URL da API
EXPO_PUBLIC_API_TIMEOUT=30000             # timeout em ms
EXPO_PUBLIC_ENABLE_LOGGING=true           # debug logs
```

---

## 🔐 Segurança

### ✅ O que está protegido

- ✅ `.env.*` files no `.gitignore`
- ✅ Chaves JWT diferentes por ambiente
- ✅ Senhas não hardcoded
- ✅ URLs não hardcoded
- ✅ Logging desabilitado em produção

### ⚠️ O que você precisa fazer

1. **Gerar chaves JWT seguras para staging e produção:**

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Atualizar valores reais em `.env.staging` e `.env.production`:**

   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`
   - `DB_NAME`
   - `JWT_SECRET` e `JWT_REFRESH_SECRET` (gerar novas chaves)
   - `API_URL` e `CORS_ORIGIN` (com domínios reais)
   - `EXPO_PUBLIC_API_URL` (com domínio real)

3. **Nunca** fazer commit de arquivos `.env` (exceto `.env.example`)

---

## 🔄 Fluxo de Dados

```
┌─────────────────────────────────────────────────────────┐
│                   DESENVOLVIMENTO                       │
├─────────────────────────────────────────────────────────┤
│ Frontend (.env.local)  →  Backend (.env.local)         │
│ localhost:5173 (Expo)  →  localhost:3000 (API)         │
│                          ↓                              │
│                    localhost:5432 (DB)                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     STAGING                             │
├─────────────────────────────────────────────────────────┤
│ Frontend (.env.staging)  →  Backend (.env.staging)     │
│ staging.seu-dominio.com  →  api-staging.seu-dominio.com│
│                          ↓                              │
│                    db.staging.seu-dominio.com          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     PRODUÇÃO                            │
├─────────────────────────────────────────────────────────┤
│ Frontend (.env.production)  →  Backend (.env.production)│
│ seu-dominio.com             →  api.seu-dominio.com     │
│                          ↓                              │
│                    db.seu-dominio.com                  │
└─────────────────────────────────────────────────────────┘
```

---

## 📚 Documentação

Para mais detalhes, consulte:

- **[`/ENVIRONMENT_CONFIG.md`](../ENVIRONMENT_CONFIG.md)** - Guia completo
- **Backend Config**: `/backend/src/config/index.ts`
- **Frontend Config**: `/frontend/config.ts`

---

## 🆘 Troubleshooting

### Frontend não conecta à API

```bash
# Verificar se EXPO_PUBLIC_API_URL está correto
cat .env.local | grep EXPO_PUBLIC_API_URL

# Verificar se backend está rodando
curl http://localhost:3000/api/v1/health
```

### Backend não inicia

```bash
# Verificar variáveis de ambiente
node -e "require('dotenv').config({ path: '.env.local' }); console.log(process.env)"

# Verificar conectividade do banco
psql -h localhost -U postgres -d caderneta_dev
```

### Erro de Token JWT

```bash
# Tokens de diferentes ambientes não são compatíveis
# Limpar cache do app:
# App → Settings → Clear Cache

# Ou regenerar novo token no backend
```

---

## ✨ Próximos Passos

1. **Staging & Produção:**

   - [ ] Atualizar URLs reais em `.env.staging` e `.env.production`
   - [ ] Gerar chaves JWT seguras
   - [ ] Configurar banco de dados remoto

2. **CI/CD:**

   - [ ] Configurar GitHub Actions / GitLab CI
   - [ ] Automatizar build e deploy por ambiente

3. **Monitoramento:**
   - [ ] Adicionar logging centralizado (Sentry, DataDog)
   - [ ] Configurar alertas de erro

---

**✅ Configuração completa! Nenhum hardcode no código.** 🎉
