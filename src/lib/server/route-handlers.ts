/**
 * SvelteKit route handlers for Firebase Auth
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import type { RouteHandlerConfig } from './types.js';
import * as authHandler from './auth-handler.js';
import { parseFirebaseError } from '../shared/utils.js';

/**
 * Create a sign up handler
 */
export function handleSignUp(config: RouteHandlerConfig): RequestHandler {
	return async ({ request }) => {
		try {
			const { email, password } = await request.json();

			if (!email || !password) {
				return json(
					{ error: { code: 'INVALID_REQUEST', message: 'Email and password are required' } },
					{ status: 400 }
				);
			}

			const result = await authHandler.signUp(config.firebaseApiKey, email, password);

			const responseData = config.responseTransformer ? config.responseTransformer(result) : result;

			return json(responseData);
		} catch (error) {
			const authError = parseFirebaseError(error);
			return json({ error: authError }, { status: 400 });
		}
	};
}

/**
 * Create a sign in handler
 */
export function handleSignIn(config: RouteHandlerConfig): RequestHandler {
	return async ({ request }) => {
		try {
			const { email, password } = await request.json();

			if (!email || !password) {
				return json(
					{ error: { code: 'INVALID_REQUEST', message: 'Email and password are required' } },
					{ status: 400 }
				);
			}

			const result = await authHandler.signIn(config.firebaseApiKey, email, password);

			const responseData = config.responseTransformer ? config.responseTransformer(result) : result;

			return json(responseData);
		} catch (error) {
			const authError = parseFirebaseError(error);
			return json({ error: authError }, { status: 400 });
		}
	};
}

/**
 * Create a sign out handler
 */
export function handleSignOut(config: RouteHandlerConfig): RequestHandler {
	return async () => {
		// Sign out is typically handled client-side by clearing tokens
		// This endpoint can be used for session cleanup if sessions are enabled
		return json({ success: true });
	};
}

/**
 * Create a refresh token handler
 */
export function handleRefreshToken(config: RouteHandlerConfig): RequestHandler {
	return async ({ request }) => {
		try {
			const { refreshToken } = await request.json();

			if (!refreshToken) {
				return json(
					{ error: { code: 'INVALID_REQUEST', message: 'Refresh token is required' } },
					{ status: 400 }
				);
			}

			const result = await authHandler.refreshToken(config.firebaseApiKey, refreshToken);

			const responseData = config.responseTransformer ? config.responseTransformer(result) : result;

			return json(responseData);
		} catch (error) {
			const authError = parseFirebaseError(error);
			return json({ error: authError }, { status: 400 });
		}
	};
}

/**
 * Create a get user handler
 */
export function handleGetUser(config: RouteHandlerConfig): RequestHandler {
	return async ({ request }) => {
		try {
			const authHeader = request.headers.get('Authorization');
			const idToken = authHeader?.replace('Bearer ', '');

			if (!idToken) {
				return json(
					{ error: { code: 'INVALID_REQUEST', message: 'Authorization token is required' } },
					{ status: 401 }
				);
			}

			const result = await authHandler.getUser(config.firebaseApiKey, idToken);

			const responseData = config.responseTransformer ? config.responseTransformer(result) : result;

			return json(responseData);
		} catch (error) {
			const authError = parseFirebaseError(error);
			return json({ error: authError }, { status: 400 });
		}
	};
}

/**
 * Create an update user handler
 */
export function handleUpdateUser(config: RouteHandlerConfig): RequestHandler {
	return async ({ request }) => {
		try {
			const authHeader = request.headers.get('Authorization');
			const idToken = authHeader?.replace('Bearer ', '');

			if (!idToken) {
				return json(
					{ error: { code: 'INVALID_REQUEST', message: 'Authorization token is required' } },
					{ status: 401 }
				);
			}

			const { displayName, photoUrl } = await request.json();

			const result = await authHandler.updateProfile(
				config.firebaseApiKey,
				idToken,
				displayName,
				photoUrl
			);

			const responseData = config.responseTransformer ? config.responseTransformer(result) : result;

			return json(responseData);
		} catch (error) {
			const authError = parseFirebaseError(error);
			return json({ error: authError }, { status: 400 });
		}
	};
}

/**
 * Create a delete user handler
 */
export function handleDeleteUser(config: RouteHandlerConfig): RequestHandler {
	return async ({ request }) => {
		try {
			const authHeader = request.headers.get('Authorization');
			const idToken = authHeader?.replace('Bearer ', '');

			if (!idToken) {
				return json(
					{ error: { code: 'INVALID_REQUEST', message: 'Authorization token is required' } },
					{ status: 401 }
				);
			}

			await authHandler.deleteAccount(config.firebaseApiKey, idToken);

			return json({ success: true });
		} catch (error) {
			const authError = parseFirebaseError(error);
			return json({ error: authError }, { status: 400 });
		}
	};
}

/**
 * Create a password reset handler
 */
export function handlePasswordReset(config: RouteHandlerConfig): RequestHandler {
	return async ({ request }) => {
		try {
			const { email } = await request.json();

			if (!email) {
				return json(
					{ error: { code: 'INVALID_REQUEST', message: 'Email is required' } },
					{ status: 400 }
				);
			}

			const result = await authHandler.sendPasswordResetEmail(config.firebaseApiKey, email);

			const responseData = config.responseTransformer ? config.responseTransformer(result) : result;

			return json(responseData);
		} catch (error) {
			const authError = parseFirebaseError(error);
			return json({ error: authError }, { status: 400 });
		}
	};
}

/**
 * Create a password confirm handler
 */
export function handlePasswordConfirm(config: RouteHandlerConfig): RequestHandler {
	return async ({ request }) => {
		try {
			const { oobCode, newPassword } = await request.json();

			if (!oobCode || !newPassword) {
				return json(
					{ error: { code: 'INVALID_REQUEST', message: 'OOB code and new password are required' } },
					{ status: 400 }
				);
			}

			const result = await authHandler.confirmPasswordReset(
				config.firebaseApiKey,
				oobCode,
				newPassword
			);

			const responseData = config.responseTransformer ? config.responseTransformer(result) : result;

			return json(responseData);
		} catch (error) {
			const authError = parseFirebaseError(error);
			return json({ error: authError }, { status: 400 });
		}
	};
}

/**
 * Create an email verification handler
 */
export function handleVerifyEmail(config: RouteHandlerConfig): RequestHandler {
	return async ({ request }) => {
		try {
			const authHeader = request.headers.get('Authorization');
			const idToken = authHeader?.replace('Bearer ', '');

			if (!idToken) {
				return json(
					{ error: { code: 'INVALID_REQUEST', message: 'Authorization token is required' } },
					{ status: 401 }
				);
			}

			const result = await authHandler.sendEmailVerification(config.firebaseApiKey, idToken);

			const responseData = config.responseTransformer ? config.responseTransformer(result) : result;

			return json(responseData);
		} catch (error) {
			const authError = parseFirebaseError(error);
			return json({ error: authError }, { status: 400 });
		}
	};
}

/**
 * Create an email verification confirm handler
 */
export function handleVerifyEmailConfirm(config: RouteHandlerConfig): RequestHandler {
	return async ({ request }) => {
		try {
			const { oobCode } = await request.json();

			if (!oobCode) {
				return json(
					{ error: { code: 'INVALID_REQUEST', message: 'OOB code is required' } },
					{ status: 400 }
				);
			}

			const result = await authHandler.confirmEmailVerification(config.firebaseApiKey, oobCode);

			const responseData = config.responseTransformer ? config.responseTransformer(result) : result;

			return json(responseData);
		} catch (error) {
			const authError = parseFirebaseError(error);
			return json({ error: authError }, { status: 400 });
		}
	};
}

