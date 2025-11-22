# 🔧 Configuração de Ambientes - Caderneta

## Visão Geral

O projeto Caderneta suporta **3 ambientes**: `development`, `staging` e `production`. Todos os hardcodes foram removidos e as configurações são controladas via variáveis de ambiente.

## 📁 Estrutura de Configuração

### Backend

```
backend/
├── .env.local          (desenvolvimento local)
├── .env.staging        (staging)
├── .env.production     (produção)
└── .env.example        (template)
```

### Frontend

```
frontend/
├── .env.local          (desenvolvimento local)
├── .env.staging        (staging)
├── .env.production     (produção)
├── .env.example        (template)
└── config.ts           (carrega configurações)
```

## 🚀 Como Usar

### Backend

#### Desenvolvimento Local

```bash
cd backend
npm run dev  # Usa .env.local automaticamente (NODE_ENV=development)
```

#### Staging

```bash
cd backend
NODE_ENV=staging npm run dev
```

#### Produção

```bash
cd backend
NODE_ENV=production npm start  # npm run build && node dist/index.js
```

### Frontend

#### Desenvolvimento Local

```bash
cd frontend
npx expo start
# Usa .env.local automaticamente (EXPO_PUBLIC_ENV=development)
```

#### Staging

```bash
cd frontend
EXPO_PUBLIC_ENV=staging npx expo start
```

#### Produção (Build)

```bash
cd frontend
EXPO_PUBLIC_ENV=production eas build  # ou expo build
```

## 🔐 Variáveis de Ambiente

### Backend

| Variável                  | Desenvolvimento         | Staging                               | Produção                      |
| ------------------------- | ----------------------- | ------------------------------------- | ----------------------------- |
| `NODE_ENV`                | `development`           | `staging`                             | `production`                  |
| `API_PORT`                | `3000`                  | `3000`                                | `3000`                        |
| `API_URL`                 | `http://localhost:3000` | `https://api-staging.seu-dominio.com` | `https://api.seu-dominio.com` |
| `DB_HOST`                 | `localhost`             | `db.staging.seu-dominio.com`          | `db.seu-dominio.com`          |
| `JWT_SECRET`              | chave local dev         | **GERAR SEGURA**                      | **GERAR SEGURA**              |
| `CORS_ORIGIN`             | `http://localhost:*`    | URLs do staging                       | URLs de produção              |
| `RATE_LIMIT_MAX_REQUESTS` | `1000`                  | `500`                                 | `100`                         |

### Frontend

| Variável                     | Desenvolvimento         | Staging                               | Produção                      |
| ---------------------------- | ----------------------- | ------------------------------------- | ----------------------------- |
| `EXPO_PUBLIC_ENV`            | `development`           | `staging`                             | `production`                  |
| `EXPO_PUBLIC_API_URL`        | `http://localhost:3000` | `https://api-staging.seu-dominio.com` | `https://api.seu-dominio.com` |
| `EXPO_PUBLIC_ENABLE_LOGGING` | `true`                  | `true`                                | `false`                       |

## 🔑 Gerando Chaves JWT Seguras

Para produção e staging, gere chaves seguras:

```bash
# Gerar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Gerar JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copie os valores gerados para `.env.staging` e `.env.production`.

## ✅ Checklist de Deployment

### Antes de fazer Deploy em Staging

- [ ] Atualize `API_URL` em `.env.staging`
- [ ] Atualize `CORS_ORIGIN` em `.env.staging`
- [ ] Gere novas chaves `JWT_SECRET` e `JWT_REFRESH_SECRET`
- [ ] Configure credenciais do banco de dados de staging
- [ ] Teste localmente com `NODE_ENV=staging npm run dev`

### Antes de fazer Deploy em Produção

- [ ] Atualize `API_URL` em `.env.production`
- [ ] Atualize `CORS_ORIGIN` em `.env.production`
- [ ] Gere novas chaves `JWT_SECRET` e `JWT_REFRESH_SECRET`
- [ ] Configure credenciais do banco de dados de produção
- [ ] Desabilite logging com `EXPO_PUBLIC_ENABLE_LOGGING=false`
- [ ] Teste todos os endpoints em staging
- [ ] Faça backup do banco de dados

## 🔄 Fluxo de Comunicação API

```
Local Development:
Frontend (localhost:5173) → Backend (localhost:3000)
                           ↓
                       PostgreSQL (localhost:5432)

Staging:
Frontend (staging.seu-dominio.com) → Backend (api-staging.seu-dominio.com)
                                      ↓
                                  DB Staging

Produção:
Frontend (seu-dominio.com) → Backend (api.seu-dominio.com)
                              ↓
                          DB Produção
```

## 🐛 Debugging

### Para verificar qual ambiente está sendo usado:

**Backend:**

```bash
# Verifica NODE_ENV e carrega correto .env
node -e "require('dotenv').config({ path: '.env.local' }); console.log(process.env.NODE_ENV)"
```

**Frontend:**

```bash
# Verifica EXPO_PUBLIC_ENV e API_URL
npx expo-env-info  # mostra todas as variáveis public
```

## 📝 Exemplos Práticos

### Rodando Backend em Desenvolvimento

```bash
cd backend
npm install
npm run dev
# Output: 🚀 SERVIDOR CADERNETA INICIADO
# 📍 Porta: 3000
# 🌍 Ambiente: DEVELOPMENT
```

### Rodando Frontend em Desenvolvimento

```bash
cd frontend
npm install
npx expo start
# Escanear QR code com Expo Go
# O app conectará em http://localhost:3000
```

### Mudando para Staging

```bash
# Terminal 1: Backend
cd backend
NODE_ENV=staging npm run dev

# Terminal 2: Frontend
cd frontend
EXPO_PUBLIC_ENV=staging npx expo start
```

## ⚠️ Advertências Importantes

1. **Nunca** commit arquivos `.env.local`, `.env.staging` ou `.env.production`
2. **Sempre** use chaves JWT diferentes para cada ambiente
3. **Em produção**, desabilite logs e use HTTPS
4. **Backup** do banco de dados antes de qualquer deploy
5. **Teste** tudo em staging antes de produção

## 🆘 Troubleshooting

**Backend não conecta ao banco de dados?**

- Verifique `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` no `.env`
- Certifique-se que PostgreSQL está rodando

**Frontend não conecta à API?**

- Verifique `EXPO_PUBLIC_API_URL` no `.env`
- Certifique-se que o backend está rodando
- Verifique `CORS_ORIGIN` no backend

**Erro de token JWT?**

- Chaves JWT diferentes entre ambientes causam erro
- Gere novas chaves com o comando acima
- Limpe AsyncStorage do app (App → Settings → Clear Cache)
