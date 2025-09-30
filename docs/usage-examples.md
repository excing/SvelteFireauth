# SvelteFireauth Usage Examples

## Table of Contents

1. [Basic Setup](#basic-setup)
2. [Server-Side Integration](#server-side-integration)
3. [Client-Side Integration](#client-side-integration)
4. [Authentication Examples](#authentication-examples)
5. [Route Protection](#route-protection)
6. [Advanced Usage](#advanced-usage)

## Basic Setup

### 1. Install the Package

```bash
npm install sveltefireauth
```

### 2. Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Go to Project Settings > General
4. Copy your Web API Key

## Server-Side Integration

### Option 1: One-Click Setup (Recommended)

Create or update `src/hooks.server.ts`:

```typescript
import { createAuthHandle } from 'sveltefireauth/server';

export const handle = createAuthHandle({
  firebaseApiKey: process.env.FIREBASE_API_KEY!,
  apiPath: '/api/auth', // optional, default: '/api/auth'
  enableCallback: true, // optional, default: true
  callbackPath: '__/auth/action' // optional, default: '__/auth/action'
});
```

Create `.env` file:

```env
FIREBASE_API_KEY=your_firebase_api_key_here
```

### Option 2: Manual Route Setup

Create individual route handlers for more control:

#### Sign Up Route

```typescript
// src/routes/api/auth/signup/+server.ts
import { handleSignUp } from 'sveltefireauth/server';

export const POST = handleSignUp({
  firebaseApiKey: process.env.FIREBASE_API_KEY!
});
```

#### Sign In Route

```typescript
// src/routes/api/auth/signin/+server.ts
import { handleSignIn } from 'sveltefireauth/server';

export const POST = handleSignIn({
  firebaseApiKey: process.env.FIREBASE_API_KEY!
});
```

#### Refresh Token Route

```typescript
// src/routes/api/auth/refresh/+server.ts
import { handleRefreshToken } from 'sveltefireauth/server';

export const POST = handleRefreshToken({
  firebaseApiKey: process.env.FIREBASE_API_KEY!
});
```

#### Get User Route

```typescript
// src/routes/api/auth/user/+server.ts
import { handleGetUser } from 'sveltefireauth/server';

export const GET = handleGetUser({
  firebaseApiKey: process.env.FIREBASE_API_KEY!
});
```

## Client-Side Integration

### Initialize Auth Store

Create a layout component to initialize the auth store:

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { initAuth } from 'sveltefireauth/client';
  import { onMount } from 'svelte';

  onMount(() => {
    initAuth({
      mode: 'proxy', // Use proxy mode to call your backend
      proxyPath: '/api/auth',
      persistence: true, // Enable localStorage persistence
      autoRefresh: true // Auto refresh tokens
    });
  });
</script>

<slot />
```

### Direct Firebase API Mode (Alternative)

If you want to call Firebase API directly from the client:

```typescript
import { initAuth } from 'sveltefireauth/client';

initAuth({
  mode: 'direct',
  apiKey: 'your_firebase_api_key',
  persistence: true,
  autoRefresh: true
});
```

## Authentication Examples

### Sign Up Page

```svelte
<!-- src/routes/signup/+page.svelte -->
<script lang="ts">
  import { authStore } from 'sveltefireauth/client';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';
  let confirmPassword = '';

  async function handleSignUp() {
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      await authStore.signUp(email, password);
      goto('/dashboard');
    } catch (error) {
      console.error('Sign up failed:', error);
    }
  }
</script>

<div class="container">
  <h1>Sign Up</h1>
  
  <form on:submit|preventDefault={handleSignUp}>
    <div>
      <label for="email">Email</label>
      <input
        id="email"
        type="email"
        bind:value={email}
        required
      />
    </div>

    <div>
      <label for="password">Password</label>
      <input
        id="password"
        type="password"
        bind:value={password}
        required
        minlength="6"
      />
    </div>

    <div>
      <label for="confirm">Confirm Password</label>
      <input
        id="confirm"
        type="password"
        bind:value={confirmPassword}
        required
      />
    </div>

    <button type="submit" disabled={$authStore.loading}>
      {$authStore.loading ? 'Signing up...' : 'Sign Up'}
    </button>
  </form>

  {#if $authStore.error}
    <p class="error">{$authStore.error.message}</p>
  {/if}

  <p>
    Already have an account? <a href="/login">Sign in</a>
  </p>
</div>
```

### Login Page

```svelte
<!-- src/routes/login/+page.svelte -->
<script lang="ts">
  import { authStore } from 'sveltefireauth/client';
  import { goto } from '$app/navigation';

  let email = '';
  let password = '';

  async function handleLogin() {
    try {
      await authStore.signIn(email, password);
      goto('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  async function handlePasswordReset() {
    if (!email) {
      alert('Please enter your email address');
      return;
    }

    try {
      await authStore.sendPasswordResetEmail(email);
      alert('Password reset email sent!');
    } catch (error) {
      console.error('Password reset failed:', error);
    }
  }
</script>

<div class="container">
  <h1>Login</h1>
  
  <form on:submit|preventDefault={handleLogin}>
    <div>
      <label for="email">Email</label>
      <input
        id="email"
        type="email"
        bind:value={email}
        required
      />
    </div>

    <div>
      <label for="password">Password</label>
      <input
        id="password"
        type="password"
        bind:value={password}
        required
      />
    </div>

    <button type="submit" disabled={$authStore.loading}>
      {$authStore.loading ? 'Logging in...' : 'Login'}
    </button>
  </form>

  {#if $authStore.error}
    <p class="error">{$authStore.error.message}</p>
  {/if}

  <p>
    <button type="button" on:click={handlePasswordReset}>
      Forgot password?
    </button>
  </p>

  <p>
    Don't have an account? <a href="/signup">Sign up</a>
  </p>
</div>
```

### User Profile Page

```svelte
<!-- src/routes/profile/+page.svelte -->
<script lang="ts">
  import { authStore } from 'sveltefireauth/client';
  import { goto } from '$app/navigation';

  let displayName = $authStore.user?.displayName || '';
  let photoUrl = $authStore.user?.photoUrl || '';

  async function handleUpdateProfile() {
    try {
      await authStore.updateProfile({
        displayName,
        photoUrl
      });
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Update failed:', error);
    }
  }

  async function handleSignOut() {
    await authStore.signOut();
    goto('/login');
  }

  async function handleDeleteAccount() {
    if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
      try {
        await authStore.deleteAccount();
        goto('/');
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  }
</script>

{#if $authStore.isAuthenticated && $authStore.user}
  <div class="container">
    <h1>Profile</h1>

    <div class="user-info">
      <p><strong>Email:</strong> {$authStore.user.email}</p>
      <p><strong>Email Verified:</strong> {$authStore.user.emailVerified ? 'Yes' : 'No'}</p>
      <p><strong>User ID:</strong> {$authStore.user.localId}</p>
    </div>

    <form on:submit|preventDefault={handleUpdateProfile}>
      <div>
        <label for="displayName">Display Name</label>
        <input
          id="displayName"
          type="text"
          bind:value={displayName}
        />
      </div>

      <div>
        <label for="photoUrl">Photo URL</label>
        <input
          id="photoUrl"
          type="url"
          bind:value={photoUrl}
        />
      </div>

      <button type="submit" disabled={$authStore.loading}>
        Update Profile
      </button>
    </form>

    <div class="actions">
      <button on:click={handleSignOut}>Sign Out</button>
      <button on:click={handleDeleteAccount} class="danger">
        Delete Account
      </button>
    </div>
  </div>
{:else}
  <p>Please <a href="/login">log in</a> to view your profile.</p>
{/if}
```

## Route Protection

### Protect Routes with Auth Guard

```typescript
// src/hooks.server.ts
import { createAuthHandle, createAuthGuard } from 'sveltefireauth/server';
import { sequence } from '@sveltejs/kit/hooks';

const authHandle = createAuthHandle({
  firebaseApiKey: process.env.FIREBASE_API_KEY!
});

const authGuard = createAuthGuard({
  protectedRoutes: ['/dashboard', '/profile', '/admin'],
  publicRoutes: ['/login', '/signup', '/'],
  redirectTo: '/login',
  verify: async (event) => {
    // Custom verification logic
    const token = event.cookies.get('auth_token');
    return !!token;
  }
});

export const handle = sequence(authHandle, authGuard);
```

### Client-Side Route Protection

```svelte
<!-- src/routes/dashboard/+page.svelte -->
<script lang="ts">
  import { authStore } from 'sveltefireauth/client';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    if (!$authStore.isAuthenticated) {
      goto('/login');
    }
  });
</script>

{#if $authStore.isAuthenticated}
  <h1>Dashboard</h1>
  <p>Welcome, {$authStore.user?.email}!</p>
{:else}
  <p>Redirecting to login...</p>
{/if}
```

## Advanced Usage

### Custom Response Transformer

```typescript
// src/hooks.server.ts
import { createAuthHandle } from 'sveltefireauth/server';

export const handle = createAuthHandle({
  firebaseApiKey: process.env.FIREBASE_API_KEY!,
  responseTransformer: (data) => {
    // Transform Firebase response to your custom format
    return {
      success: true,
      data: {
        userId: data.localId,
        email: data.email,
        token: data.idToken
      }
    };
  }
});
```

### Using Firebase Auth Client Directly

```typescript
import { FirebaseAuthClient } from 'sveltefireauth/client';

const client = new FirebaseAuthClient({
  mode: 'direct',
  apiKey: 'your_firebase_api_key'
});

// Sign up
const signUpResult = await client.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// Sign in
const signInResult = await client.signIn({
  email: 'user@example.com',
  password: 'password123'
});

// Get user
const user = await client.getUser(signInResult.idToken);

// Update profile
await client.updateProfile(
  { displayName: 'John Doe' },
  signInResult.idToken
);
```

### Access ID Token for API Calls

```typescript
import { authStore } from 'sveltefireauth/client';

async function callProtectedAPI() {
  const idToken = authStore.getIdToken();
  
  if (!idToken) {
    throw new Error('Not authenticated');
  }

  const response = await fetch('/api/protected', {
    headers: {
      'Authorization': `Bearer ${idToken}`
    }
  });

  return response.json();
}
```

