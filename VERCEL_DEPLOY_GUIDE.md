# 🚀 Deploy Backend na Vercel - Guia Completo

## ⚠️ Importante: Use Pasta Backend como Root

Vercel requer que você especifique a pasta `backend` como root do projeto, não a raiz do repositório.

---

## 📋 Passo a Passo

### 1️⃣ **Criar Novo Projeto no Vercel**

1. Acesse: https://vercel.com/new
2. Clique em "Create Git Repository"
3. Selecione GitHub como provedor
4. Autorize Vercel no GitHub
5. Encontre o repositório `caderneta`
6. Clique "Import"

---

### 2️⃣ **Configurar Root Directory** ⭐ **CRÍTICO**

Na tela "Configure Project":

1. Expanda a seção "Root Directory"
2. Selecione **`backend`** (não deixar em branco)
3. Certifique-se que aparece: `root directory: ./backend`

```
📁 caderneta (repositório)
  ├── 📁 frontend/
  ├── 📁 backend/  ← SELECIONE ISTO
  ├── .git/
  ├── README.md
  └── vercel.json (será ignorado)
```

---

### 3️⃣ **Build & Output Settings**

Deixar como padrão (Vercel detecta automaticamente):

| Campo            | Valor           | Status                  |
| ---------------- | --------------- | ----------------------- |
| Framework Preset | Node.js         | ✅ Auto-detectado       |
| Build Command    | `npm run build` | ✅ Lido de package.json |
| Output Directory | `dist`          | ✅ Lido de vercel.json  |
| Install Command  | `npm install`   | ✅ Padrão               |

---

### 4️⃣ **Variáveis de Ambiente**

Após clicar "Deploy", você será levado para "Environment Variables".

Adicione estas variáveis:

```
NODE_ENV = production
API_PORT = 3000
API_URL = (será preenchida automaticamente pela Vercel)
DB_HOST = (seu host PostgreSQL)
DB_PORT = 5432
DB_USER = (seu usuário)
DB_PASSWORD = (sua senha)
DB_NAME = caderneta
JWT_SECRET = (gerar com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_REFRESH_SECRET = (gerar com o mesmo comando)
CORS_ORIGIN = (URL do seu frontend, ex: https://seu-frontend.vercel.app)
RATE_LIMIT_WINDOW = 15
RATE_LIMIT_MAX_REQUESTS = 100
```

---

## 🔧 Gerando JWT Secrets (Seguro)

Execute no seu terminal local:

```bash
node -e "console.log('JWT_SECRET=', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET=', require('crypto').randomBytes(32).toString('hex'))"
```

Copie os valores e cole em cada campo do Vercel.

---

## ✅ Processo de Deploy

1. Após preencher Environment Variables
2. Clique "Deploy"
3. Aguarde ~5 minutos (primeira vez é mais lenta)
4. Verá: "Congratulations! Your project has been successfully deployed"
5. Clique no link para ver sua API

---

## 🧪 Testando após Deploy

Após receber a URL (ex: `https://caderneta-api-xyz.vercel.app`):

### Health Check

```bash
curl https://caderneta-api-xyz.vercel.app/api/v1/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "environment": "production",
  "timestamp": "2025-11-23T..."
}
```

### Database Check

```bash
curl https://caderneta-api-xyz.vercel.app/api/v1/health/db
```

Resposta esperada:

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "...",
  "environment": "production"
}
```

---

## 🔗 Atualizar Frontend

Após obter a URL da API, atualize o frontend com:

```env
EXPO_PUBLIC_API_URL=https://caderneta-api-xyz.vercel.app
```

---

## ❌ Se der Erro: "tsc: command not found"

**Solução**: Certifique-se que:

1. `typescript` está em `dependencies` (não `devDependencies`) no `backend/package.json` ✅
2. O Root Directory está correto: `./backend` ✅
3. Fazer commit e push das mudanças

---

## ❌ Se der Erro: "tsconfig.json not found"

**Causa**: Root Directory está errado (não está usando `./backend`)

**Solução**:

1. Volte para "Settings" do projeto
2. Clique em "Root Directory"
3. Verifique se está `./backend`
4. Clique em "Deploy" novamente (fará redeploy)

---

## 📊 Verificar Status

No Vercel Dashboard:

1. Vá para seu projeto
2. Clique em "Deployments"
3. Veja o histórico de builds
4. Clique na versão mais recente para ver logs

---

## 🔒 Segurança

- ✅ Não commite `.env.production` no GitHub
- ✅ Use variáveis de ambiente no Vercel Dashboard
- ✅ Ative HTTPS (automático em Vercel)
- ✅ JWT secrets são únicos por ambiente

---

## 📝 Resumo Visual

```
GitHub Repository (pvdias0/caderneta)
        ↓
Vercel Detects Push
        ↓
Root Directory = ./backend ← CRÍTICO!
        ↓
npm install (em backend/)
        ↓
npm run build (tsc compila src → dist)
        ↓
Output: dist/ (contém código compilado)
        ↓
Node.js executa dist/index.js
        ↓
API rodando em: https://seu-projeto.vercel.app
        ↓
Frontend conecta via EXPO_PUBLIC_API_URL
```

---

## 🆘 Troubleshooting Rápido

| Problema                    | Solução                                |
| --------------------------- | -------------------------------------- |
| tsc: command not found      | TypeScript em dependencies ✅          |
| tsconfig.json not found     | Root Directory = ./backend ✅          |
| Cannot find module 'dotenv' | npm install não rodou (ver logs)       |
| Database connection timeout | Verificar credenciais DB e firewall    |
| CORS error no frontend      | Adicionar URL frontend em CORS_ORIGIN  |
| Port already in use         | Vercel gerencia portas automaticamente |

---

## ✨ Próximos Passos

1. ✅ Criar projeto no Vercel
2. ✅ Configurar Root Directory = ./backend
3. ✅ Preencher Environment Variables
4. ✅ Deploy
5. ✅ Testar health check
6. ✅ Atualizar frontend com API_URL
7. ✅ Deploy frontend
