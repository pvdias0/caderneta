# 🚀 QUICK START - Deploy Production (1 Hora)

## ⏱️ Timeline Esperado

| Fase | Tempo | O que fazer |
|------|-------|-----------|
| Prep | 10 min | Gerar chaves, preparar variáveis |
| Railway Setup | 15 min | Criar projeto, DB, variáveis |
| Backend Deploy | 10 min | Push código, Railway auto-deploy |
| Vercel Setup | 10 min | Conectar repo, variáveis |
| Frontend Deploy | 10 min | Push código, Vercel auto-deploy |
| Validação | 5 min | Testar endpoints, login |
| **TOTAL** | **~1h** | 🎉 Live! |

---

## 1️⃣ Preparação (10 minutos)

### Gerar Chaves Seguras
```bash
# Terminal - Execute no seu computador
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Salve em local SEGURO (1Password, LastPass, Sticky Notes)
```

### Preparar Documentos
```bash
# Abra em um editor de texto
cat backend/.env.production
cat frontend/.env.production

# Você vai preencher com valores reais
```

---

## 2️⃣ Railway Setup (15 minutos)

### Criar Projeto
1. Acesse: https://railway.app
2. Login com GitHub
3. "New Project" → "Deploy from GitHub"
4. Selecione: `caderneta` repository
5. Selecione branch: `production`
6. Aguarde primeiro deploy

### Adicionar PostgreSQL
1. No dashboard: "Add Service" → "PostgreSQL"
2. Aguarde iniciar (1-2 min)
3. Clique em PostgreSQL → "Connect"
4. Copie as credenciais:
   ```
   DB_HOST=seu-railway-postgres.railway.internal
   DB_USER=postgres
   DB_PASSWORD=sua-senha
   DB_NAME=railway
   DB_PORT=5432
   ```

### Configurar Variáveis Backend
Railway Dashboard → Backend App → Variables

```env
NODE_ENV=production
API_PORT=3000
API_URL=https://seu-railway-backend-[random].railway.app

DB_HOST=seu-railway-postgres.railway.internal
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=sua-senha-aqui
DB_NAME=railway

JWT_SECRET=colar-o-valor-gerado
JWT_REFRESH_SECRET=colar-o-valor-gerado
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

CORS_ORIGIN=https://seu-frontend.vercel.app

RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

### Testar Backend
```bash
# Copie a URL do Backend (Railway Dashboard)
# Veja em: Deployments → [latest] → URL

curl https://seu-railway-backend-[...].railway.app/api/v1/health
# Deve retornar: { "status": "ok", ... }
```

---

## 3️⃣ Backend Deploy (Automático)

Quando você fez Git push na branch `production`:
- ✅ Railway detectou mudanças
- ✅ Build automático iniciou
- ✅ Deploy em progresso
- ✅ Aguarde ~3-5 minutos

**Verificar status**: Railway Dashboard → Deployments → Logs

---

## 4️⃣ Vercel Setup (10 minutos)

### Conectar Frontend
1. Acesse: https://vercel.com
2. Login com GitHub
3. "Add New Project" → Selecione `caderneta`
4. Selecione `./frontend` como root
5. "Deploy"

### Configurar Variáveis
Vercel Dashboard → Settings → Environment Variables

```env
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_URL=https://seu-railway-backend-[random].railway.app
EXPO_PUBLIC_ENABLE_LOGGING=false
```

### Redeploy
1. Settings → Deployments
2. "Redeploy" o last commit
3. Aguarde ~2-3 minutos

---

## 5️⃣ Frontend Deploy (Automático)

Quando você configurou as variáveis:
- ✅ Vercel detectou mudanças
- ✅ Build iniciou
- ✅ Deploy em progresso
- ✅ Aguarde ~2-3 minutos

**Verificar status**: Vercel Dashboard → Deployments

---

## ✅ Validação Final (5 minutos)

### Backend Checks
```bash
# Substituir [xxx] pela URL real do Railway

# 1. Health
curl https://seu-railway-backend-[xxx].railway.app/api/v1/health
# ✅ Response: { "status": "ok", "environment": "production" }

# 2. Database
curl https://seu-railway-backend-[xxx].railway.app/api/v1/health/db
# ✅ Response: { "status": "ok", "database": "connected" }
```

### Frontend Checks
1. Abra: `https://seu-frontend.vercel.app`
2. ✅ App carrega sem erros
3. ✅ Tente fazer login
4. ✅ Home mostra "Total a Receber"
5. ✅ Clique em "Clientes" (deve listar)

### Integration Test
1. Frontend faz requisição para Backend
2. DevTools Console (F12) não mostra CORS error
3. Dados carregam corretamente

---

## 🎯 URLs Finais

```
Frontend: https://seu-frontend.vercel.app
Backend:  https://seu-railway-backend-[xxx].railway.app
```

**Guardar essas URLs!**

---

## 🔍 Se Algo Der Errado

### Backend não conecta ao banco
```bash
# Railway Dashboard → PostgreSQL → "Connect"
# Verificar se credenciais estão corretas
# Testar: psql -h host -U user -W -d database
```

### Frontend mostra CORS error
```bash
# 1. Verificar EXPO_PUBLIC_API_URL correto
# 2. Verificar CORS_ORIGIN no backend inclui frontend URL
# 3. Redeployer backend após mudança
```

### Deploy não atualiza
```bash
# Railway: Force rebuild
# Vercel: Redeploy last commit
# Ambos têm histórico de deployments
```

---

## 📊 Monitorar Depois

### Primeiras 24 Horas
- [ ] Verificar logs a cada 2 horas
- [ ] Testar login de verdade
- [ ] Testar criar cliente
- [ ] Testar criar movimento
- [ ] Testar gerar extrato

### Primeira Semana
- [ ] Verificar performance
- [ ] Coletar feedback
- [ ] Fix any issues
- [ ] Documentar runbook

---

## 🔐 Segurança Post-Deploy

- ✅ JWT secrets guardados seguro
- ✅ Database credentials seguras
- ✅ CORS_ORIGIN restritivo
- ✅ Logging em produção desativado
- ✅ Rate limiting ativo

---

## 🎉 Sucesso!

Quando completar todos os passos:

1. ✅ Backend em Railway
2. ✅ Frontend em Vercel
3. ✅ Conectados
4. ✅ Testados

### Você está LIVE! 🚀

---

## 📞 Quick Reference

### URLs
- Railway Dashboard: https://railway.app
- Vercel Dashboard: https://vercel.com
- Git Push: `git push origin production`

### Logs
- Railway: Dashboard → App → Logs
- Vercel: Dashboard → Deployments → Logs

### Rebuild
- Railway: Force rebuild no dashboard
- Vercel: Redeploy in dashboard

---

## ⏭️ Próximos Passos

Após estar live:

1. [ ] Monitorar por 24h
2. [ ] Coletar feedback de users
3. [ ] Setup alertas (Railway/Vercel)
4. [ ] Documentar runbook de operações
5. [ ] Planejar v1.1 features

---

**Tempo total: ~1 hora ⏱️**

**Complexidade: Fácil ✅**

**Resultado: Production Live 🎉**

