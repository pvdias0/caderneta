@echo off
REM Script para configurar variáveis de ambiente locais (Windows)
REM Uso: setup-env-local.bat

setlocal enabledelayedexpansion

echo ===================================
echo 🔧 Configurador de Ambiente Local
echo ===================================
echo.

REM Verificar se está no diretório correto
if not exist "backend\package.json" (
    echo ❌ Erro: Execute este script da raiz do projeto!
    exit /b 1
)

echo 📋 Configurando ambiente de desenvolvimento local...
echo.

REM Backend
echo 🔧 Configurando Backend
cd backend

if not exist ".env.local" (
    echo ⚠️  Arquivo .env.local não encontrado. Criando...
    (
        echo NODE_ENV=development
        echo API_PORT=8080
        echo API_URL=http://localhost:8080
        echo.
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_USER=postgres
        echo DB_PASSWORD=postgres
        echo DB_NAME=caderneta
        echo.
        echo JWT_SECRET=seu-secret-aleatorio-local-development-key
        echo JWT_REFRESH_SECRET=seu-refresh-secret-aleatorio-local-development-key
        echo JWT_EXPIRE=24h
        echo JWT_REFRESH_EXPIRE=7d
        echo.
        echo RATE_LIMIT_WINDOW=15
        echo RATE_LIMIT_MAX_REQUESTS=100
    ) > .env.local
    echo ✅ .env.local criado. Edite com suas credenciais!
) else (
    echo ✅ .env.local já existe
)

cd ..

REM Frontend
echo 🔧 Configurando Frontend
cd frontend

if not exist ".env.local" (
    echo ⚠️  Arquivo .env.local não encontrado. Criando...
    (
        echo NODE_ENV=development
        echo EXPO_PUBLIC_API_URL=http://192.168.0.138:8080
    ) > .env.local
    echo ✅ .env.local criado. Verifique o IP correto!
) else (
    echo ✅ .env.local já existe
)

cd ..

echo.
echo ✅ Ambiente configurado com sucesso!
echo.
echo 📝 Próximos passos:
echo 1. Edite backend\.env.local com suas credenciais de BD
echo 2. Edite frontend\.env.local com o IP correto da sua rede
echo 3. Execute: npm run dev (no backend)
echo 4. Execute: npm start (no frontend, em outro terminal)
echo.

pause
