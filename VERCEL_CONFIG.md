# 🔧 Configuração Vercel - Backend Express.js

## Os 3 Campos Principais

### 1️⃣ **Build Command**
```
npm run build
```

**O que faz**: Compila TypeScript → JavaScript  
**Resultado**: Gera pasta `/dist` com código compilado

---

### 2️⃣ **Output Directory**
```
dist
```

**O que faz**: Vercel sabe onde está o código compilado  
**Resultado**: Usa arquivos de `/dist` para rodar em produção

---

### 3️⃣ **Install Command**
```
npm install
```

**O que faz**: Instala todas as dependências (node_modules)  
**Resultado**: Baixa Express, TypeScript, PostgreSQL driver, etc.

---

## 📋 Resumo Visual

```
┌─────────────────────────────────────────┐
│         VERCEL DEPLOYMENT CONFIG        │
├─────────────────────────────────────────┤
│ Build Command:    npm run build         │
│ Output Directory: dist                  │
│ Install Command:  npm install           │
└─────────────────────────────────────────┘
```

---

## ✅ Checklist Depois

- [ ] Build Command salvo: `npm run build`
- [ ] Output Directory salvo: `dist`
- [ ] Install Command salvo: `npm install`
- [ ] Clicar "Deploy"
- [ ] Aguardar ~5 minutos
- [ ] Ver URL final em "Deployments"

---

## 🔗 Ordem de Execução (Automático)

```
1. Install Command
   ↓ (instala node_modules)
2. Build Command  
   ↓ (compila src → dist)
3. Vercel usa /dist
   ↓
4. App pronto em: https://seu-backend.vercel.app
```

---

## 💡 Se der Erro

### Erro: "npm: command not found"
→ Seu `Install Command` está errado  
→ Deve ser: `npm install`

### Erro: "dist not found"
→ Seu `Output Directory` está errado  
→ Deve ser: `dist`

### Erro: "TypeScript compilation failed"
→ Seu `Build Command` está errado  
→ Deve ser: `npm run build`

---

## 🎯 Dica Final

**Use EXATAMENTE esses valores** (sem quotes, sem espaços extras):
- Build: `npm run build`
- Output: `dist`
- Install: `npm install`

