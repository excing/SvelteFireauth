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

## 如何使用

首先，您需要在您的项目中初始化 `IdentityPlatform` 实例。建议在项目的根布局文件（例如 `src/routes/+layout.svelte`）中进行初始化。

**1. 初始化**

您需要从 Google Cloud 控制台获取您的 Web API 密钥。

```typescript
// src/lib/identity-platform.ts
import IdentityPlatform from './identity-platform';

const apiKey = 'YOUR_API_KEY'; // 替换为您的 API 密钥
const identityPlatform = IdentityPlatform.getInstance(apiKey);

export default identityPlatform;
```

**2. 用户注册示例**

现在您可以在您的 Svelte 组件中导入并使用它。

```svelte
<script lang="ts">
  import identityPlatform from '../lib/identity-platform';

  let email = '';
  let password = '';
  let message = '';

  async function handleSignUp() {
    const response = await identityPlatform.signUpWithEmailPassword(email, password);

    if ('error' in response) {
      message = `注册失败: ${response.error.message}`;
    } else {
      message = '注册成功！';
      console.log(response);
    }
  }
</script>

<main>
  <h1>用户注册</h1>
  <input type="email" bind:value={email} placeholder="电子邮件" />
  <input type="password" bind:value={password} placeholder="密码" />
  <button on:click={handleSignUp}>注册</button>
  <p>{message}</p>
</main>
```

## API 参考

`IdentityPlatform` 类提供了多种与用户认证相关的方法。以下是一些常用方法的列表：

- `signUpWithEmailPassword(email, password)`: 使用邮箱和密码注册新用户。
- `signInWithEmailPassword(email, password)`: 使用邮箱和密码登录。
- `sendPasswordResetEmail(email)`: 发送密码重置邮件。
- `changePassword(idToken, newPassword)`: 更改用户密码。
- `updateProfile(idToken, { displayName, photoUrl })`: 更新用户个人资料。
- `getUserData(idToken)`: 获取用户信息。
- `deleteAccount(idToken)`: 删除用户账户。

更多方法和详细信息，请直接参考 `src/lib/identity-platform.ts` 文件中的源代码和注释。

## 开发

本项目使用 SvelteKit 进行开发。

- **安装依赖**: `npm install`
- **启动开发服务器**: `npm run dev`
- **构建项目**: `npm run build`
- **运行测试**: `npm run test`