<!-- 示例主页 -->
<script lang="ts">
  import { user, authenticated } from '$lib/index.js';
  import { goto } from '$app/navigation';

  function goToAuth() {
    goto('/auth/signin');
  }

  function goToDashboard() {
    goto('/dashboard');
  }
</script>

<svelte:head>
  <title>SvelteFireAuth 示例</title>
</svelte:head>

<main>
  <h1>SvelteFireAuth 示例应用</h1>

  <p>这是一个基于 Firebase Auth REST API 的 Svelte 认证库示例。</p>

  {#if $authenticated}
    <div class="user-info">
      <h2>欢迎回来！</h2>
      <p>用户: {$user?.displayName || $user?.email}</p>
      <p>邮箱验证: {$user?.emailVerified ? '✅ 已验证' : '❌ 未验证'}</p>
      <button on:click={goToDashboard}>进入控制台</button>
    </div>
  {:else}
    <div class="auth-prompt">
      <h2>开始使用</h2>
      <p>请登录或注册以体验完整功能。</p>
      <button on:click={goToAuth}>登录 / 注册</button>
    </div>
  {/if}

  <section class="features">
    <h2>功能特性</h2>
    <ul>
      <li>🔥 基于 Firebase Auth REST API</li>
      <li>🚀 SvelteKit 集成</li>
      <li>🍪 Session Cookies 管理</li>
      <li>🔒 路由保护</li>
      <li>📱 响应式状态管理</li>
      <li>🛡️ TypeScript 支持</li>
    </ul>
  </section>
</main>

<style>
  main {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  h1 {
    color: #333;
    text-align: center;
    margin-bottom: 2rem;
  }

  .user-info, .auth-prompt {
    background: #f5f5f5;
    padding: 2rem;
    border-radius: 8px;
    margin: 2rem 0;
    text-align: center;
  }

  .features {
    margin-top: 3rem;
  }

  .features ul {
    list-style: none;
    padding: 0;
  }

  .features li {
    padding: 0.5rem 0;
    font-size: 1.1rem;
  }

  button {
    background: #4285f4;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.2s;
  }

  button:hover {
    background: #3367d6;
  }

  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
</style>
