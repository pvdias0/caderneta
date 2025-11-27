#!/bin/bash
# Script para configurar variáveis de ambiente locais
# Uso: ./setup-env-local.sh

set -e

echo "==================================="
echo "🔧 Configurador de Ambiente Local"
echo "==================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "backend/package.json" ] || [ ! -f "frontend/package.json" ]; then
    echo -e "${RED}❌ Erro: Execute este script da raiz do projeto!${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Configurando ambiente de desenvolvimento local...${NC}"
echo ""

# Backend
echo -e "${GREEN}🔧 Configurando Backend${NC}"
cd backend

if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env.local não encontrado. Criando...${NC}"
    cat > .env.local << 'EOF'
NODE_ENV=development
API_PORT=8080
API_URL=http://localhost:8080

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=caderneta

JWT_SECRET=seu-secret-aleatorio-local-development-key
JWT_REFRESH_SECRET=seu-refresh-secret-aleatorio-local-development-key
JWT_EXPIRE=24h
JWT_REFRESH_EXPIRE=7d

RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
EOF
    echo -e "${GREEN}✅ .env.local criado. Edite com suas credenciais!${NC}"
else
    echo -e "${GREEN}✅ .env.local já existe${NC}"
fi

cd ..

# Frontend
echo -e "${GREEN}🔧 Configurando Frontend${NC}"
cd frontend

if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Arquivo .env.local não encontrado. Criando...${NC}"
    cat > .env.local << 'EOF'
NODE_ENV=development
EXPO_PUBLIC_API_URL=http://192.168.0.138:8080
EOF
    echo -e "${GREEN}✅ .env.local criado. Verifique o IP correto!${NC}"
else
    echo -e "${GREEN}✅ .env.local já existe${NC}"
fi

cd ..

echo ""
echo -e "${GREEN}✅ Ambiente configurado com sucesso!${NC}"
echo ""
echo -e "${YELLOW}📝 Próximos passos:${NC}"
echo "1. Edite backend/.env.local com suas credenciais de BD"
echo "2. Edite frontend/.env.local com o IP correto da sua rede"
echo "3. Execute: npm run dev (no backend)"
echo "4. Execute: npm start (no frontend, em outro terminal)"
echo ""
