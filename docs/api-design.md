# SvelteFireauth API 设计文档

## 1. 服务端 API

### 1.1 Hooks 集成 (一键集成)

```typescript
// hooks.server.ts
import { createAuthHandle } from 'sveltefireauth/server';

export const handle = createAuthHandle({
  firebaseApiKey: 'YOUR_FIREBASE_API_KEY',
  apiPath: '/api/auth',              // 可选，默认 '/api/auth'
  enableCallback: true,               // 可选，默认 true
  callbackPath: '__/auth/action',     // 可选，默认 '__/auth/action'
  enableSession: false,               // 可选，默认 false
  sessionConfig: {                    // 可选
    cookieName: 'session',
    maxAge: 60 * 60 * 24 * 5,        // 5 days
    secure: true,
    httpOnly: true,
    sameSite: 'lax'
  },
  responseTransformer: (data) => {    // 可选
    return { success: true, data };
  }
});
```

### 1.2 手动集成 (路由处理器)

```typescript
// src/routes/api/auth/signup/+server.ts
import { handleSignUp } from 'sveltefireauth/server';

export const POST = handleSignUp({
  firebaseApiKey: 'YOUR_FIREBASE_API_KEY'
});
```

```typescript
// src/routes/api/auth/signin/+server.ts
import { handleSignIn } from 'sveltefireauth/server';

export const POST = handleSignIn({
  firebaseApiKey: 'YOUR_FIREBASE_API_KEY',
  enableSession: true,
  sessionConfig: { /* ... */ }
});
```

### 1.3 路由保护

```typescript
// hooks.server.ts
import { createAuthGuard } from 'sveltefireauth/server';

export const handle = createAuthGuard({
  protectedRoutes: ['/dashboard', '/profile'],
  redirectTo: '/login',
  publicRoutes: ['/login', '/signup'],
  verify: async (event) => {
    // 自定义验证逻辑
    const token = event.cookies.get('token');
    return !!token;
  }
});
```

### 1.4 配置类型定义

```typescript
interface AuthHandleConfig {
  firebaseApiKey: string;
  apiPath?: string;
  enableCallback?: boolean;
  callbackPath?: string;
  enableSession?: boolean;
  sessionConfig?: SessionConfig;
  responseTransformer?: ResponseTransformer;
}

interface SessionConfig {
  cookieName?: string;
  maxAge?: number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

type ResponseTransformer = (data: any) => any;

interface RouteHandlerConfig {
  firebaseApiKey: string;
  enableSession?: boolean;
  sessionConfig?: SessionConfig;
  responseTransformer?: ResponseTransformer;
}

interface AuthGuardConfig {
  protectedRoutes?: string[];
  publicRoutes?: string[];
  redirectTo?: string;
  verify?: (event: RequestEvent) => Promise<boolean> | boolean;
}
```

## 2. 客户端 API

### 2.1 Auth Client (直接调用 Firebase API)

```typescript
import { FirebaseAuthClient } from 'sveltefireauth/client';

const authClient = new FirebaseAuthClient({
  apiKey: 'YOUR_FIREBASE_API_KEY',
  mode: 'direct' // 直接调用 Firebase API
});

// 注册
const result = await authClient.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// 登录
const result = await authClient.signIn({
  email: 'user@example.com',
  password: 'password123'
});

// 刷新令牌
const result = await authClient.refreshToken(refreshToken);

// 获取用户信息
const user = await authClient.getUser(idToken);

// 更新用户信息
const result = await authClient.updateProfile({
  displayName: 'John Doe',
  photoUrl: 'https://example.com/photo.jpg'
}, idToken);

// 发送密码重置邮件
const result = await authClient.sendPasswordResetEmail('user@example.com');

// 确认密码重置
const result = await authClient.confirmPasswordReset({
  oobCode: 'code',
  newPassword: 'newpassword123'
});

// 发送验证邮件
const result = await authClient.sendEmailVerification(idToken);

// 删除账户
const result = await authClient.deleteAccount(idToken);
```

### 2.2 Auth Client (代理模式)

```typescript
import { FirebaseAuthClient } from 'sveltefireauth/client';

const authClient = new FirebaseAuthClient({
  mode: 'proxy',
  proxyPath: '/api/auth' // 代理路径
});

// API 调用方式相同，但会通过后端代理
const result = await authClient.signUp({
  email: 'user@example.com',
  password: 'password123'
});
```

### 2.3 Auth Store (状态管理)

```typescript
import { authStore, initAuth } from 'sveltefireauth/client';

// 初始化
initAuth({
  apiKey: 'YOUR_FIREBASE_API_KEY',
  mode: 'proxy',
  proxyPath: '/api/auth',
  persistence: true, // 启用持久化
  autoRefresh: true  // 自动刷新令牌
});

// 在 Svelte 组件中使用
<script>
  import { authStore } from 'sveltefireauth/client';
  
  $: user = $authStore.user;
  $: loading = $authStore.loading;
  $: error = $authStore.error;
  $: isAuthenticated = $authStore.isAuthenticated;
</script>

{#if loading}
  <p>Loading...</p>
{:else if isAuthenticated}
  <p>Welcome, {user.email}!</p>
{:else}
  <p>Please log in</p>
{/if}
```

### 2.4 Auth Store Actions

```typescript
import { authStore } from 'sveltefireauth/client';

// 注册
await authStore.signUp('user@example.com', 'password123');

// 登录
await authStore.signIn('user@example.com', 'password123');

// 登出
await authStore.signOut();

// 刷新令牌
await authStore.refreshToken();

// 更新用户信息
await authStore.updateProfile({
  displayName: 'John Doe'
});

// 发送密码重置邮件
await authStore.sendPasswordResetEmail('user@example.com');

// 删除账户
await authStore.deleteAccount();
```

### 2.5 客户端配置类型

```typescript
interface AuthClientConfig {
  apiKey?: string;
  mode: 'direct' | 'proxy';
  proxyPath?: string;
}

interface AuthStoreConfig extends AuthClientConfig {
  persistence?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // 毫秒
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
}
```

## 3. 类型定义

### 3.1 用户类型

```typescript
interface User {
  localId: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  photoUrl?: string;
  disabled?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}
```

### 3.2 认证响应类型

```typescript
interface SignUpResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
}

interface SignInResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered: boolean;
}

interface RefreshTokenResponse {
  access_token: string;
  expires_in: string;
  token_type: string;
  refresh_token: string;
  id_token: string;
  user_id: string;
  project_id: string;
}
```

### 3.3 请求类型

```typescript
interface SignUpRequest {
  email: string;
  password: string;
  returnSecureToken?: boolean;
}

interface SignInRequest {
  email: string;
  password: string;
  returnSecureToken?: boolean;
}

interface UpdateProfileRequest {
  displayName?: string;
  photoUrl?: string;
  deleteAttribute?: string[];
}

interface PasswordResetRequest {
  email: string;
  requestType?: 'PASSWORD_RESET';
}

interface ConfirmPasswordResetRequest {
  oobCode: string;
  newPassword: string;
}
```

## 4. API 端点

### 4.1 服务端路由 (使用 Hooks 集成时)

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/auth/signup` | 用户注册 |
| POST | `/api/auth/signin` | 用户登录 |
| POST | `/api/auth/signout` | 用户登出 |
| POST | `/api/auth/refresh` | 刷新令牌 |
| GET | `/api/auth/user` | 获取用户信息 |
| PUT | `/api/auth/user` | 更新用户信息 |
| DELETE | `/api/auth/user` | 删除账户 |
| POST | `/api/auth/password-reset` | 发送密码重置邮件 |
| POST | `/api/auth/password-confirm` | 确认密码重置 |
| POST | `/api/auth/verify-email` | 发送验证邮件 |
| POST | `/api/auth/verify-email-confirm` | 确认邮箱验证 |
| GET/POST | `/__/auth/action` | 认证回调处理 |

### 4.2 Firebase REST API 映射

| 本地端点 | Firebase API |
|---------|-------------|
| `POST /api/auth/signup` | `https://identitytoolkit.googleapis.com/v1/accounts:signUp` |
| `POST /api/auth/signin` | `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword` |
| `POST /api/auth/refresh` | `https://securetoken.googleapis.com/v1/token` |
| `GET /api/auth/user` | `https://identitytoolkit.googleapis.com/v1/accounts:lookup` |
| `PUT /api/auth/user` | `https://identitytoolkit.googleapis.com/v1/accounts:update` |
| `DELETE /api/auth/user` | `https://identitytoolkit.googleapis.com/v1/accounts:delete` |
| `POST /api/auth/password-reset` | `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode` |
| `POST /api/auth/password-confirm` | `https://identitytoolkit.googleapis.com/v1/accounts:resetPassword` |

## 5. 错误处理

### 5.1 错误格式

```typescript
interface AuthError {
  code: string;
  message: string;
  details?: any;
}
```

### 5.2 常见错误代码

| 错误代码 | 描述 |
|---------|------|
| `EMAIL_EXISTS` | 邮箱已存在 |
| `INVALID_EMAIL` | 无效的邮箱地址 |
| `WEAK_PASSWORD` | 密码强度不足 |
| `EMAIL_NOT_FOUND` | 邮箱不存在 |
| `INVALID_PASSWORD` | 密码错误 |
| `USER_DISABLED` | 用户已被禁用 |
| `TOKEN_EXPIRED` | 令牌已过期 |
| `INVALID_ID_TOKEN` | 无效的 ID 令牌 |

## 6. 使用示例

### 6.1 完整示例 (Hooks 集成 + Store)

```typescript
// hooks.server.ts
import { createAuthHandle } from 'sveltefireauth/server';

export const handle = createAuthHandle({
  firebaseApiKey: process.env.FIREBASE_API_KEY!,
  apiPath: '/api/auth'
});
```

```svelte
<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  import { authStore } from 'sveltefireauth/client';
  
  let email = '';
  let password = '';
  
  async function handleLogin() {
    try {
      await authStore.signIn(email, password);
      // 登录成功，重定向
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Login failed:', error);
    }
  }
</script>

<form on:submit|preventDefault={handleLogin}>
  <input type="email" bind:value={email} placeholder="Email" />
  <input type="password" bind:value={password} placeholder="Password" />
  <button type="submit">Login</button>
</form>

{#if $authStore.error}
  <p class="error">{$authStore.error.message}</p>
{/if}
```

### 6.2 手动集成示例

```typescript
// src/routes/api/auth/signup/+server.ts
import { handleSignUp } from 'sveltefireauth/server';

export const POST = handleSignUp({
  firebaseApiKey: process.env.FIREBASE_API_KEY!,
  responseTransformer: (data) => ({
    success: true,
    user: {
      id: data.localId,
      email: data.email
    },
    token: data.idToken
  })
});
```

