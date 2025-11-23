# 📱 Guia de Deployment Frontend - Vercel

## 🎯 Resumo

O frontend React Native Expo está otimizado para deploy em Vercel (web) ou como app nativo.

---

## 🔧 Pre-requisitos

- [ ] Node.js 18+
- [ ] Vercel CLI: `npm install -g vercel`
- [ ] GitHub repository com branch `production`
- [ ] URL da API Backend configurada

---

## 📋 Configuração do Frontend

### 1. Variáveis de Ambiente

**`.env.production`**
```dotenv
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_URL=https://seu-railway-api.railway.app
EXPO_PUBLIC_API_TIMEOUT=30000
EXPO_PUBLIC_ENABLE_LOGGING=false
```

**Checklist:**
- [ ] URL de API aponta para backend em produção
- [ ] ENV está setado como "production"
- [ ] Logging desativado em produção
- [ ] Timeout apropriado (30s)

### 2. Verificar Configuração em `config.ts`

```typescript
// ✅ Já suporta múltiplos ambientes
export const config = {
  env: process.env.EXPO_PUBLIC_ENV || "development",
  apiUrl: process.env.EXPO_PUBLIC_API_URL,
  apiTimeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || "30000", 10),
  enableLogging: process.env.EXPO_PUBLIC_ENABLE_LOGGING !== "false",
};
```

Status: ✅ **OK** - Nenhuma mudança necessária

---

## 🚀 Deployment em Vercel

### Método 1: Vercel Web (Recomendado)

#### Passo 1: Configurar `vercel.json`

Crie `frontend/vercel.json`:

```json
{
  "buildCommand": "npx expo export --platform web",
  "outputDirectory": "dist",
  "env": {
    "EXPO_PUBLIC_ENV": "production"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600, must-revalidate"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/:path((?!_next/static|favicon.ico).*)",
      "destination": "/index.html",
      "permanent": false
    }
  ]
}
```

#### Passo 2: Deploy via CLI

```bash
cd frontend
vercel --prod --yes
```

#### Passo 3: Configurar Environment Variables

No Vercel Dashboard:
- Settings → Environment Variables
- Adicionar:
  ```
  EXPO_PUBLIC_ENV=production
  EXPO_PUBLIC_API_URL=https://seu-api-railway.railway.app
  EXPO_PUBLIC_ENABLE_LOGGING=false
  ```

#### Passo 4: Testar

```bash
# Verificar URL
https://seu-frontend.vercel.app

# Verificar health
curl https://seu-api-railway.railway.app/api/v1/health
```

---

## 📦 Build Local

### Testar Build em Produção

```bash
# 1. Instalar dependências
npm install

# 2. Build para web
npx expo export --platform web

# 3. Servir localmente (teste antes de push)
npx serve dist

# 4. Acessar http://localhost:3000
```

---

## 🔗 Conectar Frontend com Backend

### Checklist de Integração

- [ ] `.env.production` aponta para API correta
- [ ] API está em produção e respondendo
- [ ] CORS está configurado no backend
- [ ] JWT tokens funcionam em produção
- [ ] Refresh token logic funciona
- [ ] Logout funciona corretamente

### Testar Conexão

```bash
# 1. Verificar API está acessível
curl https://seu-api.railway.app/api/v1/health

# 2. Fazer login no app
# 3. Verificar se token é armazenado
# 4. Fazer requisição autenticada
# 5. Testar logout
```

---

## 🔐 Variáveis de Ambiente Produção

### Backend (Railway)
```
NODE_ENV=production
API_URL=https://seu-railway-api.railway.app
DB_HOST=seu-railway-db.railway.app
JWT_SECRET=chave-gerada-segura
CORS_ORIGIN=https://seu-frontend.vercel.app
```

### Frontend (Vercel)
```
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_URL=https://seu-railway-api.railway.app
EXPO_PUBLIC_ENABLE_LOGGING=false
```

**Síncronia:**
- Frontend URL: `https://seu-frontend.vercel.app`
- Backend URL: `https://seu-railway-api.railway.app`
- CORS no backend inclui frontend URL

---

## 📊 Estrutura de Deploy

```
┌─────────────────────────────────────────────────────┐
│                   USUÁRIO FINAL                      │
└───────────────────┬─────────────────────────────────┘
                    │
        ┌───────────┴──────────┐
        │                      │
    ┌───▼────────┐        ┌───▼─────────┐
    │   Vercel   │        │   Vercel    │
    │ (Frontend) │        │ (Backend)   │
    └───┬────────┘        └───┬─────────┘
        │                     │
        └─────────┬───────────┘
                  │ (HTTPS/REST)
                  │
            ┌─────▼──────┐
            │  Railway   │
            │ (API Node) │
            └─────┬──────┘
                  │ (TCP)
                  │
            ┌─────▼──────────┐
            │  Railway       │
            │ (PostgreSQL)   │
            └────────────────┘
```

---

## ✅ Checklist de Deployment

### Antes do Deploy

- [ ] Branch `production` está atualizada
- [ ] `.env.production` preenchido no backend
- [ ] `.env.production` preenchido no frontend
- [ ] Backend compila sem erros
- [ ] Frontend compila sem erros
- [ ] Testes locais passam
- [ ] Commits feitos: `git push origin production`

### Após Deploy Backend (Railway)

- [ ] Health check: `/api/v1/health` ✅
- [ ] DB check: `/api/v1/health/db` ✅
- [ ] Login funciona
- [ ] JWT válido
- [ ] CORS responde corretamente

### Após Deploy Frontend (Vercel)

- [ ] App carrega em `seu-frontend.vercel.app`
- [ ] Config aponta para API correta
- [ ] Login funciona
- [ ] Consegue listar clientes
- [ ] Consegue criar movimento
- [ ] Logout funciona

### Pós-Deploy

- [ ] Monitorar logs (Railway/Vercel)
- [ ] Testar em múltiplos devices
- [ ] Testar offline behavior (se aplicável)
- [ ] Validar performance
- [ ] Comunicar ao usuário
- [ ] Backup preparado

---

## 📝 Variáveis Necessárias Summary

### Railway Backend
| Variável | Exemplo | Crítico |
|----------|---------|---------|
| NODE_ENV | production | ✅ Sim |
| API_PORT | 3000 | ✅ Sim |
| API_URL | https://seu-api.railway.app | ✅ Sim |
| DB_HOST | seu-railway-db.railway.app | ✅ Sim |
| DB_USER | postgres | ✅ Sim |
| DB_PASSWORD | senha_segura_64_chars | ✅ Sim |
| DB_NAME | railway | ✅ Sim |
| JWT_SECRET | hash_seguro_64_chars | ✅ Sim |
| JWT_REFRESH_SECRET | hash_seguro_64_chars | ✅ Sim |
| CORS_ORIGIN | https://seu-frontend.vercel.app | ✅ Sim |

### Vercel Frontend
| Variável | Exemplo | Crítico |
|----------|---------|---------|
| EXPO_PUBLIC_ENV | production | ✅ Sim |
| EXPO_PUBLIC_API_URL | https://seu-api.railway.app | ✅ Sim |
| EXPO_PUBLIC_ENABLE_LOGGING | false | ⚠️ Recomendado |

---

## 🔍 Troubleshooting

### Erro: "Cannot connect to API"
```
Causa: API URL incorreta ou API offline

Solução:
1. Verificar EXPO_PUBLIC_API_URL em .env.production
2. Testar curl https://seu-api.railway.app/api/v1/health
3. Verificar CORS_ORIGIN no backend
```

### Erro: "CORS error"
```
Causa: Frontend URL não em CORS_ORIGIN

Solução:
1. Adicionar https://seu-frontend.vercel.app em CORS_ORIGIN
2. Redeployer backend
3. Clear cache do navegador
```

### Erro: "404 on routes"
```
Causa: Vercel não roteando corretamente

Solução:
1. Verificar vercel.json redirects
2. Verificar outputDirectory é "dist"
3. Redeployer: vercel --prod --yes
```

---

## 📞 Referências

- [Vercel Deploy React Native](https://docs.expo.dev/build-reference/web/)
- [Expo Build Web](https://docs.expo.dev/build/web/)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

