# 🚀 Build Frontend com EAS - Guia Rápido

## ✅ Status Atual

- ✅ `eas.json` criado
- ✅ `.env.production` existe
- ✅ Frontend pronto

---

## 🎯 Próximas Ações (5 passos)

### 1️⃣ Instalar EAS CLI

```bash
npm install -g eas-cli
```

### 2️⃣ Fazer Login Expo

```bash
eas login
```

(Abre navegador para você fazer login)

### 3️⃣ Atualizar `.env.production`

Edite `frontend/.env.production`:

```env
EXPO_PUBLIC_ENV=production
EXPO_PUBLIC_API_URL=https://seu-backend-render-url.com
EXPO_PUBLIC_API_TIMEOUT=30000
EXPO_PUBLIC_ENABLE_LOGGING=false
```

⚠️ Substitua `seu-backend-render-url.com` pela URL real!

### 4️⃣ Fazer Commit

```bash
cd frontend
git add eas.json .env.production
git commit -m "feat: Add EAS configuration for frontend build"
git push origin main
```

### 5️⃣ Build Android

```bash
eas build --platform android --profile preview
```

Aguarde ~10-15 minutos.

---

## 📱 Resultado

Após o build terminar:

1. Acesse: https://expo.dev/builds
2. Baixe o `.apk`
3. Instale no seu telefone Android

```bash
adb install caderneta.apk
```

---

## 🎯 URL do Backend

Qual é a URL do seu backend no Render?

Exemplo: `https://caderneta-api-abc123.onrender.com`

Preciso disso para atualizar o `.env.production` corretamente.
