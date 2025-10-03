/**
 * SvelteKit route handlers for Firebase Auth
 */

import { json, type RequestHandler, type RequestEvent } from '@sveltejs/kit';
import type { RouteHandlerConfig } from './types.js';
import * as authHandler from './auth-handler.js';
import { parseFirebaseError } from '../shared/utils.js';

type RequestParams = Record<string, any>;

type AuthHandler = (apiKey: string, ...args: any[]) => Promise<any>;

interface RequestHandlerOptions {
	handler: AuthHandler;
	body?: (keyof RequestParams)[];
	token?: boolean;
	params?: (keyof RequestParams)[];
}

function createRequestHandler(
	config: RouteHandlerConfig,
	options: RequestHandlerOptions
): RequestHandler {
	return async ({ request }: RequestEvent) => {
		try {
			const params: RequestParams = {};

			if (options.body) {
				const body = await request.json();
				for (const key of options.body) {
					if (!(key in body)) {
						return json(
							{ error: { code: 'INVALID_REQUEST', message: `${String(key)} is required` } },
							{ status: 400 }
						);
					}
					params[key] = body[key];
				}
			}

			if (options.token) {
				const authHeader = request.headers.get('Authorization');
				const idToken = authHeader?.replace('Bearer ', '');
				if (!idToken) {
					return json(
						{ error: { code: 'INVALID_REQUEST', message: 'Authorization token is required' } },
						{ status: 401 }
					);
				}
				params['idToken'] = idToken;
			}

			const handlerArgs = (options.params || []).map((key) => params[key]);
			const result = await options.handler(config.firebaseApiKey, ...handlerArgs);

			const responseData = config.responseTransformer ? config.responseTransformer(result) : result;

			return json(responseData);
		} catch (error) {
			const authError = parseFirebaseError(error);
			return json({ error: authError }, { status: 400 });
		}
	};
}

/**
 * Create a sign up handler
 */
export function handleSignUp(config: RouteHandlerConfig): RequestHandler {
	return createRequestHandler(config, {
		handler: authHandler.signUp,
		body: ['email', 'password'],
		params: ['email', 'password']
	});
}

/**
 * Create a sign in handler
 */
export function handleSignIn(config: RouteHandlerConfig): RequestHandler {
	return createRequestHandler(config, {
		handler: authHandler.signIn,
		body: ['email', 'password'],
		params: ['email', 'password']
	});
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
	return createRequestHandler(config, {
		handler: authHandler.refreshToken,
		body: ['refreshToken'],
		params: ['refreshToken']
	});
}

/**
 * Create a get user handler
 */
export function handleGetUser(config: RouteHandlerConfig): RequestHandler {
	return createRequestHandler(config, {
		handler: authHandler.getUser,
		token: true,
		params: ['idToken']
	});
}

/**
 * Create an update user handler
 */
export function handleUpdateUser(config: RouteHandlerConfig): RequestHandler {
	return createRequestHandler(config, {
		handler: authHandler.updateProfile,
		body: ['displayName', 'photoUrl'],
		token: true,
		params: ['idToken', 'displayName', 'photoUrl']
	});
}

/**
 * Create a delete user handler
 */
export function handleDeleteUser(config: RouteHandlerConfig): RequestHandler {
	return createRequestHandler(config, {
		handler: authHandler.deleteAccount,
		token: true,
		params: ['idToken']
	});
}

/**
 * Create a password reset handler
 */
export function handlePasswordReset(config: RouteHandlerConfig): RequestHandler {
	return createRequestHandler(config, {
		handler: authHandler.sendPasswordResetEmail,
		body: ['email'],
		params: ['email']
	});
}

/**
 * Create a password confirm handler
 */
export function handlePasswordConfirm(config: RouteHandlerConfig): RequestHandler {
	return createRequestHandler(config, {
		handler: authHandler.confirmPasswordReset,
		body: ['oobCode', 'newPassword'],
		params: ['oobCode', 'newPassword']
	});
}

/**
 * Create an email verification handler
 */
export function handleVerifyEmail(config: RouteHandlerConfig): RequestHandler {
	return createRequestHandler(config, {
		handler: authHandler.sendEmailVerification,
		token: true,
		params: ['idToken']
	});
}

/**
 * Create an email verification confirm handler
 */
export function handleVerifyEmailConfirm(config: RouteHandlerConfig): RequestHandler {
	return createRequestHandler(config, {
		handler: authHandler.confirmEmailVerification,
		body: ['oobCode'],
		params: ['oobCode']
	});
}

