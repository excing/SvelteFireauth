# SvelteFireAuth

一个基于 Firebase Auth REST API 的 Svelte 认证库，提供完整的用户认证功能，无需使用 Firebase 客户端 SDK。

## 特性

- 🔥 **基于 Firebase Auth REST API** - 直接使用 REST API，无需客户端 SDK
- 🚀 **SvelteKit 集成** - 一行代码集成到 SvelteKit 项目
- 🍪 **灵活的会话管理** - 支持自定义会话管理器（Redis、数据库等）
- 🔒 **路由保护** - 灵活的页面级认证保护
- 📱 **响应式状态** - 基于 Svelte stores 的响应式用户状态
- 🛡️ **TypeScript 支持** - 完整的类型定义
- 🎯 **现代设计** - 符合现代软件开发原则
- 🎨 **自定义 Action 页面** - 美观的密码重置、邮箱验证页面
- 🔄 **数据转换支持** - 可自定义用户数据和响应数据的处理

## 支持的认证操作

- ✅ 邮箱注册
- ✅ 邮箱密码登录
- ✅ 邮箱验证
- ✅ 密码重置
- ✅ 密码找回
- ✅ 修改资料
- ✅ 获取用户资料
- ✅ 删除账户

## 安装

```bash
npm install sveltefireauth
```

## 快速开始

### 1. 配置 hooks.server.ts

在 `src/hooks.server.ts` 中添加认证处理：

```typescript
import { createAuthHook } from 'sveltefireauth';

const firebaseConfig = {
  apiKey: 'your-firebase-api-key',
  projectId: 'your-project-id',
  authDomain: 'your-project.firebaseapp.com'
};

export const handle = createAuthHook({
  firebase: firebaseConfig,
  middleware: {
    protectedPaths: ['/dashboard', '/profile'],
    loginPath: '/auth/signin',
    redirectPath: '/dashboard'
  }
});
```

### 2. 创建登录页面

```svelte
<!-- src/routes/auth/signin/+page.svelte -->
<script lang="ts">
  import { signIn, authStore } from 'sveltefireauth';

  let email = '';
  let password = '';

  async function handleSignIn() {
    try {
      await signIn(email, password, '/dashboard');
    } catch (error) {
      console.error('登录失败:', error);
    }
  }
</script>

<form on:submit|preventDefault={handleSignIn}>
  <input bind:value={email} type="email" placeholder="邮箱" required />
  <input bind:value={password} type="password" placeholder="密码" required />
  <button type="submit" disabled={$authStore.loading}>
    {$authStore.loading ? '登录中...' : '登录'}
  </button>
</form>

{#if $authStore.error}
  <p class="error">{$authStore.error}</p>
{/if}
```

### 3. 创建注册页面

```svelte
<!-- src/routes/auth/signup/+page.svelte -->
<script lang="ts">
  import { signUp, authStore } from 'sveltefireauth';

  let email = '';
  let password = '';
  let displayName = '';

  async function handleSignUp() {
    try {
      await signUp(email, password, displayName, '/dashboard');
    } catch (error) {
      console.error('注册失败:', error);
    }
  }
</script>

<form on:submit|preventDefault={handleSignUp}>
  <input bind:value={displayName} type="text" placeholder="显示名称" />
  <input bind:value={email} type="email" placeholder="邮箱" required />
  <input bind:value={password} type="password" placeholder="密码" required />
  <button type="submit" disabled={$authStore.loading}>
    {$authStore.loading ? '注册中...' : '注册'}
  </button>
</form>
```

### 4. 保护页面

```typescript
// src/routes/dashboard/+page.server.ts
import { protectRoute } from 'sveltefireauth';

export const load = protectRoute();
```

### 5. 使用用户状态

```svelte
<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
  import { authStore, signOut, updateProfile } from 'sveltefireauth';

  async function handleSignOut() {
    await signOut('/');
  }

  async function handleUpdateProfile() {
    await updateProfile({
      displayName: '新的显示名称'
    });
  }
</script>

{#if $authStore.authenticated}
  <h1>欢迎, {$authStore.user?.displayName || $authStore.user?.email}!</h1>

  <p>邮箱: {$authStore.user?.email}</p>
  <p>邮箱验证状态: {$authStore.user?.emailVerified ? '已验证' : '未验证'}</p>

  <button on:click={handleUpdateProfile}>更新资料</button>
  <button on:click={handleSignOut}>登出</button>
{/if}
```

## API 参考

### 客户端函数

- `signUp(email, password, displayName?, redirectTo?)` - 用户注册
- `signIn(email, password, redirectTo?)` - 用户登录
- `signOut(redirectTo?)` - 用户登出
- `updateProfile(updates)` - 更新用户资料
- `updateEmail(email)` - 更新邮箱
- `updatePassword(password)` - 更新密码
- `sendEmailVerification()` - 发送邮箱验证
- `sendPasswordReset(email)` - 发送密码重置
- `deleteAccount(redirectTo?)` - 删除账户

### Stores

- `authStore.user` - 当前用户信息
- `authStore.authenticated` - 是否已认证
- `authStore.loading` - 加载状态
- `authStore.error` - 错误信息
- `authStore.emailVerified` - 邮箱验证状态

## 高级功能

### 自定义会话管理

支持实现自定义的会话管理器，例如使用 Redis：

```typescript
import type { SessionManager } from 'sveltefireauth/server';

class RedisSessionManager implements SessionManager {
  async createSession(user: User): Promise<string> { /* ... */ }
  async verifySession(sessionId: string): Promise<User | null> { /* ... */ }
  async clearSession(): Promise<string> { /* ... */ }
}

export const handle = createAuthHook({
  firebase: { /* ... */ },
  sessionManager: new RedisSessionManager()
});
```

### 数据转换

支持自定义用户数据和响应数据的转换：

```typescript
export const handle = createAuthHook({
  firebase: { /* ... */ },
  userTransformer: async (user) => ({
    ...user,
    role: await getUserRole(user.uid),
    permissions: await getUserPermissions(user.uid)
  }),
  responseTransformer: async (data) => {
    // 移除敏感信息
    const { accessToken, refreshToken, ...safeData } = data;
    return safeData;
  }
});
```

### Action 页面

支持自定义 Firebase 操作页面（密码重置、邮箱验证等）：

```typescript
export const handle = createAuthHook({
  firebase: { /* ... */ },
  actionConfig: {
    successPage: (result) => `<html>...</html>`,
    errorPage: (error, mode) => `<html>...</html>`,
    customHandlers: {
      resetPassword: async (params) => { /* 自定义逻辑 */ }
    }
  }
});
```

详细的高级使用指南请参考 [examples/advanced-usage.md](examples/advanced-usage.md)。

## 许可证

MIT
