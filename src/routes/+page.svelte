<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore, initAuth } from '$lib/client/index.js';

	let email = '';
	let password = '';
	let displayName = '';
	let mode: 'signin' | 'signup' = 'signin';

	onMount(() => {
		// Initialize auth store in proxy mode
		// Note: This is just for demo. In production, you'd set up the server-side handler
		initAuth({
			mode: 'proxy',
			proxyPath: '/api/auth',
			persistence: true,
			autoRefresh: true
		});
	});

	async function handleSubmit() {
		try {
			if (mode === 'signup') {
				await authStore.signUp(email, password);
			} else {
				await authStore.signIn(email, password);
			}
			email = '';
			password = '';
		} catch (error) {
			console.error('Auth error:', error);
		}
	}

	async function handleSignOut() {
		await authStore.signOut();
	}

	async function handleUpdateProfile() {
		try {
			await authStore.updateProfile({ displayName });
			displayName = '';
		} catch (error) {
			console.error('Update error:', error);
		}
	}
</script>

<div class="container">
	<h1>SvelteFireauth Demo</h1>
	<p class="subtitle">Firebase Authentication for SvelteKit</p>

	{#if $authStore.loading}
		<div class="loading">Loading...</div>
	{:else if $authStore.isAuthenticated && $authStore.user}
		<div class="user-info">
			<h2>Welcome!</h2>
			<p><strong>Email:</strong> {$authStore.user.email}</p>
			<p><strong>User ID:</strong> {$authStore.user.localId}</p>
			{#if $authStore.user.displayName}
				<p><strong>Display Name:</strong> {$authStore.user.displayName}</p>
			{/if}
			<p><strong>Email Verified:</strong> {$authStore.user.emailVerified ? 'Yes' : 'No'}</p>

			<div class="form-group">
				<h3>Update Profile</h3>
				<input
					type="text"
					bind:value={displayName}
					placeholder="Display Name"
					class="input"
				/>
				<button on:click={handleUpdateProfile} class="button">Update Profile</button>
			</div>

			<button on:click={handleSignOut} class="button button-secondary">Sign Out</button>
		</div>
	{:else}
		<div class="auth-form">
			<div class="tabs">
				<button
					class="tab"
					class:active={mode === 'signin'}
					on:click={() => (mode = 'signin')}
				>
					Sign In
				</button>
				<button
					class="tab"
					class:active={mode === 'signup'}
					on:click={() => (mode = 'signup')}
				>
					Sign Up
				</button>
			</div>

			<form on:submit|preventDefault={handleSubmit}>
				<div class="form-group">
					<input
						type="email"
						bind:value={email}
						placeholder="Email"
						required
						class="input"
					/>
				</div>
				<div class="form-group">
					<input
						type="password"
						bind:value={password}
						placeholder="Password"
						required
						class="input"
					/>
				</div>
				<button type="submit" class="button">
					{mode === 'signup' ? 'Sign Up' : 'Sign In'}
				</button>
			</form>
		</div>
	{/if}

	{#if $authStore.error}
		<div class="error">
			<strong>Error:</strong> {$authStore.error.message}
		</div>
	{/if}

	<div class="info">
		<h3>About SvelteFireauth</h3>
		<p>
			This is a demo page for the SvelteFireauth library. To use this library in your project:
		</p>
		<ol>
			<li>Install: <code>npm install sveltefireauth</code></li>
			<li>Set up server-side handler in <code>hooks.server.ts</code></li>
			<li>Initialize client-side store with your Firebase config</li>
			<li>Use the auth store in your components</li>
		</ol>
		<p>
			<strong>Note:</strong> This demo requires a Firebase project with Email/Password
			authentication enabled and the server-side handler configured.
		</p>
	</div>
</div>

<style>
	.container {
		max-width: 600px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, -apple-system, sans-serif;
	}

	h1 {
		color: #ff3e00;
		text-align: center;
		margin-bottom: 0.5rem;
	}

	.subtitle {
		text-align: center;
		color: #666;
		margin-bottom: 2rem;
	}

	.loading {
		text-align: center;
		padding: 2rem;
		color: #666;
	}

	.user-info {
		background: #f5f5f5;
		padding: 2rem;
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.user-info h2 {
		margin-top: 0;
		color: #333;
	}

	.user-info p {
		margin: 0.5rem 0;
		color: #666;
	}

	.auth-form {
		background: #f5f5f5;
		padding: 2rem;
		border-radius: 8px;
		margin-bottom: 1rem;
	}

	.tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}

	.tab {
		flex: 1;
		padding: 0.75rem;
		border: none;
		background: #e0e0e0;
		cursor: pointer;
		border-radius: 4px;
		font-size: 1rem;
		transition: background 0.2s;
	}

	.tab:hover {
		background: #d0d0d0;
	}

	.tab.active {
		background: #ff3e00;
		color: white;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group h3 {
		margin-top: 1.5rem;
		margin-bottom: 0.5rem;
		color: #333;
	}

	.input {
		width: 100%;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		box-sizing: border-box;
	}

	.input:focus {
		outline: none;
		border-color: #ff3e00;
	}

	.button {
		width: 100%;
		padding: 0.75rem;
		border: none;
		background: #ff3e00;
		color: white;
		border-radius: 4px;
		font-size: 1rem;
		cursor: pointer;
		transition: background 0.2s;
	}

	.button:hover {
		background: #e63900;
	}

	.button-secondary {
		background: #666;
		margin-top: 1rem;
	}

	.button-secondary:hover {
		background: #555;
	}

	.error {
		background: #fee;
		border: 1px solid #fcc;
		color: #c33;
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1rem;
	}

	.info {
		background: #e8f4f8;
		padding: 1.5rem;
		border-radius: 8px;
		margin-top: 2rem;
	}

	.info h3 {
		margin-top: 0;
		color: #0066cc;
	}

	.info p {
		color: #333;
		line-height: 1.6;
	}

	.info ol {
		color: #333;
		line-height: 1.8;
	}

	.info code {
		background: #fff;
		padding: 0.2rem 0.4rem;
		border-radius: 3px;
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
	}
</style>
