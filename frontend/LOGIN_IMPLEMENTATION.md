# 📘 Caderneta - Sistema de Fiado Digitalizado

## Estrutura do Projeto

### Frontend (React Native/Expo)

#### Páginas Criadas

1. **Login** (`app/login.tsx`)
   - Formulário de autenticação
   - Validação de email e senha
   - Integração com backend via API
   - Navegação para registro

2. **Registro** (`app/register.tsx`)
   - Criação de nova conta
   - Validação de email, nome de usuário e senha
   - Auto-login após registro bem-sucedido
   - Botão de voltar para login

3. **Home** (`app/(tabs)/index.tsx`)
   - Dashboard do usuário autenticado
   - Exibição de informações do perfil
   - Ações rápidas (Clientes, Produtos, Compras, Pagamentos)
   - Botão de logout

4. **Explore** (`app/(tabs)/explore.tsx`)
   - Página de exploração
   - Placeholder para futuras funcionalidades (Relatórios, Estatísticas, Configurações)

#### Navegação

- **Router Layout** (`app/_layout.tsx`)
  - Gerencia a navegação entre rotas públicas (login/register) e autenticadas (tabs)
  - Mostra loading enquanto valida sessão
  - Redireciona automaticamente baseado em estado de autenticação

- **Tabs Layout** (`app/(tabs)/_layout.tsx`)
  - Configuração de abas inferiores (Home e Explore)
  - Ícones com Ionicons
  - Header personalizado

#### Contexto de Autenticação

- **AuthProvider** (`context/auth.context.tsx`)
  - Gerencia estado de autenticação
  - Funções: `login()`, `register()`, `logout()`
  - Integração com AsyncStorage para persistência
  - Hook `useAuth()` para uso em componentes

#### Serviço de API

- **ApiService** (`services/api.ts`)
  - Cliente HTTP com fetch()
  - Endpoints: login, register, refresh, logout, me
  - Token management (Bearer + refresh)
  - Auto-refresh em caso de 401

### Backend (Node.js/Express)

#### Endpoints de Autenticação

- **POST** `/api/v1/auth/login` - Autenticar usuário
- **POST** `/api/v1/auth/register` - Registrar novo usuário
- **POST** `/api/v1/auth/refresh` - Renovar token de acesso
- **POST** `/api/v1/auth/logout` - Fazer logout
- **GET** `/api/v1/auth/me` (protegido) - Obter dados do usuário

#### Database

- PostgreSQL em localhost:5432
- 8 tabelas: usuarios, cliente, conta, compra, item_compra, pagamento, produto, movimento
- Triggers para cálculos automáticos de saldo

## Como Usar

### Desenvolvimento Local

1. **Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   - Servidor rodará em `http://localhost:3000`
   - Certifique-se que PostgreSQL está rodando

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   - Expo Go abrirá
   - Escanear QR code com celular

### Fluxo de Autenticação

1. Usuário abre app → Se não autenticado, vai para tela de login
2. Login/Registro → Chama backend com credenciais
3. Backend valida e retorna tokens (access + refresh)
4. Tokens armazenados em AsyncStorage
5. User autenticado → Navega para (tabs) Home
6. Logout → Remove tokens e volta para login

### Variáveis de Ambiente

**Backend** (`.env.local`)
```
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=dias010203
DB_NAME=caderneta
JWT_SECRET=seu_secret_jwt
REFRESH_TOKEN_SECRET=seu_refresh_secret
API_URL=http://localhost:3000
```

**Frontend** (`.env.local`)
```
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_ENV=development
```

## Próximos Passos

- [ ] Implementar páginas de Clientes
- [ ] Implementar páginas de Produtos
- [ ] Implementar páginas de Compras
- [ ] Implementar páginas de Pagamentos
- [ ] Implementar relatórios
- [ ] Testes automatizados
- [ ] Deploy no EAS (mobile)
- [ ] Deploy no Vercel (backend)

## Segurança

✅ Senhas hasheadas com bcryptjs
✅ JWT com refresh tokens
✅ HTTP-only cookies (quando disponível)
✅ Validação de entrada
✅ CORS configurado
✅ Rate limiting
✅ Helmet para headers de segurança

---

Desenvolvido com React Native/Expo + Node.js/Express + PostgreSQL 🚀
