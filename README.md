# SvelteFireAuth

一个基于 Google Identity Platform (Firebase Auth) REST API 的 Svelte 用户认证库. 它提供了一套完整的后端 API 和前端辅助函数, 让您无需集成庞大的 Firebase 客户端 SDK 即可为您的 SvelteKit 应用添加安全、强大的用户认证功能.

## 核心特性

- **轻量级**: 仅依赖 `fetch` API, 无需引入 Firebase 客户端 SDK, 减小前端包体积.
- **后端集成**: 通过单个 SvelteKit `Handle` 即可在服务器端自动创建所有必要的用户认证 REST API 端点.
- **前端友好**: 提供一套简单易用的前端辅助函数, 方便在 Svelte 组件中调用认证 API.
- **类型安全**: 完全使用 TypeScript 编写, 为 API 响应和请求提供完整的类型定义.
- **单例模式**: 后端通过单例模式管理 `IdentityPlatform` 客户端, 确保 API 密钥和实例的全局唯一性和安全性.
- **功能完整**: 实现了 Google Identity Platform REST API 的大部分常用功能, 包括注册, 登录, 密码重置, 个人资料更新等.

## 1. 服务器端集成

集成 `SvelteFireAuth` 的第一步是在您的 SvelteKit 后端设置认证 API.

### 1.1 设置环境变量

首先, 在您的项目根目录下创建一个 `.env` 文件, 并添加您的 Firebase 项目的 Web API 密钥. 您可以从 Firebase 项目的设置中找到这个值.

```bash
# .env
FIREBASE_API_KEY="your-firebase-web-api-key"
```

### 1.2 创建服务器钩子 (Hook)

在 `src/hooks.server.ts` 文件中, 导入 `createAuthHanle` 并用您的 API 密钥创建 handle. 这个 handle 会拦截指向 `/api/auth/*` 的请求, 并将其路由到相应的认证服务.

```typescript
// src/hooks.server.ts
import { createAuthHanle } from 'sveltefireauth/server'; // 假设包名为 sveltefireauth
import { env } from '$env/dynamic/private';

// 从环境变量中安全地获取你的 API Key
const apiKey = env.FIREBASE_API_KEY;

// 使用 API Key 创建并导出 handle
export const handle = createAuthHanle(apiKey);
```

完成以上步骤后, 您的 SvelteKit 应用后端就已经拥有了一套完整的用户认证 REST API.

## 2. 客户端使用

`SvelteFireAuth` 提供了一系列辅助函数, 让您可以在前端组件中轻松地与后端 API 交互.

### 2.1 导入客户端函数

您可以从 `sveltefireauth/client` 导入所有可用的前端函数.

```svelte
<script lang="ts">
  import { 
    signUpWithEmailPassword, 
    signInWithEmailPassword,
    sendPasswordResetEmail,
    getUserData,
    // ... and other functions
  } from 'sveltefireauth/client'; // 假设包名为 sveltefireauth

  let email = '';
  let password = '';
  let userData = null;
  let message = '';

  async function handleSignUp() {
    try {
      const authResponse = await signUpWithEmailPassword(email, password);
      message = `注册成功! 用户 ID: ${authResponse.localId}`;
      // 登录成功后, 您通常需要将 idToken 和 refreshToken 存储在 cookie 或 localStorage 中
    } catch (error: any) {
      message = `注册失败: ${error.message}`;
    }
  }

  async function handleSignIn() {
    try {
      const authResponse = await signInWithEmailPassword(email, password);
      message = `登录成功!`;
      // 示例: 登录后获取用户信息
      const userResponse = await getUserData(authResponse.idToken);
      userData = userResponse.users[0];
    } catch (error: any) {
      message = `登录失败: ${error.message}`;
    }
  }
</script>

<!-- 你的组件 HTML -->
```

### 2.2 客户端函数列表

以下是所有可用的客户端辅助函数:

- `signUpWithEmailPassword(email, password)`: 注册新用户.
- `signInWithEmailPassword(email, password)`: 使用邮箱密码登录.
- `signInAnonymously()`: 匿名登录.
- `refreshToken(token)`: 使用 `refreshToken` 换取新的 `idToken`.
- `sendPasswordResetEmail(email)`: 发送密码重置邮件.
- `confirmPasswordReset(oobCode, newPassword)`: 使用邮件中的 `oobCode` 确认密码重置.
- `getUserData(idToken)`: 获取当前登录用户的信息.
- `updateProfile(idToken, displayName?, photoUrl?)`: 更新用户的显示名称或头像 URL.
- `changeEmail(idToken, email)`: 更改用户的邮箱.
- `changePassword(idToken, password)`: 更改用户的密码.
- `sendEmailVerification(idToken)`: 发送邮箱验证邮件.
- `confirmEmailVerification(oobCode)`: 使用邮件中的 `oobCode` 确认邮箱验证.
- `deleteAccount(idToken)`: 删除用户账户.

## 3. API 参考

### 3.1 后端 REST API 端点

`createAuthHanle` 会自动创建以下 API 端点. 所有端点都位于 `/api/auth/` 路径下, 并使用 `POST` 方法.

| 端点 Action (`/api/auth/[action]`) | 描述                               | 请求体 Body 参数                                   |
| ---------------------------------- | ---------------------------------- | -------------------------------------------------- |
| `signUpWithEmailPassword`          | 使用邮箱和密码注册新用户         | `{ "email", "password" }`                          |
| `signInWithEmailPassword`          | 使用邮箱和密码登录               | `{ "email", "password" }`                          |
| `signInAnonymously`                | 匿名登录                         | `{}`                                               |
| `refreshToken`                     | 刷新用户的 ID 令牌               | `{ "refreshToken" }`                               |
| `sendPasswordResetEmail`           | 发送密码重置邮件                 | `{ "email" }`                                      |
| `confirmPasswordReset`             | 确认密码重置                     | `{ "oobCode", "newPassword" }`                     |
| `getUserData`                      | 获取用户信息                     | `{ "idToken" }`                                    |
| `updateProfile`                    | 更新用户个人资料                 | `{ "idToken", "displayName"?, "photoUrl"? }`       |
| `changeEmail`                      | 更改用户邮箱                     | `{ "idToken", "email" }`                           |
| `changePassword`                   | 更改用户密码                     | `{ "idToken", "password" }`                        |
| `sendEmailVerification`            | 发送邮箱验证邮件                 | `{ "idToken" }`                                    |
| `confirmEmailVerification`         | 确认邮箱验证                     | `{ "oobCode" }`                                    |
| `deleteAccount`                    | 删除用户账户                     | `{ "idToken" }`                                    |

### 3.2 `identity-platform.ts` (内部核心)

`src/lib/identity-platform.ts` 是本库的核心, 它是一个封装了 Google Identity Platform REST API 的 TypeScript 类.

- **设计模式**: 它被实现为一个单例 (`Singleton`), 由服务器端的 `createAuthHanle` 进行实例化和管理. 这确保了在整个应用生命周期中, 只有一个 `IdentityPlatform` 实例存在, 避免了 API 密钥的重复加载和实例的滥用.
- **主要职责**: 该类负责直接与 Google 的 API 端点进行通信, 处理请求的构造, 发送以及响应的解析.
- **直接使用**: 对于库的使用者来说, **通常不需要直接与 `IdentityPlatform` 类交互**. 后端的 REST API 和前端的辅助函数已经封装了其所有功能. 直接使用它适用于需要扩展库功能或进行更底层定制的高级场景.

## 开发

本项目使用 SvelteKit 进行开发.

- **安装依赖**: `npm install`
- **启动开发服务器**: `npm run dev`
- **构建项目**: `npm run build`
- **运行测试**: `npm run test`
