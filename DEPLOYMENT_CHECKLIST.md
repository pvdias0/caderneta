# 🎯 CHECKLIST FINAL - Deploy Production

## 📊 Status Geral do Codebase

### ✅ Backend

- [x] Sem hardcodes críticos
- [x] Configuração centralizada
- [x] Variáveis de ambiente implementadas
- [x] Error handling robusto
- [x] Security headers (Helmet)
- [x] Rate limiting
- [x] CORS configurável
- [x] JWT com múltiplas chaves
- [x] Database connection pooling
- [x] Health checks implementados
- [x] Graceful shutdown
- [x] TypeScript configurado
- [x] Build process OK

### ✅ Frontend

- [x] Sem hardcodes de URL
- [x] Variáveis de ambiente suportadas
- [x] Config centralizado
- [x] Múltiplos ambientes suportados
- [x] Error handling
- [x] Token management
- [x] Logout funcional
- [x] API service centralizado

---

## 🚀 PRÉ-DEPLOYMENT (LOCAL)

### Backend

- [ ] Clonar repositório
- [ ] Checkout branch `production`
- [ ] `npm install`
- [ ] `npm run build` (sem erros)
- [ ] Criar `.env.production` com valores reais
- [ ] `NODE_ENV=production npm start` (teste local)
- [ ] Acessar `http://localhost:3000/api/v1/health` ✅
- [ ] Acessar `http://localhost:3000/api/v1/health/db` ✅

### Frontend

- [ ] Clonar repositório
- [ ] Checkout branch `production`
- [ ] `npm install`
- [ ] Criar `.env.production` com API_URL local
- [ ] `npm run build` (sem erros)
- [ ] `npx serve dist` (teste local)
- [ ] Verificar configurações carregadas

### Git

- [ ] Todos os arquivos commitados
- [ ] Branch `production` sincronizada
- [ ] `.gitignore` correto
- [ ] Sem secrets em versionamento

---

## 🔐 SEGURANÇA - GERAR CHAVES

### Executar Localmente (NO SEU COMPUTADOR)

```bash
# Gerar JWT_SECRET (salvar este valor)
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Gerar JWT_REFRESH_SECRET (diferente do anterior)
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Gerar DB_PASSWORD (se usar Railway, este é gerado automaticamente)
node -e "console.log('DB_PASSWORD=' + require('crypto').randomBytes(32).toString('hex'))"
```

### ⚠️ IMPORTANTE

- [ ] Guardar chaves em local SEGURO (1Password, LastPass)
- [ ] NUNCA colocar em git
- [ ] NUNCA compartilhar chaves
- [ ] Usar values gerados, NUNCA "default-secret"

---

## ☁️ INFRASTRUCTURE SETUP

### Railway PostgreSQL

- [ ] Criar conta em railway.app
- [ ] Criar projeto novo
- [ ] Adicionar PostgreSQL database
- [ ] Copiar credenciais:
  - [ ] DB_HOST
  - [ ] DB_USER
  - [ ] DB_PASSWORD
  - [ ] DB_NAME
- [ ] Testar conexão localmente

### Backend (Railway App)

- [ ] Criar app no Railway
- [ ] Conectar GitHub (branch production)
- [ ] Adicionar environment variables:
  - [ ] NODE_ENV=production
  - [ ] API_PORT=3000
  - [ ] API_URL=https://seu-railway-app.railway.app
  - [ ] DB\_\* (credenciais do PostgreSQL)
  - [ ] JWT_SECRET (gerado acima)
  - [ ] JWT_REFRESH_SECRET (gerado acima)
  - [ ] CORS_ORIGIN=https://seu-frontend.vercel.app
- [ ] Aguardar deploy
- [ ] Verificar health check
- [ ] Copiar URL final da API

### Frontend (Vercel)

- [ ] Criar projeto em vercel.com
- [ ] Conectar GitHub (branch production)
- [ ] Adicionar environment variables:
  - [ ] EXPO_PUBLIC_ENV=production
  - [ ] EXPO_PUBLIC_API_URL=https://seu-railway-api.railway.app
  - [ ] EXPO_PUBLIC_ENABLE_LOGGING=false
- [ ] Aguardar deploy
- [ ] Testar app carregando
- [ ] Copiar URL final do frontend

---

## 🔗 INTEGRAÇÃO (Conectar Frontend + Backend)

### Backend

- [ ] CORS_ORIGIN atualizado com URL do frontend Vercel
- [ ] Redeployer backend (Railway)
- [ ] Testar: `curl -H "Origin: https://seu-frontend.vercel.app" https://seu-api.railway.app/api/v1/health`

### Frontend

- [ ] EXPO_PUBLIC_API_URL atualizado com URL Railway
- [ ] Redeployer frontend (Vercel)
- [ ] Abrir app
- [ ] Tentar fazer login
- [ ] Verificar no DevTools que requisições vão para URL correta

---

## ✅ VALIDAÇÃO FINAL

### Backend

```bash
# 1. Health check básico
curl https://seu-railway-api.railway.app/api/v1/health
# Response: { "status": "ok", "environment": "production", ... }

# 2. Health check database
curl https://seu-railway-api.railway.app/api/v1/health/db
# Response: { "status": "ok", "database": "connected", ... }

# 3. Verificar logs
# Railway Dashboard → Deployments → Logs (procurar por erros)
```

### Frontend

```bash
# 1. Verificar página carrega
https://seu-frontend.vercel.app
# Deve carregar sem erros

# 2. DevTools Console (F12)
# Procurar por: "Carregando total a receber..."
# Não deve haver erros de CORS

# 3. Testar Login
# Email: (seu email)
# Senha: (sua senha)
# Deve redirecionar para home

# 4. Testar Home Screen
# Deve mostrar: Total a Receber (com valor)
# Deve mostrar: Quick Actions
# Deve mostrar: Profile

# 5. Testar Clientes
# Deve listar clientes
# Deve carregar valores corretamente
```

---

## 🔍 MONITORAMENTO PÓS-DEPLOY

### Daily Checks (Primeiros 7 dias)

- [ ] Health checks passando
- [ ] Sem erros nos logs
- [ ] Users conseguem fazer login
- [ ] Movimentos cadastrados corretamente
- [ ] Extratos gerando sem erro
- [ ] Performance OK (< 2s por requisição)

### Weekly Checks

- [ ] Verificar logs Railway
- [ ] Verificar logs Vercel
- [ ] Database size OK
- [ ] Nenhuma conexão aberta por muito tempo
- [ ] Rate limiting não atingido

### Monthly Checks

- [ ] Backups do database
- [ ] Renovar secrets JWT (ou planejar)
- [ ] Review de performance
- [ ] Atualizar dependências
- [ ] Testar disaster recovery

---

## 📋 DOCUMENTAÇÃO

### Entregar ao Client

- [ ] `.env.production` (template, sem valores)
- [ ] Credentials seguras (separado)
- [ ] URLs do projeto (Frontend + Backend)
- [ ] Guia de manutenção básica
- [ ] Contato de suporte

### Documentação Interna

- [ ] DEPLOY_ANALYSIS.md
- [ ] backend/DEPLOYMENT.md
- [ ] frontend/DEPLOYMENT.md
- [ ] Este checklist
- [ ] Link para Railway dashboard
- [ ] Link para Vercel dashboard

---

## 🎯 PRÓXIMOS PASSOS (Futuro)

### Após 1 Semana

- [ ] Coletar feedback de users
- [ ] Fix any issues encontrados
- [ ] Otimizar performance
- [ ] Adicionar monitoring/alertas avançados

### Após 1 Mês

- [ ] Planejar v1.1 com novas features
- [ ] Implementar CI/CD automático
- [ ] Setup backup automático
- [ ] Planejar scaling se necessário

### Segurança (Contínuo)

- [ ] Rotação de secrets a cada 90 dias
- [ ] Review de logs regularmente
- [ ] Update de dependências
- [ ] Penetration testing (após estabilização)

---

## ❌ NÃO FAZER

- ❌ NÃO fazer push de .env production
- ❌ NÃO usar valores padrão em produção
- ❌ NÃO deixar logging com debug em produção
- ❌ NÃO compartilhar URLs sem HTTPS
- ❌ NÃO usar banco de dados local em produção
- ❌ NÃO esquecer de testar antes de ir ao vivo
- ❌ NÃO ignorar errors nos logs
- ❌ NÃO deixar sem monitoring
- ❌ NÃO usar mesma chave JWT para access e refresh
- ❌ NÃO colocar credenciais em código

---

## ✨ CONCLUSÃO

Quando todos os ✅ estiverem marcados:

1. **Backend está em produção na Railway** ✅
2. **Frontend está em produção na Vercel** ✅
3. **Conectados e funcionando** ✅
4. **Monitoramento ativo** ✅
5. **Documentação completa** ✅

### 🎉 DEPLOY COMPLETE!

---

## 📞 Suporte & Contato

- **Railway Support**: support@railway.app
- **Vercel Support**: support@vercel.com
- **PostgreSQL Docs**: postgresql.org/docs
- **Express.js Docs**: expressjs.com
- **Expo Docs**: docs.expo.dev

---

**Data do Deployment**: ********\_********  
**Pessoa Responsável**: ********\_********  
**Versão do Código**: production-v1.0.0  
**Status**: 🟡 In Progress / 🟢 Complete
