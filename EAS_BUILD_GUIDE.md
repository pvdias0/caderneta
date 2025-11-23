# 🚀 EAS Build - Frontend React Native + Expo

## 📋 Pré-requisitos

### 1. Instalar EAS CLI

```bash
npm install -g eas-cli
```

Ou usando npm local:

```bash
npm install --save-dev eas-cli
```

### 2. Fazer Login na Expo

```bash
eas login
```

Isso abrirá o navegador para você fazer login com sua conta Expo (ou criar uma).

### 3. Link Projeto

```bash
cd frontend
eas project:init
```

Isso vai criar um `eas.json` automático.

---

## 🔧 Configurar `eas.json`

Crie/edite `frontend/eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0"
  },
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "buildType": "simulator"
      }
    },
    "preview2": {
      "android": {
        "gradleCommand": ":app:assembleRelease"
      },
      "ios": {
        "buildType": "archive"
      }
    },
    "preview3": {
      "developmentClient": true
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "buildType": "archive"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 🎯 Configurar Variáveis de Ambiente

### Criar `.env.production` no Frontend

```bash
cd frontend
```

Edite `.env.production`:

```env
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_URL=https://seu-backend-render-url.com
EXPO_PUBLIC_ENABLE_LOGGING=false
```

⚠️ **IMPORTANTE**: Substitua `seu-backend-render-url.com` pela URL real do seu backend no Render!

---

## 📱 Opções de Build

### 1️⃣ **Preview (Mais Rápido - para Testes)**

```bash
eas build --platform android --profile preview
```

Ou iOS:

```bash
eas build --platform ios --profile preview
```

Resultado: APK (Android) ou Simulator build (iOS)

---

### 2️⃣ **Production (Para App Store/Play Store)**

```bash
eas build --platform android --profile production
```

Ou iOS:

```bash
eas build --platform ios --profile production
```

Resultado: AAB (Android) ou Archive (iOS)

---

### 3️⃣ **Ambos os Platforms**

```bash
eas build --platform all --profile production
```

---

## 🎬 Passo a Passo Completo

### 1. Instalar EAS CLI

```bash
npm install -g eas-cli
```

### 2. Fazer Login

```bash
eas login
```

### 3. Ir para pasta frontend

```bash
cd frontend
```

### 4. Inicializar projeto

```bash
eas project:init
```

Isso cria `eas.json`.

### 5. Configurar `.env.production`

```env
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_URL=https://seu-backend-url
EXPO_PUBLIC_ENABLE_LOGGING=false
```

### 6. Build Android

```bash
eas build --platform android --profile preview
```

Aguarde ~10-15 minutos.

### 7. Build iOS (se usar macOS)

```bash
eas build --platform ios --profile preview
```

Aguarde ~20-30 minutos.

---

## 📊 Status do Build

Para verificar status:

```bash
eas build:list
```

---

## 📥 Baixar APK/Build

Após o build terminar:

1. Acesse: https://expo.dev/builds
2. Veja o build finalizado
3. Clique para baixar o arquivo

**Android**: `.apk` (instale direto no telefone)
**iOS**: `.ipa` (precisa TestFlight ou distribuição)

---

## 🧪 Testar APK

```bash
# Conectar telefone Android via USB
adb install seu-build.apk

# Ou abrir a página de download e instalar pelo navegador
```

---

## 📝 Variáveis Importantes

```env
# Para Development
EXPO_PUBLIC_ENV=development
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_ENABLE_LOGGING=true

# Para Production
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_URL=https://seu-backend-render-url.com
EXPO_PUBLIC_ENABLE_LOGGING=false
```

---

## 🔗 URLs de Referência

- EAS Dashboard: https://expo.dev
- EAS CLI Docs: https://docs.expo.dev/eas
- Expo Router: https://docs.expo.dev/routing/introduction

---

## ⚠️ Troubleshooting

### Erro: "Not logged in"

```bash
eas logout
eas login
```

### Erro: "Project not initialized"

```bash
eas project:init
```

### Build cancelado/falhou

Verifique os logs:
```bash
eas build:view <BUILD_ID>
```

### APK muito grande

Isso é normal para o primeiro build. Builds subsequentes são mais rápidos.

---

## 🎯 Próximos Passos

1. ✅ Instalar EAS CLI
2. ✅ Fazer login
3. ✅ Configurar `eas.json`
4. ✅ Configurar `.env.production`
5. ✅ Rodar `eas build --platform android --profile preview`
6. ✅ Baixar e testar APK

