/**
 * Server-side types
 */

import type { RequestEvent } from '@sveltejs/kit';
import type { ResponseTransformer } from '../shared/types.js';

/**
 * Session configuration
 */
export interface SessionConfig {
	cookieName?: string;
	maxAge?: number;
	secure?: boolean;
	httpOnly?: boolean;
	sameSite?: 'strict' | 'lax' | 'none';
	path?: string;
}

/**
 * Auth handle configuration
 */
export interface AuthHandleConfig {
	firebaseApiKey: string;
	apiPath?: string;
	enableCallback?: boolean;
	callbackPath?: string;
	enableSession?: boolean;
	sessionConfig?: SessionConfig;
	responseTransformer?: ResponseTransformer;
}

/**
 * Route handler configuration
 */
export interface RouteHandlerConfig {
	firebaseApiKey: string;
	enableSession?: boolean;
	sessionConfig?: SessionConfig;
	responseTransformer?: ResponseTransformer;
}

/**
 * Auth guard configuration
 */
export interface AuthGuardConfig {
	protectedRoutes?: string[];
	publicRoutes?: string[];
	redirectTo?: string;
	verify?: (event: RequestEvent) => Promise<boolean> | boolean;
}

/**
 * Session data
 */
export interface SessionData {
	userId: string;
	email: string;
	idToken: string;
	refreshToken: string;
	expiresAt: number;
}

/**
 * Auth callback query parameters
 */
export interface AuthCallbackParams {
	mode?: string;
	oobCode?: string;
	apiKey?: string;
	continueUrl?: string;
	lang?: string;
}

