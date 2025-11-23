# 📚 Caderneta - Sistema de Fiado Digitalizado

> Um sistema moderno para gerenciar cadernetas (fiado) de forma digital e eficiente.

## 🚀 Stack Tecnológico

- **Backend:** Node.js + Express + TypeScript + PostgreSQL
- **Frontend:** React Native + Expo + TypeScript
- **Autenticação:** JWT + Refresh Token
- **Segurança:** Helmet, CORS, Rate Limiting, bcrypt

## 📋 Pré-requisitos

- Node.js v18+ e npm
- PostgreSQL 12+
- Expo CLI (`npm install -g expo-cli`)
- Git

## ⚡ Quick Start (Desenvolvimento)

### 1. Clone o repositório

```bash
git clone https://github.com/pvdias0/caderneta.git
cd caderneta
```

### 2. Backend

```bash
cd backend
npm install
npm run dev
# API rodará em http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
npm install
npx expo start
# Escanear QR code com Expo Go
```

## 🔧 Configuração de Ambientes

O projeto suporta **3 ambientes**: `development`, `staging` e `production`.

### Arquivos de Configuração

```
backend/
├── .env.local          (desenvolvimento)
├── .env.staging        (staging)
└── .env.production     (produção)

frontend/
├── .env.local          (desenvolvimento)
├── .env.staging        (staging)
└── .env.production     (produção)
```

### Iniciando em Diferentes Ambientes

#### Windows (PowerShell)

```powershell
.\start-env.ps1 -Environment local      # Desenvolvimento
.\start-env.ps1 -Environment staging    # Staging
.\start-env.ps1 -Environment production # Produção
```

#### Linux/Mac (Bash)

```bash
chmod +x start-env.sh
./start-env.sh local      # Desenvolvimento
./start-env.sh staging    # Staging
./start-env.sh production # Produção
```

### Variáveis de Ambiente Importantes

**Backend** (`.env.local`, etc):

- `NODE_ENV` - Ambiente (development, staging, production)
- `API_PORT` - Porta do servidor
- `API_URL` - URL pública da API
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Configuração do banco
- `JWT_SECRET`, `JWT_REFRESH_SECRET` - Chaves de autenticação
- `CORS_ORIGIN` - URLs permitidas para CORS

**Frontend** (`.env.local`, etc):

- `EXPO_PUBLIC_ENV` - Ambiente
- `EXPO_PUBLIC_API_URL` - URL da API do backend
- `EXPO_PUBLIC_ENABLE_LOGGING` - Ativar logs de debug

> 📖 Para mais detalhes, consulte [`ENVIRONMENT_CONFIG.md`](./ENVIRONMENT_CONFIG.md)

## 📂 Estrutura do Projeto

```
caderneta/
├── backend/              # API Express + TypeScript
│   ├── src/
│   │   ├── config/      # Configurações
│   │   ├── controllers/ # Controladores
│   │   ├── routes/      # Rotas
│   │   ├── services/    # Lógica de negócio
│   │   └── types/       # Tipagens
│   └── package.json
│
├── frontend/             # App React Native + Expo
│   ├── app/             # Navegação Expo Router
│   ├── context/         # Context API
│   ├── services/        # API client
│   └── package.json
│
├── ENVIRONMENT_CONFIG.md # Guia de configuração
├── ENV_SETUP_SUMMARY.md # Resumo das mudanças
├── start-env.sh         # Script para iniciar (Linux/Mac)
├── start-env.ps1        # Script para iniciar (Windows)
└── README.md            # Este arquivo
```

## 🔐 Segurança

- ✅ Variáveis sensíveis em `.env` (nunca commit)
- ✅ Senhas com hash bcrypt
- ✅ JWT com refresh token
- ✅ CORS configurável por ambiente
- ✅ Helmet para headers HTTP
- ✅ Rate limiting contra abuso

## 📖 Documentação

- **[Configuração de Ambientes](./ENVIRONMENT_CONFIG.md)** - Guia completo
- **[Resumo de Mudanças](./ENV_SETUP_SUMMARY.md)** - O que foi implementado
- **[Autenticação](./frontend/LOGIN_IMPLEMENTATION.md)** - Detalhes da autenticação

## 🚀 Deploy

### Staging

```bash
# Backend
NODE_ENV=staging npm run dev

# Frontend
EXPO_PUBLIC_ENV=staging npx expo start
```

### Produção

```bash
# Backend
NODE_ENV=production npm run build
NODE_ENV=production npm start

# Frontend
EXPO_PUBLIC_ENV=production eas build
```

## 🆘 Troubleshooting

**Frontend não conecta à API?**

- Verificar `EXPO_PUBLIC_API_URL` em `.env.local`
- Garantir que backend está rodando
- Limpar cache: `npx expo start --clear`

**Backend não inicia?**

- Verificar se PostgreSQL está rodando
- Validar credenciais em `.env`
- Executar: `npm run dev`

**Erro de token JWT?**

- Tokens de ambientes diferentes não são compatíveis
- Limpar cache do app no Expo Go

Para mais informações, consulte [`ENVIRONMENT_CONFIG.md`](./ENVIRONMENT_CONFIG.md).

## 📝 Licença

ISC

## 👨‍💻 Autor

Pedro Vitor Dias
