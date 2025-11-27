# 🔐 Autenticação Frontend - Implementação

## Visão Geral

A autenticação no frontend foi implementada com **Context API + Expo Router**, proporcionando navegação automática baseada no estado de autenticação.

## Estrutura de Arquivos

```
frontend/
├── types/
│   └── auth.ts                 # Interfaces de autenticação
├── services/
│   └── api.ts                  # Cliente HTTP com gerenciamento de tokens
├── context/
│   └── AuthContext.tsx         # Context global de autenticação
├── hooks/
│   └── useAuth.ts              # Hook para acessar context
├── screens/
│   ├── LoginScreen.tsx         # Tela de login
│   └── RegisterScreen.tsx      # Tela de registro
└── app/
    ├── _layout.tsx             # Layout raiz com AuthProvider
    ├── RootLayoutNav.tsx       # Lógica de navegação condicional
    ├── index.tsx               # Redirecionamento inicial
    ├── (auth)/                 # Rotas públicas
    │   ├── _layout.tsx
    │   ├── login.tsx
    │   └── register.tsx
    └── (tabs)/                 # Rotas protegidas
        ├── _layout.tsx
        ├── clientes.tsx
        └── produtos.tsx
```

## Fluxo de Autenticação

### 1. **Inicialização da App**

```
RootLayout → AuthProvider → RootLayoutNav
                              ↓
                    Restaura tokens armazenados
                              ↓
                    isSignedIn? → Mostra (tabs) ou (auth)
```

### 2. **Login**

```
User entra email/senha → apiService.login() →
Tokens salvos em SecureStore → dispatch(LOGIN_SUCCESS) →
Redirecionado para /(tabs)/clientes
```

### 3. **Registro**

```
User preenche dados → apiService.register() →
Sucesso → retorna para login →
User faz login → Redirecionado para /(tabs)
```

### 4. **Logout**

```
User clica logout → apiService.logout() →
clearTokens() → dispatch(LOGOUT) →
Redirecionado para /(auth)/login
```

### 5. **Token Expirado**

```
Requisição retorna 401 → apiService.refreshAccessToken() →
Novo token armazenado → Tenta requisição novamente
```

## Componentes Principais

### **ApiService** (`services/api.ts`)

- Gerencia todas as requisições HTTP
- Armazena tokens em `expo-secure-store`
- Implementa refresh token automático
- Lida com CORS e autenticação

**Métodos principais:**

```typescript
await apiService.login(email, senha);
await apiService.register(nome_usuario, email, senha);
await apiService.logout();
await apiService.refreshAccessToken();
await apiService.getClientes();
await apiService.createCliente(data);
// ... mais métodos para produtos e movimentos
```

### **AuthContext** (`context/AuthContext.tsx`)

- Gerencia estado global de autenticação
- Reduz boilerplate com reducer pattern
- Fornece métodos: `login`, `register`, `logout`, `clearError`

**Estado:**

```typescript
{
  user: IUser | null;
  isLoading: boolean;
  isSignedIn: boolean;
  error: string | null;
}
```

### **RootLayoutNav** (`app/RootLayoutNav.tsx`)

- Lógica de roteamento condicional
- Mostra `(auth)` se não autenticado
- Mostra `(tabs)` se autenticado
- Exibe loading spinner durante restauração

### **Rotas Públicas** (`app/(auth)/`)

- `/login` - Tela de login
- `/register` - Tela de registro
- Acessíveis quando `isSignedIn === false`

### **Rotas Protegidas** (`app/(tabs)/`)

- `/clientes` - Gerenciar clientes
- `/produtos` - Gerenciar produtos
- Acessíveis quando `isSignedIn === true`
- Incluem botão de logout no header

## Uso em Componentes

### Acessar dados de autenticação

```typescript
import { useAuth } from "../hooks/useAuth";

export const MyComponent: React.FC = () => {
  const { user, isSignedIn, isLoading, error } = useAuth();

  return <Text>Bem-vindo, {user?.nome_usuario}</Text>;
};
```

### Fazer login

```typescript
const { login } = useAuth();

try {
  await login("user@email.com", "senha123");
  // Redireção ocorre automaticamente
} catch (error) {
  Alert.alert("Erro", error.message);
}
```

### Fazer logout

```typescript
const { logout } = useAuth();

await logout();
// Redireção para login ocorre automaticamente
```

## Armazenamento de Tokens

- **Access Token**: Armazenado em `expo-secure-store`
- **Refresh Token**: Armazenado em `expo-secure-store`
- **Local**: Mantido em memória durante a sessão
- **Renovação**: Automática quando token expira

## Segurança

✅ Tokens armazenados em `expo-secure-store` (seguro)
✅ Senhas enviadas apenas uma vez (no login)
✅ Refresh token automático
✅ CORS configurável por ambiente
✅ HTTP-only em produção (via backend)

## Configuração de Ambiente

### app.json

```json
"extra": {
  "apiUrl": "http://localhost:8080"
}
```

### .env.example (frontend)

```
EXPO_PUBLIC_API_URL=http://localhost:8080
EXPO_PUBLIC_ENV=development
```

### .env.local (backend)

```
DB_HOST=...
DB_PORT=5432
JWT_SECRET=...
JWT_REFRESH_SECRET=...
CORS_ORIGIN=*
```

## Próximas Implementações

1. ✅ Autenticação básica
2. ⏳ Gerenciamento de clientes
3. ⏳ Gerenciamento de produtos
4. ⏳ Registro de movimentos (compras/pagamentos)
5. ⏳ Dashboard com totais
6. ⏳ Extrato de movimentos
7. ⏳ Sincronização em tempo real (WebSocket)

## Testando Localmente

### 1. Iniciar Backend

```bash
cd backend
npm install
npm run dev
# API estará em http://localhost:8080
```

### 2. Iniciar Frontend

```bash
cd frontend
npm install
npx expo start
# Escanear QR code com Expo Go
```

### 3. Testar Fluxo

1. Clique em "Criar agora" para registrar um novo usuário
2. Preencha os dados (nome_usuario, email, senha)
3. Retorne para login
4. Faça login com o usuário criado
5. Deverá ser redirecionado para a tela de clientes
6. Clique no ícone de logout para sair

## Troubleshooting

**"Failed to connect to API"**

- Verificar se o backend está rodando em http://localhost:8080
- Testar: `curl http://localhost:8080/api/v1/health`

**"Token expirado"**

- Limpar cache: `npx expo start --clear`
- Fazer logout e login novamente

**"CORS error"**

- Verificar `CORS_ORIGIN` no `.env.local` do backend
- Deve estar configurado como `*` para desenvolvimento

## Referências

- [Expo Router](https://expo.dev/router)
- [React Context API](https://react.dev/reference/react/useContext)
- [expo-secure-store](https://docs.expo.dev/modules/expo-secure-store/)
- [JWT - JSON Web Tokens](https://jwt.io/)
