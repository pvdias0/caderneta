#!/bin/bash
# Script para iniciar o projeto em diferentes ambientes
# Uso: ./start-env.sh <ambiente>
# Ambientes: local, staging, production

set -e

ENVIRONMENT=${1:-local}

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validar ambiente
if [[ ! "$ENVIRONMENT" =~ ^(local|staging|production)$ ]]; then
  echo -e "${RED}❌ Ambiente inválido: $ENVIRONMENT${NC}"
  echo "Ambientes válidos: local, staging, production"
  exit 1
fi

# Configurar NODE_ENV
case $ENVIRONMENT in
  local)
    NODE_ENV="development"
    EXPO_ENV="development"
    PORT=3000
    DB_HOST="localhost"
    ;;
  staging)
    NODE_ENV="staging"
    EXPO_ENV="staging"
    PORT=3000
    DB_HOST="db.staging.seu-dominio.com"
    ;;
  production)
    NODE_ENV="production"
    EXPO_ENV="production"
    PORT=3000
    DB_HOST="db.seu-dominio.com"
    ;;
esac

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║       CADERNETA - Iniciar em: $ENVIRONMENT (${NODE_ENV})       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Menu
echo "Escolha o que iniciar:"
echo "  1) Backend"
echo "  2) Frontend"
echo "  3) Ambos (em 2 terminais)"
echo ""
read -p "Opção (1-3): " option

case $option in
  1)
    echo -e "${YELLOW}🚀 Iniciando Backend em $ENVIRONMENT...${NC}"
    cd backend
    export NODE_ENV=$NODE_ENV
    npm run dev
    ;;
  2)
    echo -e "${YELLOW}🚀 Iniciando Frontend em $ENVIRONMENT...${NC}"
    cd frontend
    
    # Copiar o arquivo .env correto para .env.local
    if [ -f ".env.$ENVIRONMENT" ]; then
        cp ".env.$ENVIRONMENT" ".env.local"
        echo -e "${GREEN}✅ Usando configuração de .env.$ENVIRONMENT${NC}"
    else
        echo -e "${YELLOW}⚠️  Arquivo .env.$ENVIRONMENT não encontrado. Usando .env.local existente.${NC}"
    fi
    
    export EXPO_PUBLIC_ENV=$EXPO_ENV
    npx expo start
    ;;
  3)
    echo -e "${YELLOW}🚀 Iniciando Backend E Frontend em $ENVIRONMENT...${NC}"
    echo -e "${BLUE}⚠️  Abra outro terminal e execute:${NC}"
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
      echo -e "  PowerShell:"
      echo -e "    .\start-env.ps1 -Environment $ENVIRONMENT"
    else
      echo -e "  Bash:"
      echo -e "    ./start-env.sh $ENVIRONMENT"
    fi
    echo ""
    cd backend
    export NODE_ENV=$NODE_ENV
    npm run dev
    ;;
  *)
    echo -e "${RED}❌ Opção inválida${NC}"
    exit 1
    ;;
esac
