# SvelteFireAuth 基础使用示例

## 1. 安装和配置

### 安装依赖

```bash
npm install sveltefireauth
```

### 配置 Firebase

在 Firebase 控制台中：
1. 创建新项目或选择现有项目
2. 启用 Authentication
3. 配置登录方法（邮箱/密码）
4. 获取项目配置信息

## 2. SvelteKit 集成

### hooks.server.ts

```typescript
// src/hooks.server.ts
import { createAuthHook } from 'sveltefireauth/server';

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

### app.d.ts

```typescript
// src/app.d.ts
import type { User } from 'sveltefireauth';

declare global {
  namespace App {
    interface Locals {
      user: User | null;
    }
  }
}

export {};
```

## 3. 认证页面

### 登录页面

```svelte
<!-- src/routes/auth/signin/+page.svelte -->
<script lang="ts">
  import { signIn, user, loading, error } from 'sveltefireauth';
  import { goto } from '$app/navigation';
  
  let email = '';
  let password = '';
  
  async function handleSignIn() {
    try {
      await signIn(email, password);
      goto('/dashboard');
    } catch (err) {
      console.error('登录失败:', err);
    }
  }
</script>

<div class="auth-container">
  <h1>登录</h1>
  
  <form on:submit|preventDefault={handleSignIn}>
    <div class="form-group">
      <label for="email">邮箱</label>
      <input 
        id="email"
        type="email" 
        bind:value={email} 
        placeholder="请输入邮箱"
        required 
      />
    </div>
    
    <div class="form-group">
      <label for="password">密码</label>
      <input 
        id="password"
        type="password" 
        bind:value={password} 
        placeholder="请输入密码"
        required 
      />
    </div>
    
    <button type="submit" disabled={$loading}>
      {$loading ? '登录中...' : '登录'}
    </button>
  </form>
  
  {#if $error}
    <div class="error">{$error}</div>
  {/if}
  
  <p>
    还没有账户？ 
    <a href="/auth/signup">立即注册</a>
  </p>
</div>

<style>
  .auth-container {
    max-width: 400px;
    margin: 2rem auto;
    padding: 2rem;
    border: 1px solid #ddd;
    border-radius: 8px;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: bold;
  }
  
  input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  button {
    width: 100%;
    padding: 0.75rem;
    background: #4285f4;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
  }
  
  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .error {
    color: red;
    margin-top: 1rem;
    padding: 0.5rem;
    background: #ffebee;
    border-radius: 4px;
  }
</style>
```

### 注册页面

```svelte
<!-- src/routes/auth/signup/+page.svelte -->
<script lang="ts">
  import { signUp, loading, error } from 'sveltefireauth';
  import { goto } from '$app/navigation';
  
  let email = '';
  let password = '';
  let displayName = '';
  
  async function handleSignUp() {
    try {
      await signUp(email, password, displayName);
      goto('/dashboard');
    } catch (err) {
      console.error('注册失败:', err);
    }
  }
</script>

<div class="auth-container">
  <h1>注册</h1>
  
  <form on:submit|preventDefault={handleSignUp}>
    <div class="form-group">
      <label for="displayName">显示名称</label>
      <input 
        id="displayName"
        type="text" 
        bind:value={displayName} 
        placeholder="请输入显示名称"
      />
    </div>
    
    <div class="form-group">
      <label for="email">邮箱</label>
      <input 
        id="email"
        type="email" 
        bind:value={email} 
        placeholder="请输入邮箱"
        required 
      />
    </div>
    
    <div class="form-group">
      <label for="password">密码</label>
      <input 
        id="password"
        type="password" 
        bind:value={password} 
        placeholder="请输入密码（至少6位，包含字母和数字）"
        required 
      />
    </div>
    
    <button type="submit" disabled={$loading}>
      {$loading ? '注册中...' : '注册'}
    </button>
  </form>
  
  {#if $error}
    <div class="error">{$error}</div>
  {/if}
  
  <p>
    已有账户？ 
    <a href="/auth/signin">立即登录</a>
  </p>
</div>
```

## 4. 受保护的页面

### 控制台页面

```svelte
<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
  import { user, signOut, updateProfile, sendEmailVerification } from 'sveltefireauth';
  import { goto } from '$app/navigation';
  
  let newDisplayName = $user?.displayName || '';
  
  async function handleSignOut() {
    await signOut();
    goto('/');
  }
  
  async function handleUpdateProfile() {
    if (newDisplayName.trim()) {
      await updateProfile({ displayName: newDisplayName.trim() });
    }
  }
  
  async function handleSendVerification() {
    await sendEmailVerification();
    alert('验证邮件已发送，请检查您的邮箱');
  }
</script>

<div class="dashboard">
  <header>
    <h1>用户控制台</h1>
    <button on:click={handleSignOut}>登出</button>
  </header>
  
  {#if $user}
    <div class="user-info">
      <h2>用户信息</h2>
      <p><strong>邮箱:</strong> {$user.email}</p>
      <p><strong>显示名称:</strong> {$user.displayName || '未设置'}</p>
      <p>
        <strong>邮箱验证:</strong> 
        {#if $user.emailVerified}
          <span class="verified">✅ 已验证</span>
        {:else}
          <span class="unverified">❌ 未验证</span>
          <button on:click={handleSendVerification}>发送验证邮件</button>
        {/if}
      </p>
    </div>
    
    <div class="profile-update">
      <h3>更新资料</h3>
      <div class="form-group">
        <label for="displayName">显示名称</label>
        <input 
          id="displayName"
          type="text" 
          bind:value={newDisplayName} 
          placeholder="请输入新的显示名称"
        />
        <button on:click={handleUpdateProfile}>更新</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .dashboard {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #ddd;
  }
  
  .user-info {
    background: #f5f5f5;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;
  }
  
  .verified {
    color: green;
  }
  
  .unverified {
    color: red;
  }
  
  .profile-update {
    background: white;
    padding: 1.5rem;
    border: 1px solid #ddd;
    border-radius: 8px;
  }
  
  .form-group {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  
  button {
    padding: 0.5rem 1rem;
    background: #4285f4;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
</style>
```

### 页面保护

```typescript
// src/routes/dashboard/+page.server.ts
import { protectRoute } from 'sveltefireauth/server';

export const load = protectRoute();
```

## 5. 高级功能

### 自定义中间件

```typescript
// src/hooks.server.ts
import { authMiddleware } from 'sveltefireauth/server';

export const handle = authMiddleware({
  firebase: firebaseConfig,
  config: {
    protectedPaths: ['/admin/*', '/dashboard/*'],
    publicPaths: ['/auth/*', '/', '/about'],
    loginPath: '/auth/signin',
    autoRefresh: true,
    sessionCookie: {
      name: '__session',
      maxAge: 5 * 24 * 60 * 60, // 5 天
      secure: true,
      httpOnly: true,
      sameSite: 'lax'
    }
  }
});
```

### 角色基础的保护

```typescript
// src/routes/admin/+page.server.ts
import { createRoleBasedProtection } from 'sveltefireauth/server';

export const load = createRoleBasedProtection(
  ['admin', 'moderator'],
  (user) => user.customClaims?.roles || []
);
```

这个示例展示了 SvelteFireAuth 的基本使用方法。更多高级功能请参考完整文档。
