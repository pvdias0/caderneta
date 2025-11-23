# 📁 Estrutura do Projeto - Referência Completa

## 🎯 Visão Geral

```
caderneta/
├── 📄 DEPLOY_ANALYSIS.md           ← Análise técnica de deployment
├── 📄 DEPLOY_SUMMARY.md            ← Resumo executivo
├── 📄 DEPLOYMENT_CHECKLIST.md      ← Checklist final
├── 📄 README.md                    ← Visão geral do projeto
│
├── 📁 backend/                     ← API Express.js + TypeScript
│   ├── 📄 vercel.json              ← Config Vercel (NOVO)
│   ├── 📄 .vercelignore            ← Files to ignore (NOVO)
│   ├── 📄 DEPLOYMENT.md            ← Guia deployment backend
│   ├── 📄 package.json             ← Dependencies & scripts
│   ├── 📄 tsconfig.json            ← TypeScript config
│   ├── 📄 .env.example             ← Template variáveis
│   ├── 📄 .env.production          ← Prod vars (template)
│   ├── 📄 .env.staging             ← Staging vars (template)
│   ├── 📄 .env.local               ← Local vars (template)
│   │
│   └── 📁 src/
│       ├── 📄 index.ts             ← Entry point (Express app)
│       │
│       ├── 📁 config/
│       │   ├── 📄 index.ts         ← Config centralizada
│       │   └── 📄 database.ts      ← Database connection pool
│       │
│       ├── 📁 controllers/         ← HTTP request handlers
│       │   ├── 📄 auth.controller.ts
│       │   ├── 📄 cliente.controller.ts
│       │   ├── 📄 produto.controller.ts
│       │   ├── 📄 movimento.controller.ts
│       │   └── 📄 pdf.controller.ts
│       │
│       ├── 📁 services/            ← Business logic
│       │   ├── 📄 auth.service.ts
│       │   ├── 📄 usuario.service.ts
│       │   ├── 📄 jwt.service.ts
│       │   ├── 📄 cliente.service.ts
│       │   ├── 📄 produto.service.ts
│       │   ├── 📄 movimento.service.ts
│       │   └── 📄 pdf.service.ts
│       │
│       ├── 📁 routes/              ← API endpoints
│       │   ├── 📄 auth.routes.ts
│       │   ├── 📄 cliente.routes.ts
│       │   ├── 📄 produto.routes.ts
│       │   ├── 📄 movimento.routes.ts
│       │   └── 📄 pdf.routes.ts
│       │
│       ├── 📁 middleware/          ← Express middlewares
│       │   ├── 📄 auth.middleware.ts
│       │   └── 📄 error.middleware.ts
│       │
│       └── 📁 types/               ← TypeScript interfaces
│           ├── 📄 auth.ts
│           ├── 📄 usuario.ts
│           ├── 📄 cliente.ts
│           ├── 📄 produto.ts
│           └── 📄 movimento.ts
│
├── 📁 frontend/                    ← React Native + Expo
│   ├── 📄 DEPLOYMENT.md            ← Guia deployment frontend
│   ├── 📄 vercel.json              ← Config Vercel (opcional)
│   ├── 📄 app.json                 ← Expo config
│   ├── 📄 package.json             ← Dependencies
│   ├── 📄 tsconfig.json            ← TypeScript config
│   ├── 📄 config.ts                ← Configuração centralizada
│   ├── 📄 eslint.config.js         ← Lint config
│   ├── 📄 .env.example             ← Template variáveis
│   ├── 📄 .env.production          ← Prod vars (template)
│   ├── 📄 .env.staging             ← Staging vars (template)
│   ├── 📄 .env.local               ← Local vars (template)
│   │
│   ├── 📁 app/                     ← Expo Router (file-based routing)
│   │   ├── 📄 _layout.tsx          ← Root layout
│   │   ├── 📄 index.tsx            ← Home/Dashboard
│   │   ├── 📄 login.tsx            ← Login screen
│   │   ├── 📄 register.tsx         ← Register screen
│   │   │
│   │   └── 📁 (tabs)/              ← Tabs layout
│   │       ├── 📄 _layout.tsx      ← Tabs navigator
│   │       ├── 📄 index.tsx        ← Home tab
│   │       ├── 📄 explore.tsx      ← Explore tab
│   │       │
│   │       ├── 📁 clientes/        ← Clientes feature
│   │       │   ├── 📄 index.tsx    ← List clientes
│   │       │   └── 📄 cliente/
│   │       │       └── 📄 index.tsx ← Cliente details
│   │       │
│   │       ├── 📁 estoque/         ← Estoque feature
│   │       │   └── 📄 index.tsx    ← Produtos list
│   │       │
│   │       └── 📁 styles/          ← Screen styles
│   │           └── 📄 *.tsx
│   │
│   ├── 📁 services/                ← API & business logic
│   │   └── 📄 api.ts               ← API service (centralized)
│   │
│   ├── 📁 context/                 ← React Context
│   │   └── 📄 auth.context.tsx     ← Auth context & provider
│   │
│   ├── 📁 assets/                  ← Static assets
│   │   └── 📁 images/
│   │
│   └── 📁 scripts/                 ← Build scripts
```

---

## 📊 Arquitetura de Camadas

### Backend (Express.js)
```
REQUEST
   ↓
MIDDLEWARE (Auth, Rate Limit, CORS)
   ↓
ROUTES (Express Router)
   ↓
CONTROLLERS (Request/Response handling)
   ↓
SERVICES (Business Logic)
   ↓
DATABASE (PostgreSQL via pg Pool)
   ↓
RESPONSE
```

### Frontend (React Native)
```
USER INTERACTION
   ↓
SCREEN COMPONENT (UI)
   ↓
CONTEXT / STATE
   ↓
API SERVICE (HTTP calls)
   ↓
BACKEND
   ↓
RESPONSE → UPDATE STATE → RE-RENDER
```

---

## 🔄 Fluxo de Dados

### Autenticação
```
[Login Screen]
    ↓
[POST /api/v1/auth/login]
    ↓
[Auth Service - validate credentials]
    ↓
[Generate JWT tokens]
    ↓
[Store in AsyncStorage]
    ↓
[Auth Context updated]
    ↓
[Navigate to Home]
```

### Criar Movimento (Compra)
```
[Cliente Detail Screen]
    ↓
[Modal - Select Products]
    ↓
[Add to Carrinho state]
    ↓
[POST /api/v1/clientes/{id}/movimentos/compra-com-itens]
    ↓
[Backend - Validate & Create]
    ↓
[Database - Insert compra + item_compra]
    ↓
[Trigger - Update inventory]
    ↓
[Response OK]
    ↓
[Reload movimentos list]
```

---

## 📝 Padrões de Nomenclatura

### Arquivos
```
snake_case.ts       = Arquivos
PascalCase.tsx      = Componentes React
index.ts            = Exports da pasta
```

### Variáveis
```
let camelCase       = Variáveis
const CONSTANT_CASE = Constantes
interface IName     = Interfaces
type TName          = Types
```

### Endpoints
```
GET    /api/v1/clientes              = List
GET    /api/v1/clientes/{id}         = Detail
POST   /api/v1/clientes              = Create
PUT    /api/v1/clientes/{id}         = Update
DELETE /api/v1/clientes/{id}         = Delete
```

---

## 🔐 Variáveis de Ambiente

### Backend Obrigatórias
```env
NODE_ENV                    = production|staging|development
API_PORT                    = 3000
API_URL                     = https://seu-api.app
DB_HOST                     = seu-db.host
DB_PORT                     = 5432
DB_USER                     = postgres
DB_PASSWORD                 = senha-segura
DB_NAME                     = caderneta
JWT_SECRET                  = 64-chars-hex
JWT_REFRESH_SECRET          = 64-chars-hex
CORS_ORIGIN                 = https://seu-frontend.app
```

### Frontend Obrigatórias
```env
EXPO_PUBLIC_ENV             = production|staging|development
EXPO_PUBLIC_API_URL         = https://seu-api.app
EXPO_PUBLIC_API_TIMEOUT     = 30000
EXPO_PUBLIC_ENABLE_LOGGING  = true|false
```

---

## 🧪 Scripts Disponíveis

### Backend
```bash
npm install              # Install dependencies
npm run dev             # Development (watch mode)
npm run build           # Compile TypeScript → dist/
npm start              # Production server
npm run lint           # Linting (placeholder)
npm test               # Tests (placeholder)
```

### Frontend
```bash
npm install             # Install dependencies
npm run dev            # Development (Expo)
npm run build          # Build web (Expo export)
npx expo export --platform web
```

---

## 📊 Banco de Dados

### Tabelas Principais
```
┌─────────────┐
│   usuario   │
├─────────────┤
│ id_usuario  │ PK
│ email       │ UNIQUE
│ nome        │
│ senha_hash  │
└─────────────┘
       ↓
┌─────────────┐
│   cliente   │
├─────────────┤
│ id_cliente  │ PK
│ id_usuario  │ FK
│ nome        │
│ email       │
│ telefone    │
└─────────────┘
       ↓
┌─────────────┐      ┌──────────────┐
│   conta     │      │   movimento  │
├─────────────┤      ├──────────────┤
│ id_conta    │      │ id_movimento │
│ id_cliente  │◄─────│ id_conta     │
│ saldo_dev.  │      │ tipo         │
└─────────────┘      │ id_compra/pg │
                     └──────────────┘
       ↓                     ↓
   ┌──────────┐         ┌─────────┐
   │  compra  │         │pagamento│
   └──────────┘         └─────────┘
       ↓
   ┌────────────────┐
   │  item_compra   │
   ├────────────────┤
   │ id_item_compra │
   │ id_compra      │
   │ id_produto     │
   │ quantidade     │
   │ valor_unitario │
   └────────────────┘
```

---

## 🚀 Deployment Structure

### Production
```
VERCEL (Frontend)
├── dist/
├── .next/
└── public/

RAILWAY (Backend)
├── dist/
├── node_modules/
└── .env.production

RAILWAY (PostgreSQL)
├── caderneta_prod database
└── Automatic backups
```

---

## 📈 Escalabilidade

### Atual (0-1000 users)
- ✅ 1 Railway app
- ✅ 1 PostgreSQL instance
- ✅ Vercel hobby tier

### Futuro (1000-10k users)
- ⚠️ Multiple API instances
- ⚠️ Database replication
- ⚠️ Redis cache layer
- ⚠️ CDN for static files

---

## 📋 Checklist de Conhecimento

Antes de fazer deploy, certifique-se que você entende:

- [ ] Como variáveis de ambiente funcionam
- [ ] Diferença entre .env.* arquivos
- [ ] Como Railway faz auto-deploy via Git
- [ ] Como Vercel faz auto-deploy via Git
- [ ] Como JWT tokens funcionam
- [ ] Como CORS funciona
- [ ] Como rate limiting funciona
- [ ] Como database pooling funciona
- [ ] Como TypeScript compila para JavaScript
- [ ] Como Expo Router funciona

---

## 🎓 Recursos Recomendados

### Backend
- Express.js Guide: https://expressjs.com/
- PostgreSQL Docs: https://postgresql.org/docs/
- JWT Introduction: https://jwt.io/introduction
- Railway Docs: https://railway.app/docs

### Frontend
- React Native: https://reactnative.dev/
- Expo: https://docs.expo.dev/
- Expo Router: https://docs.expo.dev/routing/
- Vercel: https://vercel.com/docs

---

## 📞 Suporte & Referência

| Tópico | Arquivo |
|--------|---------|
| Análise Técnica | `DEPLOY_ANALYSIS.md` |
| Resumo | `DEPLOY_SUMMARY.md` |
| Deployment Backend | `backend/DEPLOYMENT.md` |
| Deployment Frontend | `frontend/DEPLOYMENT.md` |
| Checklist | `DEPLOYMENT_CHECKLIST.md` |
| Estrutura | `PROJECT_STRUCTURE.md` (este arquivo) |

---

**Última atualização**: 23/11/2024  
**Status**: ✅ Production Ready

