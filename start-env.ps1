# Script para iniciar o projeto em diferentes ambientes (Windows)
# Uso: .\start-env.ps1 -Environment local
# Ambientes: local, staging, production

param(
    [ValidateSet('local', 'staging', 'production')]
    [string]$Environment = 'local'
)

$ErrorActionPreference = 'Stop'

# Configuração por ambiente
$envConfig = @{
    'local' = @{
        NODE_ENV = 'development'
        EXPO_ENV = 'development'
        API_URL = 'http://localhost:8081'
    }
    'staging' = @{
        NODE_ENV = 'staging'
        EXPO_ENV = 'staging'
        API_URL = 'https://caderneta-backend.onrender.com'
    }
    'production' = @{
        NODE_ENV = 'production'
        EXPO_ENV = 'production'
        API_URL = 'https://caderneta-backend.onrender.com'
    }
}

$config = $envConfig[$Environment]
$NODE_ENV = $config['NODE_ENV']
$EXPO_ENV = $config['EXPO_ENV']
$API_URL = $config['API_URL']

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Blue
Write-Host "║       CADERNETA - Iniciar em: $Environment ($NODE_ENV)" -ForegroundColor Blue
Write-Host "║       API URL: $API_URL" -ForegroundColor Blue
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Blue
Write-Host ""

Write-Host "Escolha o que iniciar:"
Write-Host "  1) Backend"
Write-Host "  2) Frontend"
Write-Host "  3) Ambos (em terminais separados)"
Write-Host "  4) Validar configuração"
Write-Host ""

$choice = Read-Host "Opção (1-4)"

switch ($choice) {
    '1' {
        Write-Host "🚀 Iniciando Backend em $Environment..." -ForegroundColor Yellow
        Set-Location backend
        $env:NODE_ENV = $NODE_ENV
        npm run dev
        break
    }
    '2' {
        Write-Host "🚀 Iniciando Frontend em $Environment..." -ForegroundColor Yellow
        Set-Location frontend
        $env:EXPO_PUBLIC_ENV = $EXPO_ENV
        npx expo start
        break
    }
    '3' {
        Write-Host "🚀 Iniciando Backend E Frontend em $Environment..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "⚠️  Abra outro PowerShell e execute:" -ForegroundColor Blue
        Write-Host "  cd frontend; `$env:EXPO_PUBLIC_ENV='$EXPO_ENV'; npx expo start" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Iniciando Backend..." -ForegroundColor Green
        Write-Host ""
        
        Set-Location backend
        $env:NODE_ENV = $NODE_ENV
        npm run dev
        break
    }
    '4' {
        Write-Host "📋 Verificando configuração de $Environment..." -ForegroundColor Yellow
        Write-Host ""
        
        # Verificar arquivos .env
        $backendEnv = "..\backend\.env.$Environment"
        $frontendEnv = "..\frontend\.env.$Environment"
        
        Write-Host "Backend .env.$Environment:" -ForegroundColor Green
        if (Test-Path $backendEnv) {
            Get-Content $backendEnv | Where-Object { $_ -and -not $_.StartsWith('#') } | ForEach-Object {
                $line = $_
                if ($line -match '(PASSWORD|SECRET|TOKEN)') {
                    Write-Host "  ✅ $($line.Split('=')[0]): ***" -ForegroundColor Green
                } else {
                    Write-Host "  ✅ $line" -ForegroundColor Green
                }
            }
        } else {
            Write-Host "  ❌ Arquivo não encontrado: $backendEnv" -ForegroundColor Red
        }
        
        Write-Host ""
        Write-Host "Frontend .env.$Environment:" -ForegroundColor Green
        if (Test-Path $frontendEnv) {
            Get-Content $frontendEnv | Where-Object { $_ -and -not $_.StartsWith('#') } | ForEach-Object {
                Write-Host "  ✅ $_" -ForegroundColor Green
            }
        } else {
            Write-Host "  ❌ Arquivo não encontrado: $frontendEnv" -ForegroundColor Red
        }
        
        break
    }
    default {
        Write-Host "❌ Opção inválida" -ForegroundColor Red
        exit 1
    }
}
