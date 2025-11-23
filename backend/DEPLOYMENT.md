# 🚀 Guia de Deployment - Caderneta API

## 📋 Índice
1. [Pre-Requisitos](#pre-requisitos)
2. [Preparação Local](#preparação-local)
3. [Railway Setup](#railway-setup-recomendado)
4. [Vercel Setup](#vercel-setup-alternativa)
5. [Variáveis de Ambiente](#variáveis-de-ambiente)
6. [Monitoramento](#monitoramento)
7. [Troubleshooting](#troubleshooting)

---

## 📋 Pre-Requisitos

### Contas Necessárias
- [ ] GitHub account (para repositório)
- [ ] Railway account (ou Vercel)
- [ ] PostgreSQL Database gerenciado

### Ferramentas Locais
```bash
# Node.js 18+
node --version

# npm 9+
npm --version

# Git
git --version

# Vercel CLI (opcional)
npm install -g vercel
```

---

## 🔧 Preparação Local

### 1. Verificar compilação
```bash
cd backend
npm install
npm run build
```

Deve gerar pasta `/dist` sem erros.

### 2. Testar em modo produção
```bash
# Criar .env.production com todas as variáveis
cp .env.example .env.production

# Preencher com valores de teste
API_URL=http://localhost:3000
DB_HOST=seu-db.railway.app
DB_USER=postgres
DB_PASSWORD=sua-senha
DB_NAME=caderneta
JWT_SECRET=use-openssl-rand-hex-32
JWT_REFRESH_SECRET=use-openssl-rand-hex-32

# Testar
NODE_ENV=production npm start
```

### 3. Verificar endpoints
```bash
# Health check
curl http://localhost:3000/api/v1/health

# Database check
curl http://localhost:3000/api/v1/health/db
```

### 4. Git push (branch production)
```bash
git checkout production
git add .
git commit -m "chore: prepare for production deployment"
git push origin production
```

---

## 🚂 Railway Setup (RECOMENDADO)

### Passo 1: Criar Projeto Railway

1. Acesse [railway.app](https://railway.app)
2. Clique em "New Project"
3. Selecione "Deploy from GitHub"
4. Conecte sua conta GitHub
5. Selecione repositório: `caderneta`
6. Selecione branch: `production`

### Passo 2: Adicionar PostgreSQL

1. No dashboard Railway, clique em "Add a service"
2. Selecione "PostgreSQL"
3. Aguarde iniciar (geralmente 1-2 minutos)

### Passo 3: Configurar Variáveis de Ambiente

No Railway, vá para "Variables" e adicione:

```bash
# Ambiente
NODE_ENV=production

# Servidor
API_PORT=3000
API_URL=https://seu-railway-app.railway.app

# Database (Railway fornece)
DB_HOST=seu-railway-postgres-host
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua-senha-postgresql
DB_NAME=railway

# JWT (Gere chaves seguras!)
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

# CORS (seu frontend Vercel)
CORS_ORIGIN=https://seu-frontend.vercel.app

# Rate Limit
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### Passo 4: Deploy

1. Railway detecta mudanças no git automaticamente
2. Clique em "Deployments" para acompanhar
3. Verificar logs em "Logs"

### Passo 5: Testar API em Produção

```bash
# Health check
curl https://seu-railway-app.railway.app/api/v1/health

# Database check
curl https://seu-railway-app.railway.app/api/v1/health/db
```

---

## ⚡ Vercel Setup (Alternativa)

### Passo 1: Conectar Vercel

```bash
cd backend
vercel --prod --yes
```

### Passo 2: Configurar Variáveis

No Vercel Dashboard → Settings → Environment Variables:

```
NODE_ENV=production
API_PORT=3000
API_URL=https://seu-api-vercel.app
DB_HOST=seu-postgres-host
DB_USER=postgres
DB_PASSWORD=...
DB_NAME=caderneta
JWT_SECRET=...
JWT_REFRESH_SECRET=...
CORS_ORIGIN=https://seu-frontend.vercel.app
```

### Passo 3: Verificar Deploy

```bash
# Via Vercel CLI
vercel logs

# Via URL
curl https://seu-api-vercel.app/api/v1/health
```

---

## 🔐 Variáveis de Ambiente

### Gerar Chaves Seguras

```bash
# JWT_SECRET (64 caracteres)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# JWT_REFRESH_SECRET (diferente do anterior)
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Checklist de Segurança

- [ ] Nunca usar valores padrão (default-secret-key)
- [ ] JWT_SECRET ≠ JWT_REFRESH_SECRET
- [ ] Mínimo 32 bytes (64 caracteres hex)
- [ ] Guardar em local seguro (LastPass, 1Password)
- [ ] Trocar a cada 90 dias em produção

---

## 📊 Monitoramento

### Railway Logs

```bash
# Ver logs em tempo real
railway logs

# Ver logs de erro
railway logs --error
```

### Health Checks

```bash
# API Status
GET https://seu-api.railway.app/api/v1/health

# Response esperado:
{
  "status": "ok",
  "environment": "production",
  "timestamp": "2024-11-23T..."
}

# Database Status
GET https://seu-api.railway.app/api/v1/health/db

# Response esperado:
{
  "status": "ok",
  "database": "connected",
  "timestamp": "...",
  "environment": "production"
}
```

### Alertas Recomendados

Configure em Railway/Vercel:
- [ ] Deploy falhou
- [ ] App crashed
- [ ] High memory usage
- [ ] High CPU usage
- [ ] Database disconnected

---

## 🐛 Troubleshooting

### Erro: "Cannot connect to database"

```
Causa: Credenciais incorretas ou host inacessível

Solução:
1. Verificar DB_HOST está correto
2. Verificar DB_USER e DB_PASSWORD
3. Verificar firewall permite conexão
4. Testar localmente com mesmas creds
```

### Erro: "Rate limiting activated"

```
Causa: Muitas requisições no curto tempo

Solução:
1. Aumentar RATE_LIMIT_MAX_REQUESTS
2. Implementar retry logic no frontend
3. Usar caching quando possível
```

### Erro: "CORS not allowed"

```
Causa: Frontend URL não está em CORS_ORIGIN

Solução:
1. Adicionar URL do frontend em CORS_ORIGIN
2. Usar wildcard apenas em desenvolvimento
3. Regenerar deploy após mudança
```

### Erro: "Out of memory"

```
Causa: Connection pool muito grande ou memory leak

Solução:
1. Reduzir DB connection pool (max: 10)
2. Implementar pagination em queries
3. Aumentar memória da função
4. Usar connection pooler externo
```

### Deploy não atualiza

```
Causa: Cache ou branch errado

Solução:
1. Limpar cache: railway build --clear-cache
2. Verificar branch: git branch -v
3. Force redeploy no dashboard
```

---

## 🔄 CI/CD com GitHub Actions

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [production]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build
        run: |
          cd backend
          npm install
          npm run build
      
      - name: Deploy to Railway
        run: |
          npx @railway/cli deploy
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 📝 Checklist Final

- [ ] .env.production preenchido
- [ ] JWT_SECRET e JWT_REFRESH_SECRET gerados
- [ ] CORS_ORIGIN setado para frontend
- [ ] DB credenciais testadas localmente
- [ ] Build sem erros (`npm run build`)
- [ ] Código feito push na branch production
- [ ] Railway/Vercel configurado
- [ ] Environment variables adicionadas
- [ ] Deploy executado
- [ ] Health checks passando
- [ ] Frontend apontando para API correta
- [ ] Logs sendo monitorados

---

## 📞 Suporte

Para dúvidas:
1. Verificar DEPLOY_ANALYSIS.md
2. Checar logs (Railway ou Vercel)
3. Testar endpoints com curl/Postman
4. Verificar status de Database

