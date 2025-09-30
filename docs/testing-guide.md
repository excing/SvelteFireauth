# SvelteFireauth Testing Guide

## Overview

This guide provides instructions for testing the SvelteFireauth library both as a developer and as an end user.

## Prerequisites

1. A Firebase project with Email/Password authentication enabled
2. Firebase Web API Key
3. Node.js 18+ installed

## Testing as a Library Developer

### 1. Type Checking

Run TypeScript type checking:

```bash
npm run check
```

Expected output: No errors or warnings

### 2. Build the Library

Build the library package:

```bash
npm run build
```

This will:
- Build the SvelteKit app
- Package the library using `svelte-package`
- Run `publint` to check for packaging issues

Expected output: Build succeeds with no errors

### 3. Verify Package Structure

Check the `dist` folder structure:

```
dist/
├── client/
│   ├── auth-client.d.ts
│   ├── auth-client.js
│   ├── auth-store.d.ts
│   ├── auth-store.js
│   ├── index.d.ts
│   ├── index.js
│   └── types.d.ts
├── server/
│   ├── auth-handler.d.ts
│   ├── auth-handler.js
│   ├── hooks.d.ts
│   ├── hooks.js
│   ├── index.d.ts
│   ├── index.js
│   ├── route-handlers.d.ts
│   ├── route-handlers.js
│   └── types.d.ts
├── shared/
│   ├── constants.d.ts
│   ├── constants.js
│   ├── types.d.ts
│   ├── types.js
│   ├── utils.d.ts
│   └── utils.js
├── index.d.ts
└── index.js
```

### 4. Test the Demo App

Start the development server:

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

**Note**: The demo app requires a working Firebase backend. To test it:

1. Create a `.env` file with your Firebase API key:
   ```
   FIREBASE_API_KEY=your_api_key_here
   ```

2. Create `src/hooks.server.ts`:
   ```typescript
   import { createAuthHandle } from '$lib/server/index.js';

   export const handle = createAuthHandle({
     firebaseApiKey: process.env.FIREBASE_API_KEY!
   });
   ```

3. Restart the dev server and test the authentication flow

## Testing as an End User

### 1. Create a Test Project

```bash
npx sv create my-test-app
cd my-test-app
```

### 2. Install the Library

For local testing, you can link the library:

```bash
# In the sveltefireauth directory
npm link

# In your test project
npm link sveltefireauth
```

Or install from npm (once published):

```bash
npm install sveltefireauth
```

### 3. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Email/Password authentication:
   - Go to Authentication > Sign-in method
   - Enable Email/Password
4. Get your Web API Key:
   - Go to Project Settings > General
   - Copy the Web API Key

### 4. Configure the Server

Create `.env`:

```env
FIREBASE_API_KEY=your_firebase_api_key_here
```

Create `src/hooks.server.ts`:

```typescript
import { createAuthHandle } from 'sveltefireauth/server';

export const handle = createAuthHandle({
  firebaseApiKey: process.env.FIREBASE_API_KEY!
});
```

### 5. Configure the Client

Update `src/routes/+layout.svelte`:

```svelte
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

<slot />
```

### 6. Create Test Pages

#### Login Page (`src/routes/login/+page.svelte`)

```svelte
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
</script>

<h1>Login</h1>
<form on:submit|preventDefault={handleLogin}>
  <input type="email" bind:value={email} placeholder="Email" required />
  <input type="password" bind:value={password} placeholder="Password" required />
  <button type="submit">Login</button>
</form>

{#if $authStore.error}
  <p style="color: red;">{$authStore.error.message}</p>
{/if}
```

#### Dashboard Page (`src/routes/dashboard/+page.svelte`)

```svelte
<script lang="ts">
  import { authStore } from 'sveltefireauth/client';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    if (!$authStore.isAuthenticated) {
      goto('/login');
    }
  });

  async function handleSignOut() {
    await authStore.signOut();
    goto('/login');
  }
</script>

{#if $authStore.isAuthenticated && $authStore.user}
  <h1>Dashboard</h1>
  <p>Welcome, {$authStore.user.email}!</p>
  <button on:click={handleSignOut}>Sign Out</button>
{:else}
  <p>Loading...</p>
{/if}
```

### 7. Run the Test App

```bash
npm run dev
```

## Manual Test Cases

### Test Case 1: User Registration

1. Navigate to the signup page
2. Enter a valid email and password (min 6 characters)
3. Click "Sign Up"
4. **Expected**: User is created and redirected to dashboard
5. **Verify**: User appears in Firebase Console > Authentication

### Test Case 2: User Login

1. Navigate to the login page
2. Enter registered email and password
3. Click "Login"
4. **Expected**: User is authenticated and redirected to dashboard
5. **Verify**: User info is displayed correctly

### Test Case 3: Invalid Login

1. Navigate to the login page
2. Enter incorrect email or password
3. Click "Login"
4. **Expected**: Error message is displayed
5. **Verify**: Error message is user-friendly

### Test Case 4: Token Persistence

1. Log in successfully
2. Refresh the page
3. **Expected**: User remains logged in
4. **Verify**: User info is still displayed

### Test Case 5: Auto Token Refresh

1. Log in successfully
2. Wait for token to expire (or manually set a short expiration)
3. **Expected**: Token is automatically refreshed
4. **Verify**: User remains authenticated

### Test Case 6: Sign Out

1. Log in successfully
2. Click "Sign Out"
3. **Expected**: User is logged out and redirected
4. **Verify**: Attempting to access protected routes redirects to login

### Test Case 7: Update Profile

1. Log in successfully
2. Navigate to profile page
3. Update display name
4. Click "Update Profile"
5. **Expected**: Profile is updated successfully
6. **Verify**: New display name is shown

### Test Case 8: Password Reset

1. Navigate to login page
2. Click "Forgot Password"
3. Enter email address
4. **Expected**: Password reset email is sent
5. **Verify**: Email is received in inbox

### Test Case 9: Route Protection

1. Without logging in, try to access `/dashboard`
2. **Expected**: Redirected to login page
3. Log in
4. **Expected**: Can now access `/dashboard`

### Test Case 10: Delete Account

1. Log in successfully
2. Navigate to profile page
3. Click "Delete Account"
4. Confirm deletion
5. **Expected**: Account is deleted and user is logged out
6. **Verify**: User is removed from Firebase Console

## API Endpoint Testing

You can test the API endpoints directly using curl or Postman:

### Sign Up

```bash
curl -X POST http://localhost:5173/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Sign In

```bash
curl -X POST http://localhost:5173/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Get User

```bash
curl -X GET http://localhost:5173/api/auth/user \
  -H "Authorization: Bearer YOUR_ID_TOKEN"
```

### Refresh Token

```bash
curl -X POST http://localhost:5173/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}'
```

## Common Issues and Solutions

### Issue 1: "API key not valid"

**Solution**: Verify your Firebase API key is correct in the `.env` file

### Issue 2: "Email already exists"

**Solution**: Use a different email or delete the existing user from Firebase Console

### Issue 3: "CORS errors"

**Solution**: Ensure you're using proxy mode, not direct mode, when testing locally

### Issue 4: "Module not found"

**Solution**: Make sure the library is properly installed and the imports are correct

### Issue 5: "Token expired"

**Solution**: Enable auto refresh in the auth store configuration

## Performance Testing

### Load Testing

Test the authentication endpoints with multiple concurrent requests:

```bash
# Install Apache Bench
brew install httpd  # macOS

# Test sign-in endpoint
ab -n 100 -c 10 -p signin.json -T application/json \
  http://localhost:5173/api/auth/signin
```

### Memory Leak Testing

1. Open browser DevTools
2. Go to Memory tab
3. Take a heap snapshot
4. Perform authentication operations
5. Take another heap snapshot
6. Compare snapshots for memory leaks

## Automated Testing (Future)

For production use, consider adding:

1. **Unit Tests**: Test individual functions
2. **Integration Tests**: Test API endpoints
3. **E2E Tests**: Test complete user flows with Playwright
4. **Visual Regression Tests**: Test UI components

Example test structure:

```
tests/
├── unit/
│   ├── utils.test.ts
│   ├── auth-client.test.ts
│   └── auth-store.test.ts
├── integration/
│   ├── auth-api.test.ts
│   └── hooks.test.ts
└── e2e/
    ├── signup.test.ts
    ├── login.test.ts
    └── profile.test.ts
```

## Conclusion

This testing guide covers the essential testing scenarios for SvelteFireauth. For production deployment, implement automated testing and continuous integration to ensure reliability.

