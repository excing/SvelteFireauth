/**
 * Client-side types
 */

import type { User, AuthError, AuthMode } from '../shared/types.js';

/**
 * Auth client configuration
 */
export interface AuthClientConfig {
	apiKey?: string;
	mode: AuthMode;
	proxyPath?: string;
}

/**
 * Auth store configuration
 */
export interface AuthStoreConfig extends AuthClientConfig {
	persistence?: boolean;
	autoRefresh?: boolean;
	refreshInterval?: number;
}

/**
 * Auth state
 */
export interface AuthState {
	user: User | null;
	loading: boolean;
	error: AuthError | null;
	isAuthenticated: boolean;
}

/**
 * Sign up credentials
 */
export interface SignUpCredentials {
	email: string;
	password: string;
}

/**
 * Sign in credentials
 */
export interface SignInCredentials {
	email: string;
	password: string;
}

/**
 * Update profile data
 */
export interface UpdateProfileData {
	displayName?: string;
	photoUrl?: string;
}

/**
 * Token data stored in localStorage
 */
export interface StoredTokenData {
	idToken: string;
	refreshToken: string;
	expiresAt: number;
	user: User;
}

