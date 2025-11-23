# 🔧 Instruções Corretas para Deploy no Render

## ⚠️ O Problema Anterior

Render estava procurando em `/opt/render/project/src/backend/` em vez de `/opt/render/project/backend/` porque não estava usando a configuração correta do dashboard.

**Solução**: Use APENAS o Render Dashboard, sem `render.yaml`.

---

## ✅ Como Configurar Corretamente

### 1. **Criar/Editar Serviço no Render**

No Render Dashboard, ao criar ou editar o serviço:

#### 📍 **Root Directory** (Crítico!)

```
backend
```

NÃO é `./backend`, NÃO é `src/backend`, apenas `backend`

#### 🔨 **Build Command**

```
npm run build
```

#### ▶️ **Start Command**

```
npm start
```

---

### 2. **Configurar Environment Variables**

Adicione estas variáveis:

```env
NODE_ENV=production
API_PORT=3000
API_URL=https://seu-servico.onrender.com
DB_HOST=seu-host-postgresql
DB_PORT=5432
DB_USER=seu-usuario
DB_PASSWORD=sua-senha
DB_NAME=caderneta
JWT_SECRET=<gerar com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
JWT_REFRESH_SECRET=<gerar com o mesmo comando>
CORS_ORIGIN=https://seu-frontend.vercel.app
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
```

---

### 3. **Deploy**

Clique "Create Web Service" ou "Deploy"

Render vai:
1. Clonar seu repositório
2. Navegar para `backend/` (porque você definiu Root Directory)
3. Rodar `npm install`
4. Rodar `npm run build` (compila TypeScript)
5. Rodar `npm start`

---

## 📋 Passo a Passo - Dashboard Render

### Criar Novo Projeto:

1. Acesse: https://dashboard.render.com/
2. Clique "New +" → "Web Service"
3. Clique "Public Git Repository"
4. Cole: `https://github.com/pvdias0/caderneta`
5. Clique "Connect"

### Preencher Configuração:

```
┌─────────────────────────────────────────────────┐
│ Name: caderneta-api                             │
│ Environment: Node                               │
│ Region: São Paulo (recomendado)                 │
│ Branch: main                                    │
│ Root Directory: backend  ← CRÍTICO!             │
│ Build Command: npm run build                    │
│ Start Command: npm start                        │
└─────────────────────────────────────────────────┘
```

### Adicionar Environment Variables:

Clique em "Add Secret File" ou use as opções de variáveis individuais.

Adicione todas as variáveis listadas acima.

### Deploy:

Clique "Create Web Service" ou "Deploy"

---

## 🚨 Se Ainda Não Funcionar

### Verificar Logs

1. No Render Dashboard
2. Clique no projeto
3. Vá para "Logs"
4. Procure por:
   - `npm install` (deve estar rodando)
   - `tsc` (deve compilar sem erros)
   - `🚀 SERVIDOR CADERNETA INICIADO` (sucesso!)

### Erros Comuns

**Erro: "Cannot find module 'pg'"**
- Significa `npm install` não rodou
- Solução: Verifique se Root Directory está `backend` (sem ./ ou /src)

**Erro: "Root Directory não encontrado"**
- Você colocou algo errado
- Tente: `backend`, sem aspas, sem barra

**Erro: TypeScript não compila**
- Verifique se `typescript` está em `dependencies` do `package.json` ✅ (já está)
- Verifique se `@types/node` está em `devDependencies` ✅ (já está)

---

## ✨ O que Mudou

- ✅ Removido `render.yaml` (não era necessário)
- ✅ Adicionado `"types": ["node"]` em `tsconfig.json`
- ✅ Confirmado `@types/node` em `devDependencies`

---

## 🎯 Próximas Ações

1. ✅ Vá para Render Dashboard
2. ✅ Clique em seu projeto `caderneta-api`
3. ✅ Clique "Settings"
4. ✅ Confirme que Root Directory é `backend`
5. ✅ Clique "Redeploy" ou "Deploy"
6. ✅ Aguarde ~5 minutos

---

## 📊 Estrutura Esperada

Render vai procurar:

```
📁 /opt/render/project/
├── 📁 backend/  ← Root Directory
│   ├── package.json  ← Lê daqui
│   ├── tsconfig.json
│   ├── node_modules/  ← npm install cria
│   ├── src/
│   └── dist/  ← npm run build cria
├── 📁 frontend/
└── README.md
```

**NÃO vai procurar em**: `/opt/render/project/src/backend/`

---

## 🔗 URL Final

Após sucesso, você receberá:

```
https://caderneta-api-xxxxx.onrender.com
```

Use no frontend:

```env
EXPO_PUBLIC_API_URL=https://caderneta-api-xxxxx.onrender.com
```

