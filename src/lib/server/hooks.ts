/**
 * SvelteKit hooks integration for Firebase Auth
 */

import { json, type Handle, type RequestEvent } from '@sveltejs/kit';
import type { AuthHandleConfig, AuthGuardConfig } from './types.js';
import * as authHandler from './auth-handler.js';
import { parseFirebaseError } from '../shared/utils.js';
import { DEFAULT_API_PATH, DEFAULT_CALLBACK_PATH, LOCAL_ENDPOINTS } from '../shared/constants.js';
import { matchRoute, matchesAnyRoute } from '../shared/utils.js';

/**
 * Create auth handle for SvelteKit hooks
 */
export function createAuthHandle(config: AuthHandleConfig): Handle {
	const apiPath = config.apiPath || DEFAULT_API_PATH;
	const callbackPath = config.callbackPath || DEFAULT_CALLBACK_PATH;

	return async ({ event, resolve }) => {
		const { pathname } = event.url;

		// Handle auth callback
		if (config.enableCallback !== false && pathname === `/${callbackPath}`) {
			return handleAuthCallback(event, config);
		}

		// Handle auth API routes
		if (pathname.startsWith(apiPath)) {
			return handleAuthApi(event, config, apiPath);
		}

		// Continue with normal request handling
		return resolve(event);
	};
}

/**
 * Handle auth API requests
 */
async function handleAuthApi(
	event: RequestEvent,
	config: AuthHandleConfig,
	apiPath: string
): Promise<Response> {
	const { pathname, searchParams } = event.url;
	const endpoint = pathname.replace(apiPath, '');
	const { request } = event;

	try {
		let result: any;

		switch (endpoint) {
			case LOCAL_ENDPOINTS.SIGN_UP:
				if (request.method !== 'POST') {
					return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }, { status: 405 });
				}
				const signUpData = await request.json();
				result = await authHandler.signUp(
					config.firebaseApiKey,
					signUpData.email,
					signUpData.password
				);
				break;

			case LOCAL_ENDPOINTS.SIGN_IN:
				if (request.method !== 'POST') {
					return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }, { status: 405 });
				}
				const signInData = await request.json();
				result = await authHandler.signIn(
					config.firebaseApiKey,
					signInData.email,
					signInData.password
				);
				break;

			case LOCAL_ENDPOINTS.SIGN_OUT:
				if (request.method !== 'POST') {
					return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }, { status: 405 });
				}
				result = { success: true };
				break;

			case LOCAL_ENDPOINTS.REFRESH_TOKEN:
				if (request.method !== 'POST') {
					return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }, { status: 405 });
				}
				const refreshData = await request.json();
				result = await authHandler.refreshToken(config.firebaseApiKey, refreshData.refreshToken);
				break;

			case LOCAL_ENDPOINTS.GET_USER:
				if (request.method !== 'GET') {
					return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }, { status: 405 });
				}
				const authHeader = request.headers.get('Authorization');
				const idToken = authHeader?.replace('Bearer ', '');
				if (!idToken) {
					return json(
						{ error: { code: 'UNAUTHORIZED', message: 'Authorization token required' } },
						{ status: 401 }
					);
				}
				result = await authHandler.getUser(config.firebaseApiKey, idToken);
				break;

			case LOCAL_ENDPOINTS.UPDATE_USER:
				if (request.method !== 'PUT') {
					return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }, { status: 405 });
				}
				const updateAuthHeader = request.headers.get('Authorization');
				const updateIdToken = updateAuthHeader?.replace('Bearer ', '');
				if (!updateIdToken) {
					return json(
						{ error: { code: 'UNAUTHORIZED', message: 'Authorization token required' } },
						{ status: 401 }
					);
				}
				const updateData = await request.json();
				result = await authHandler.updateProfile(
					config.firebaseApiKey,
					updateIdToken,
					updateData.displayName,
					updateData.photoUrl
				);
				break;

			case LOCAL_ENDPOINTS.DELETE_USER:
				if (request.method !== 'DELETE') {
					return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }, { status: 405 });
				}
				const deleteAuthHeader = request.headers.get('Authorization');
				const deleteIdToken = deleteAuthHeader?.replace('Bearer ', '');
				if (!deleteIdToken) {
					return json(
						{ error: { code: 'UNAUTHORIZED', message: 'Authorization token required' } },
						{ status: 401 }
					);
				}
				await authHandler.deleteAccount(config.firebaseApiKey, deleteIdToken);
				result = { success: true };
				break;

			case LOCAL_ENDPOINTS.PASSWORD_RESET:
				if (request.method !== 'POST') {
					return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }, { status: 405 });
				}
				const resetData = await request.json();
				result = await authHandler.sendPasswordResetEmail(config.firebaseApiKey, resetData.email);
				break;

			case LOCAL_ENDPOINTS.PASSWORD_CONFIRM:
				if (request.method !== 'POST') {
					return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }, { status: 405 });
				}
				const confirmData = await request.json();
				result = await authHandler.confirmPasswordReset(
					config.firebaseApiKey,
					confirmData.oobCode,
					confirmData.newPassword
				);
				break;

			case LOCAL_ENDPOINTS.VERIFY_EMAIL:
				if (request.method !== 'POST') {
					return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }, { status: 405 });
				}
				const verifyAuthHeader = request.headers.get('Authorization');
				const verifyIdToken = verifyAuthHeader?.replace('Bearer ', '');
				if (!verifyIdToken) {
					return json(
						{ error: { code: 'UNAUTHORIZED', message: 'Authorization token required' } },
						{ status: 401 }
					);
				}
				result = await authHandler.sendEmailVerification(config.firebaseApiKey, verifyIdToken);
				break;

			case LOCAL_ENDPOINTS.VERIFY_EMAIL_CONFIRM:
				if (request.method !== 'POST') {
					return json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' } }, { status: 405 });
				}
				const verifyConfirmData = await request.json();
				result = await authHandler.confirmEmailVerification(
					config.firebaseApiKey,
					verifyConfirmData.oobCode
				);
				break;

			default:
				return json(
					{ error: { code: 'NOT_FOUND', message: 'Endpoint not found' } },
					{ status: 404 }
				);
		}

		const responseData = config.responseTransformer ? config.responseTransformer(result) : result;
		return json(responseData);
	} catch (error) {
		const authError = parseFirebaseError(error);
		return json({ error: authError }, { status: 400 });
	}
}

/**
 * Handle auth callback (for email verification, password reset, etc.)
 */
async function handleAuthCallback(
	event: RequestEvent,
	config: AuthHandleConfig
): Promise<Response> {
	const { searchParams } = event.url;
	const mode = searchParams.get('mode');
	const oobCode = searchParams.get('oobCode');
	const continueUrl = searchParams.get('continueUrl');

	// This is a basic callback handler
	// In a real application, you might want to render a custom page
	// or redirect to a specific URL based on the mode

	return new Response(
		`
		<!DOCTYPE html>
		<html>
		<head>
			<title>Authentication Action</title>
		</head>
		<body>
			<h1>Authentication Action</h1>
			<p>Mode: ${mode}</p>
			<p>Processing...</p>
			${continueUrl ? `<p><a href="${continueUrl}">Continue</a></p>` : ''}
		</body>
		</html>
		`,
		{
			headers: {
				'Content-Type': 'text/html'
			}
		}
	);
}

/**
 * Create auth guard for route protection
 */
export function createAuthGuard(config: AuthGuardConfig): Handle {
	return async ({ event, resolve }) => {
		const { pathname } = event.url;

		// Check if route is public
		if (config.publicRoutes && matchesAnyRoute(pathname, config.publicRoutes)) {
			return resolve(event);
		}

		// Check if route is protected
		if (config.protectedRoutes && matchesAnyRoute(pathname, config.protectedRoutes)) {
			// Verify authentication
			const isAuthenticated = config.verify ? await config.verify(event) : false;

			if (!isAuthenticated) {
				// Redirect to login or return 401
				if (config.redirectTo) {
					return new Response(null, {
						status: 302,
						headers: {
							Location: config.redirectTo
						}
					});
				}

				return json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
			}
		}

		return resolve(event);
	};
}

