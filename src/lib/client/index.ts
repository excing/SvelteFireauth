/**
 * Client-side exports for SvelteFireauth
 */

// Auth Client
export { FirebaseAuthClient } from './auth-client.js';

// Auth Store
export { authStore, initAuth } from './auth-store.js';

// Types
export type {
	AuthClientConfig,
	AuthStoreConfig,
	AuthState,
	SignUpCredentials,
	SignInCredentials,
	UpdateProfileData,
	StoredTokenData
} from './types.js';

