# 🆘 Troubleshooting - Render Build Failed

## 🔍 Diagnóstico

O log mostra:
```
/opt/render/project/src/backend/node_modules/jsonwebtoken
```

Mas deveria ser:
```
/opt/render/project/backend/node_modules/jsonwebtoken
```

**Causa**: Render ainda não está usando o Root Directory `backend`.

---

## ✅ Solução - Verificar Dashboard

### 1. Acesse Render Dashboard

https://dashboard.render.com/

### 2. Clique no projeto `caderneta-api`

### 3. Clique em "Settings"

### 4. **Procure por "Root Directory"**

Deve estar assim:

```
Root Directory: backend
```

**NÃO deve estar:**
- Vazio
- `./backend`
- `/backend`
- `src/backend`
- `backend/`

### 5. Se Estiver Errado

1. Apague o campo
2. Digite: `backend`
3. Clique "Save"
4. Clique "Redeploy"

### 6. Se Estiver Correto

1. Clique "Redeploy"
2. Render vai tentar novamente

---

## 📋 Verificar Outros Campos

Enquanto estiver em Settings, confirme:

| Campo | Deve Estar |
|-------|-----------|
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Root Directory | `backend` |

---

## 🔧 Se Ainda Não Funcionar

### Opção 1: Recriar o Serviço

Se continuar com `/src/backend/`:

1. Delete o serviço atual
2. Crie um novo
3. Preencha corretamente:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

### Opção 2: Limpar e Rebuildar

1. No dashboard, clique "Settings"
2. Clique "Clear Build Cache"
3. Clique "Redeploy"

---

## 📊 O que Render Deveria Fazer

Se Root Directory estiver correto:

```
1. Clone: github.com/pvdias0/caderneta
2. Navegue para: backend/ (por causa do Root Directory)
3. Rode: npm install && npm run build
   └── node_modules/ criado em backend/
   └── dist/ criado em backend/
4. Rode: npm start
5. API pronta em https://seu-servico.onrender.com
```

---

## ✨ Próximos Passos

1. ✅ Vá para Render Dashboard
2. ✅ Clique no projeto
3. ✅ Clique "Settings"
4. ✅ Verifique Root Directory = `backend`
5. ✅ Clique "Redeploy"
6. ✅ Aguarde 5 minutos

Se isso não resolver, recriar o serviço do zero (Option 1 acima).

