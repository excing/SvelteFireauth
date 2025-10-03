/**
 * Auth Store for Svelte
 */

import { writable, derived, get } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import type { AuthState, AuthStoreConfig, SignUpCredentials, SignInCredentials, UpdateProfileData, StoredTokenData } from './types.js';
import type { User, AuthError } from '../shared/types.js';
import { FirebaseAuthClient } from './auth-client.js';
import { STORAGE_KEYS, DEFAULT_REFRESH_INTERVAL } from '../shared/constants.js';
import { calculateExpiresAt, willTokenExpireSoon, safeJsonParse, safeJsonStringify } from '../shared/utils.js';

/**
 * Auth store state
 */
const initialState: AuthState = {
	user: null,
	loading: false,
	error: null,
	isAuthenticated: false
};

/**
 * Create auth store
 */
function createAuthStore() {
	const state = writable<AuthState>(initialState);
	let client: FirebaseAuthClient | null = null;
	let config: AuthStoreConfig | null = null;
	let refreshInterval: ReturnType<typeof setInterval> | null = null;
	let currentIdToken: string | null = null;
	let currentRefreshToken: string | null = null;
	let expiresAt: number | null = null;

	/**
	 * Initialize the auth store
	 */
	function init(storeConfig: AuthStoreConfig) {
		config = storeConfig;
		client = new FirebaseAuthClient(storeConfig);

		// Load persisted auth state
		if (storeConfig.persistence && typeof window !== 'undefined') {
			loadPersistedState();
		}

		// Setup auto refresh
		if (storeConfig.autoRefresh) {
			setupAutoRefresh();
		}

		// Cleanup on page unload
		if (typeof window !== 'undefined') {
			const cleanup = () => {
				if (refreshInterval) {
					clearInterval(refreshInterval);
				}
			};
			window.addEventListener('beforeunload', cleanup);
		}
	}

	/**
	 * Load persisted state from localStorage
	 */
	function loadPersistedState() {
		if (typeof window === 'undefined') return;

		try {
			const storedData = localStorage.getItem(STORAGE_KEYS.USER);
			const storedIdToken = localStorage.getItem(STORAGE_KEYS.ID_TOKEN);
			const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
			const storedExpiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);

			if (storedData && storedIdToken && storedRefreshToken && storedExpiresAt) {
				const user = safeJsonParse<User | null>(storedData, null);
				if (!user) return;

				currentIdToken = storedIdToken;
				currentRefreshToken = storedRefreshToken;
				expiresAt = parseInt(storedExpiresAt, 10);

				state.set({
					user,
					loading: false,
					error: null,
					isAuthenticated: true
				});

				// Check if token needs refresh
				if (willTokenExpireSoon(expiresAt)) {
					refreshTokens();
				}
			}
		} catch (error) {
			console.error('Failed to load persisted auth state:', error);
			clearPersistedState();
		}
	}

	/**
	 * Persist state to localStorage
	 */
	function persistState(user: User, idToken: string, refreshToken: string, expiresAtTime: number) {
		if (typeof window === 'undefined' || !config?.persistence) return;

		try {
			localStorage.setItem(STORAGE_KEYS.USER, safeJsonStringify(user));
			localStorage.setItem(STORAGE_KEYS.ID_TOKEN, idToken);
			localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
			localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, expiresAtTime.toString());
		} catch (error) {
			console.error('Failed to persist auth state:', error);
		}
	}

	/**
	 * Clear persisted state
	 */
	function clearPersistedState() {
		if (typeof window === 'undefined') return;

		try {
			localStorage.removeItem(STORAGE_KEYS.USER);
			localStorage.removeItem(STORAGE_KEYS.ID_TOKEN);
			localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
			localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
		} catch (error) {
			console.error('Failed to clear persisted auth state:', error);
		}
	}

	/**
	 * Setup auto token refresh
	 */
	function setupAutoRefresh() {
		if (refreshInterval) {
			clearInterval(refreshInterval);
		}

		const interval = config?.refreshInterval || DEFAULT_REFRESH_INTERVAL;
		refreshInterval = setInterval(() => {
			if (expiresAt && willTokenExpireSoon(expiresAt)) {
				refreshTokens();
			}
		}, interval);
	}

	/**
	 * Refresh tokens
	 */
	async function refreshTokens() {
		if (!client || !currentRefreshToken) return;

		try {
			const response = await client.refreshToken(currentRefreshToken);
			currentIdToken = response.id_token;
			currentRefreshToken = response.refresh_token;
			expiresAt = calculateExpiresAt(response.expires_in);

			const currentState = get(state);
			if (currentState.user) {
				persistState(currentState.user, currentIdToken, currentRefreshToken, expiresAt);
			}
		} catch (error) {
			console.error('Failed to refresh token:', error);
			// If refresh fails, sign out
			await signOut();
		}
	}

	/**
	 * Sign up
	 */
	async function signUp(email: string, password: string) {
		if (!client) throw new Error('Auth store not initialized');

		state.update(s => ({ ...s, loading: true, error: null }));

		try {
			const response = await client.signUp({ email, password });
			
			currentIdToken = response.idToken;
			currentRefreshToken = response.refreshToken;
			expiresAt = calculateExpiresAt(response.expiresIn);

			const user: User = {
				localId: response.localId,
				email: response.email,
				emailVerified: false
			};

			persistState(user, currentIdToken, currentRefreshToken, expiresAt);

			state.set({
				user,
				loading: false,
				error: null,
				isAuthenticated: true
			});

			return response;
		} catch (error) {
			const authError = error as AuthError;
			state.update(s => ({ ...s, loading: false, error: authError }));
			throw error;
		}
	}

	/**
	 * Sign in
	 */
	async function signIn(email: string, password: string) {
		if (!client) throw new Error('Auth store not initialized');

		state.update(s => ({ ...s, loading: true, error: null }));

		try {
			const response = await client.signIn({ email, password });
			
			currentIdToken = response.idToken;
			currentRefreshToken = response.refreshToken;
			expiresAt = calculateExpiresAt(response.expiresIn);

			const user: User = {
				localId: response.localId,
				email: response.email,
				emailVerified: false,
				displayName: response.displayName,
				photoUrl: response.photoUrl
			};

			persistState(user, currentIdToken, currentRefreshToken, expiresAt);

			state.set({
				user,
				loading: false,
				error: null,
				isAuthenticated: true
			});

			return response;
		} catch (error) {
			const authError = error as AuthError;
			state.update(s => ({ ...s, loading: false, error: authError }));
			throw error;
		}
	}

	/**
	 * Sign out
	 */
	async function signOut() {
		currentIdToken = null;
		currentRefreshToken = null;
		expiresAt = null;
		clearPersistedState();

		state.set(initialState);
	}

	/**
	 * Update profile
	 */
	async function updateProfile(data: UpdateProfileData) {
		if (!client || !currentIdToken) throw new Error('Not authenticated');

		state.update(s => ({ ...s, loading: true, error: null }));

		try {
			const response = await client.updateProfile(data, currentIdToken);

			const currentState = get(state);
			const updatedUser: User = {
				...currentState.user!,
				displayName: response.displayName,
				photoUrl: response.photoUrl
			};

			if (response.idToken) {
				currentIdToken = response.idToken;
			}
			if (response.refreshToken) {
				currentRefreshToken = response.refreshToken;
			}
			if (response.expiresIn) {
				expiresAt = calculateExpiresAt(response.expiresIn);
			}

			if (currentIdToken && currentRefreshToken && expiresAt) {
				persistState(updatedUser, currentIdToken, currentRefreshToken, expiresAt);
			}

			state.update(s => ({ ...s, user: updatedUser, loading: false }));

			return response;
		} catch (error) {
			const authError = error as AuthError;
			state.update(s => ({ ...s, loading: false, error: authError }));
			throw error;
		}
	}

	/**
	 * Send password reset email
	 */
	async function sendPasswordResetEmail(email: string) {
		if (!client) throw new Error('Auth store not initialized');

		state.update(s => ({ ...s, loading: true, error: null }));

		try {
			const response = await client.sendPasswordResetEmail(email);
			state.update(s => ({ ...s, loading: false }));
			return response;
		} catch (error) {
			const authError = error as AuthError;
			state.update(s => ({ ...s, loading: false, error: authError }));
			throw error;
		}
	}

	/**
	 * Delete account
	 */
	async function deleteAccount() {
		if (!client || !currentIdToken) throw new Error('Not authenticated');

		state.update(s => ({ ...s, loading: true, error: null }));

		try {
			await client.deleteAccount(currentIdToken);
			await signOut();
		} catch (error) {
			const authError = error as AuthError;
			state.update(s => ({ ...s, loading: false, error: authError }));
			throw error;
		}
	}

	/**
	 * Get current ID token
	 */
	function getIdToken(): string | null {
		return currentIdToken;
	}

	return {
		subscribe: state.subscribe,
		init,
		signUp,
		signIn,
		signOut,
		updateProfile,
		sendPasswordResetEmail,
		deleteAccount,
		getIdToken
	};
}

/**
 * Global auth store instance
 */
export const authStore = createAuthStore();

/**
 * Initialize auth store
 */
export function initAuth(config: AuthStoreConfig) {
	authStore.init(config);
}

