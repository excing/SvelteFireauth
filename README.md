# SvelteFireAuth

一个基于 Firebase Auth REST API 的 Svelte 认证库，提供完整的用户认证功能，无需使用 Firebase 客户端 SDK。

## 特性

- **轻量级**: 无需引入庞大的 Firebase 客户端 SDK，仅依赖 `fetch` API。
- **现代化**: 基于 SvelteKit 和 Vite，提供最佳的开发体验。
- **TypeScript 支持**: 使用 TypeScript 编写，提供完整的类型定义。
- **单例模式**: 通过单例模式管理 API 客户端，确保全局唯一实例。
- **完整的 API 实现**: 实现了 Google Identity Platform REST API 的大部分常用功能。

## 安装

```bash
npm install sveltefireauth
```

## 快速入门

`SvelteFireAuth` 提供了一个 SvelteKit `Handle` 来快速为您的应用后端集成用户认证 REST API.

**1. 设置环境变量**

首先, 在您的项目根目录下创建一个 `.env` 文件, 并添加您的 Firebase 项目 Web API 密钥.

```bash
# .env
FIREBASE_API_KEY="your-firebase-web-api-key"
```

**2. 创建服务器钩子 (Hook)**

在 `src/hooks.server.ts` 文件中, 导入 `createAuthHanle` 并使用您的 API 密钥创建 handle.

```typescript
// src/hooks.server.ts
import { createAuthHanle } from 'sveltefireauth/server'; // 假设包名为 sveltefireauth
import { env } from '$env/dynamic/private';

// 从环境变量中安全地获取你的 API Key
const apiKey = env.FIREBASE_API_KEY;

// 创建并导出 handle
export const handle = createAuthHanle(apiKey);
```

**3. 完成!**

现在, 您的 SvelteKit 应用已经拥有了一套完整的用户认证 REST API. 您可以在前端通过 `fetch` 调用这些接口.

## API 端点

`createAuthHanle` 会自动创建以下 API 端点, 所有端点都位于 `/api/auth/` 路径下, 并使用 `POST` 方法.

| 端点 Action                 | 描述                               | 请求体 Body 参数                                   |
| --------------------------- | ---------------------------------- | -------------------------------------------------- |
| `signUpWithEmailPassword`   | 使用邮箱和密码注册新用户         | `{ "email", "password" }`                          |
| `signInWithEmailPassword`   | 使用邮箱和密码登录               | `{ "email", "password" }`                          |
| `signInAnonymously`         | 匿名登录                         | `{}`                                               |
| `refreshToken`              | 刷新用户的 ID 令牌               | `{ "refreshToken" }`                               |
| `sendPasswordResetEmail`    | 发送密码重置邮件                 | `{ "email" }`                                      |
| `confirmPasswordReset`      | 确认密码重置                     | `{ "oobCode", "newPassword" }`                     |
| `getUserData`               | 获取用户信息                     | `{ "idToken" }`                                    |
| `updateProfile`             | 更新用户个人资料                 | `{ "idToken", "displayName"?, "photoUrl"? }`       |
| `changeEmail`               | 更改用户邮箱                     | `{ "idToken", "email" }`                           |
| `changePassword`            | 更改用户密码                     | `{ "idToken", "password" }`                        |
| `sendEmailVerification`     | 发送邮箱验证邮件                 | `{ "idToken" }`                                    |
| `confirmEmailVerification`  | 确认邮箱验证                     | `{ "oobCode" }`                                    |
| `deleteAccount`             | 删除用户账户                     | `{ "idToken" }`                                    |

**前端调用示例:**

```javascript
// 在你的 Svelte 组件中
async function signUp() {
  const response = await fetch('/api/auth/signUpWithEmailPassword', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'user@example.com', password: 'secretpassword' })
  });
  const data = await response.json();
  
  if (response.ok) {
    console.log('注册成功:', data);
  } else {
    console.error('注册失败:', data.error.message);
  }
}
```

## 开发

本项目使用 SvelteKit 进行开发。

- **安装依赖**: `npm install`
- **启动开发服务器**: `npm run dev`
- **构建项目**: `npm run build`
- **运行测试**: `npm run test`