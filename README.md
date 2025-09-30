# SvelteFireauth

A comprehensive Firebase Authentication library for SvelteKit applications. Provides both server-side API proxy and client-side authentication state management.

## Features

- 🔥 **Firebase Auth REST API Integration** - Full support for Firebase Authentication
- 🚀 **One-Click Setup** - Easy integration via SvelteKit hooks
- 🔒 **Route Protection** - Built-in authentication guards
- 📦 **Zero Dependencies** - No Firebase SDK required (optional)
- 🎯 **TypeScript First** - Full type safety
- 🔄 **Auto Token Refresh** - Automatic token management
- 💾 **Persistent Sessions** - LocalStorage support
- 🎨 **Flexible** - Direct or proxy mode

## Installation

```bash
npm install sveltefireauth
```

## Quick Start

### Server-Side Setup (One-Click Integration)

```typescript
// src/hooks.server.ts
import { createAuthHandle } from 'sveltefireauth/server';

export const handle = createAuthHandle({
  firebaseApiKey: 'YOUR_FIREBASE_API_KEY',
  apiPath: '/api/auth' // optional, default: '/api/auth'
});
```

### Client-Side Setup

```typescript
// src/routes/+layout.svelte
<script lang="ts">
  import { initAuth } from 'sveltefireauth/client';
  import { onMount } from 'svelte';

  onMount(() => {
    initAuth({
      mode: 'proxy',
      proxyPath: '/api/auth',
      persistence: true,
      autoRefresh: true
    });
  });
</script>
```

### Using the Auth Store

```svelte
<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  import { authStore } from 'sveltefireauth/client';

  let email = '';
  let password = '';

  async function handleLogin() {
    try {
      await authStore.signIn(email, password);
      // Redirect on success
    } catch (error) {
      console.error('Login failed:', error);
    }
  }
</script>

{#if $authStore.loading}
  <p>Loading...</p>
{:else if $authStore.isAuthenticated}
  <p>Welcome, {$authStore.user?.email}!</p>
  <button on:click={() => authStore.signOut()}>Sign Out</button>
{:else}
  <form on:submit|preventDefault={handleLogin}>
    <input type="email" bind:value={email} placeholder="Email" />
    <input type="password" bind:value={password} placeholder="Password" />
    <button type="submit">Login</button>
  </form>
{/if}

{#if $authStore.error}
  <p class="error">{$authStore.error.message}</p>
{/if}
```

## Documentation

For detailed documentation, see:
- [Development Plan](./docs/development-plan.md)
- [API Design](./docs/api-design.md)
- [TODO](./docs/TODO.md)

## API Reference

### Server-Side

#### `createAuthHandle(config)`

Creates a SvelteKit handle for authentication.

**Config Options:**
- `firebaseApiKey` (required): Your Firebase API key
- `apiPath` (optional): API path prefix (default: `/api/auth`)
- `enableCallback` (optional): Enable callback handling (default: `true`)
- `callbackPath` (optional): Callback path (default: `__/auth/action`)
- `responseTransformer` (optional): Custom response transformer

#### Route Handlers

For manual integration:
- `handleSignUp(config)` - User registration
- `handleSignIn(config)` - User login
- `handleRefreshToken(config)` - Token refresh
- `handleGetUser(config)` - Get user info
- `handleUpdateUser(config)` - Update profile
- `handleDeleteUser(config)` - Delete account
- `handlePasswordReset(config)` - Password reset
- `handleVerifyEmail(config)` - Email verification

### Client-Side

#### `initAuth(config)`

Initialize the auth store.

**Config Options:**
- `mode` (required): `'direct'` or `'proxy'`
- `apiKey` (optional): Firebase API key (required for direct mode)
- `proxyPath` (optional): Proxy path (default: `/api/auth`)
- `persistence` (optional): Enable localStorage (default: `false`)
- `autoRefresh` (optional): Auto refresh tokens (default: `false`)

#### `authStore`

Svelte store for authentication state.

**State:**
- `user`: Current user object
- `loading`: Loading state
- `error`: Error object
- `isAuthenticated`: Authentication status

**Methods:**
- `signUp(email, password)` - Register new user
- `signIn(email, password)` - Sign in user
- `signOut()` - Sign out user
- `updateProfile(data)` - Update user profile
- `sendPasswordResetEmail(email)` - Send password reset
- `deleteAccount()` - Delete user account
- `getIdToken()` - Get current ID token

## Examples

### Manual Route Integration

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
    }
  })
});
```

### Route Protection

```typescript
// src/hooks.server.ts
import { createAuthGuard } from 'sveltefireauth/server';

export const handle = createAuthGuard({
  protectedRoutes: ['/dashboard', '/profile'],
  redirectTo: '/login',
  verify: async (event) => {
    const token = event.cookies.get('token');
    return !!token;
  }
});
```

### Direct Firebase API Mode

```typescript
import { FirebaseAuthClient } from 'sveltefireauth/client';

const client = new FirebaseAuthClient({
  apiKey: 'YOUR_FIREBASE_API_KEY',
  mode: 'direct'
});

const result = await client.signIn({
  email: 'user@example.com',
  password: 'password123'
});
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build library
npm run build

# Run type checking
npm run check
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines first.
