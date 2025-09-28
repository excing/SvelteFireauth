# SvelteFireAuth 高级使用指南

本指南展示了 SvelteFireAuth 的高级功能，包括自定义会话管理、数据转换和 Action 页面处理。

## 1. 自定义会话管理

### 实现自定义会话管理器

```typescript
// src/lib/custom-session.ts
import type { SessionManager, User } from 'sveltefireauth/server';
import { Redis } from 'ioredis';

export class RedisSessionManager implements SessionManager {
  private redis: Redis;
  private prefix = 'auth:session:';

  constructor(redisUrl: string) {
    this.redis = new Redis(redisUrl);
  }

  async createSession(user: User): Promise<string> {
    const sessionId = crypto.randomUUID();
    const sessionData = {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      photoURL: user.photoURL,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
      expirationTime: user.expirationTime,
      createdAt: Date.now()
    };

    // 存储到 Redis，设置过期时间
    await this.redis.setex(
      `${this.prefix}${sessionId}`,
      7 * 24 * 60 * 60, // 7 天
      JSON.stringify(sessionData)
    );

    // 返回 Cookie 字符串
    return `__session=${sessionId}; Path=/; Max-Age=${7 * 24 * 60 * 60}; HttpOnly; SameSite=lax; Secure`;
  }

  async verifySession(cookieValue: string): Promise<User | null> {
    try {
      // 从 Cookie 中提取 session ID
      const match = cookieValue.match(/__session=([^;]+)/);
      if (!match) return null;

      const sessionId = match[1];
      const sessionData = await this.redis.get(`${this.prefix}${sessionId}`);
      
      if (!sessionData) return null;

      const data = JSON.parse(sessionData);
      
      // 检查是否过期
      if (Date.now() > data.expirationTime) {
        await this.redis.del(`${this.prefix}${sessionId}`);
        return null;
      }

      return {
        uid: data.uid,
        email: data.email,
        emailVerified: data.emailVerified,
        displayName: data.displayName,
        photoURL: data.photoURL,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expirationTime: data.expirationTime,
        expiresIn: Math.floor((data.expirationTime - Date.now()) / 1000),
        createdAt: new Date(data.createdAt).toISOString(),
        isAnonymous: false
      };
    } catch {
      return null;
    }
  }

  async clearSession(cookieValue?: string): Promise<string> {
    if (cookieValue) {
      const match = cookieValue.match(/__session=([^;]+)/);
      if (match) {
        const sessionId = match[1];
        await this.redis.del(`${this.prefix}${sessionId}`);
      }
    }
    
    return '__session=; Path=/; Max-Age=0; HttpOnly; SameSite=lax; Secure';
  }

  async refreshSession(cookieValue: string): Promise<string> {
    const user = await this.verifySession(cookieValue);
    if (!user) {
      throw new Error('Invalid session');
    }
    
    // 清除旧会话
    await this.clearSession(cookieValue);
    
    // 创建新会话
    return this.createSession(user);
  }
}
```

### 在 hooks.server.ts 中使用自定义会话管理器

```typescript
// src/hooks.server.ts
import { createAuthHook } from 'sveltefireauth/server';
import { RedisSessionManager } from '$lib/custom-session';

const sessionManager = new RedisSessionManager(process.env.REDIS_URL!);

export const handle = createAuthHook({
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY!,
    projectId: process.env.FIREBASE_PROJECT_ID!
  },
  sessionManager, // 使用自定义会话管理器
  middleware: {
    protectedPaths: ['/dashboard', '/profile'],
    loginPath: '/auth/signin'
  }
});
```

## 2. 数据转换

### 用户数据转换

```typescript
// src/lib/transformers.ts
import type { User, UserTransformer } from 'sveltefireauth/server';

// 添加自定义字段到用户对象
export const userTransformer: UserTransformer = async (user: User): Promise<User> => {
  // 从数据库获取额外的用户信息
  const userProfile = await getUserProfileFromDB(user.uid);
  
  return {
    ...user,
    // 添加自定义字段
    role: userProfile?.role || 'user',
    permissions: userProfile?.permissions || [],
    lastActiveAt: userProfile?.lastActiveAt,
    preferences: userProfile?.preferences || {},
    // 格式化显示名称
    displayName: user.displayName || `用户${user.uid.slice(-6)}`,
    // 生成默认头像
    photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`
  };
};

// 响应数据转换
export const responseTransformer: ResponseTransformer = async (data: any): Promise<any> => {
  // 移除敏感信息
  if (data.user) {
    const { accessToken, refreshToken, ...safeUser } = data.user;
    return {
      ...data,
      user: safeUser
    };
  }
  
  return data;
};

async function getUserProfileFromDB(uid: string) {
  // 这里实现从数据库获取用户资料的逻辑
  // 例如使用 Prisma、Drizzle 等 ORM
  return {
    role: 'user',
    permissions: ['read'],
    lastActiveAt: new Date().toISOString(),
    preferences: { theme: 'light', language: 'zh-CN' }
  };
}
```

### 在 hooks.server.ts 中使用数据转换器

```typescript
// src/hooks.server.ts
import { createAuthHook } from 'sveltefireauth/server';
import { userTransformer, responseTransformer } from '$lib/transformers';

export const handle = createAuthHook({
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY!,
    projectId: process.env.FIREBASE_PROJECT_ID!
  },
  userTransformer,
  responseTransformer,
  middleware: {
    protectedPaths: ['/dashboard', '/profile'],
    loginPath: '/auth/signin'
  }
});
```

## 3. Action 页面处理

### 自定义 Action 页面

```typescript
// src/lib/action-config.ts
import type { ActionPageConfig, ActionResult, ActionPageParams } from 'sveltefireauth/server';

export const actionConfig: ActionPageConfig = {
  // 自定义成功页面
  successPage: (result: ActionResult) => {
    const messages = {
      resetPassword: '密码重置链接已验证，请设置新密码。',
      verifyEmail: '邮箱验证成功！您现在可以使用所有功能。',
      recoverEmail: '邮箱恢复请求已处理。',
      signIn: '登录成功！正在跳转...',
      verifyAndChangeEmail: '邮箱更改已验证。'
    };

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>操作成功 - 我的应用</title>
    <link href="https://cdn.tailwindcss.com" rel="stylesheet">
</head>
<body class="bg-gray-50 flex items-center justify-center min-h-screen">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg class="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h3 class="mt-4 text-lg font-medium text-gray-900">操作成功</h3>
            <p class="mt-2 text-sm text-gray-500">${messages[result.mode] || '操作已完成'}</p>
            <div class="mt-6">
                <a href="${result.redirectUrl || '/'}" 
                   class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                    继续
                </a>
            </div>
        </div>
    </div>
    <script>
        setTimeout(() => {
            window.location.href = '${result.redirectUrl || '/'}';
        }, 3000);
    </script>
</body>
</html>`;
  },

  // 自定义错误页面
  errorPage: (error: string, mode) => {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>操作失败 - 我的应用</title>
    <link href="https://cdn.tailwindcss.com" rel="stylesheet">
</head>
<body class="bg-gray-50 flex items-center justify-center min-h-screen">
    <div class="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div class="text-center">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </div>
            <h3 class="mt-4 text-lg font-medium text-gray-900">操作失败</h3>
            <p class="mt-2 text-sm text-gray-500">${error}</p>
            <div class="mt-6 space-y-3">
                <a href="/auth/signin" 
                   class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                    重新登录
                </a>
                <a href="/" 
                   class="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    返回首页
                </a>
            </div>
        </div>
    </div>
</body>
</html>`;
  },

  // 自定义处理器
  customHandlers: {
    resetPassword: async (params: ActionPageParams) => {
      // 自定义密码重置逻辑
      try {
        // 验证重置代码并获取邮箱
        const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${process.env.FIREBASE_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ oobCode: params.oobCode })
        });

        if (!response.ok) {
          throw new Error('Invalid reset code');
        }

        const data = await response.json();
        
        // 记录重置请求到数据库
        await logPasswordReset(data.email);

        return {
          success: true,
          mode: params.mode,
          data: { email: data.email, oobCode: params.oobCode },
          redirectUrl: `/auth/reset-password?code=${params.oobCode}`
        };
      } catch (error: any) {
        return {
          success: false,
          mode: params.mode,
          error: error.message || 'Invalid or expired reset code'
        };
      }
    }
  },

  defaultRedirectUrl: '/dashboard'
};

async function logPasswordReset(email: string) {
  // 记录密码重置到数据库
  console.log(`Password reset requested for: ${email}`);
}
```

### 在 hooks.server.ts 中使用 Action 配置

```typescript
// src/hooks.server.ts
import { createAuthHook } from 'sveltefireauth/server';
import { actionConfig } from '$lib/action-config';

export const handle = createAuthHook({
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY!,
    projectId: process.env.FIREBASE_PROJECT_ID!
  },
  actionConfig,
  actionPrefix: '/auth/action', // 自定义 Action 页面路径
  middleware: {
    protectedPaths: ['/dashboard', '/profile'],
    loginPath: '/auth/signin'
  }
});
```

## 4. 完整配置示例

```typescript
// src/hooks.server.ts
import { createAuthHook } from 'sveltefireauth/server';
import { RedisSessionManager } from '$lib/custom-session';
import { userTransformer, responseTransformer } from '$lib/transformers';
import { actionConfig } from '$lib/action-config';

const sessionManager = new RedisSessionManager(process.env.REDIS_URL!);

export const handle = createAuthHook({
  firebase: {
    apiKey: process.env.FIREBASE_API_KEY!,
    projectId: process.env.FIREBASE_PROJECT_ID!
  },
  
  // 自定义会话管理
  sessionManager,
  
  // 数据转换
  userTransformer,
  responseTransformer,
  
  // Action 页面配置
  actionConfig,
  actionPrefix: '/auth/action',
  
  // 中间件配置
  middleware: {
    protectedPaths: ['/dashboard', '/profile', '/admin'],
    publicPaths: ['/auth', '/api/auth', '/', '/about'],
    loginPath: '/auth/signin',
    redirectPath: '/dashboard',
    autoRefresh: true
  },
  
  // API 配置
  apiPrefix: '/api/auth',
  
  // CORS 配置
  cors: {
    origin: ['http://localhost:5173', 'https://myapp.com'],
    credentials: true
  }
});
```

这样配置后，您的应用将具有：

1. **Redis 会话管理** - 高性能、可扩展的会话存储
2. **数据转换** - 自动添加用户角色、权限等自定义字段
3. **自定义 Action 页面** - 美观的密码重置、邮箱验证页面
4. **完整的认证流程** - 包括路由保护、自动刷新等功能

## Firebase 控制台配置

在 Firebase 控制台中设置自定义操作网址：

1. 进入 Firebase 控制台 > Authentication > Templates
2. 选择要自定义的邮件类型（密码重置、邮箱验证等）
3. 点击编辑图标
4. 点击"自定义操作网址"
5. 输入您的网址：`https://yourdomain.com/auth/action`

Firebase 会自动在网址后添加 `mode` 和 `oobCode` 参数。
