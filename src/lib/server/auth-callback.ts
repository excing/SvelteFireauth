/**
 * Core auth callback processing logic
 * Handles Firebase Auth callbacks for email verification, password reset, etc.
 */

import type { AuthCallbackConfig } from './types.js';
import * as authHandler from './auth-handler.js';
import { parseFirebaseError } from '../shared/utils.js';

/**
 * Process Firebase Auth callback
 * This is the core logic shared between hooks and route handlers
 */
export async function processAuthCallback(
	url: URL,
	config: AuthCallbackConfig
): Promise<Response> {
	const { searchParams, origin } = url;
	const mode = searchParams.get('mode');
	const oobCode = searchParams.get('oobCode');
	const continueUrl = searchParams.get('continueUrl');

	const callbackConfig = {
		firebaseApiKey: config.firebaseApiKey,
		successUrl: config.successUrl || '/',
		errorUrl: config.errorUrl || '/auth/error',
		resetPasswordUrl: config.resetPasswordUrl || '/auth/reset-password',
		recoverEmailUrl: config.recoverEmailUrl || '/auth/recover-email',
		verifyEmailUrl: config.verifyEmailUrl || '/auth/verify-email'
	};

	// Validate required parameters
	if (!mode || !oobCode) {
		const errorUrl = new URL(callbackConfig.errorUrl, origin);
		errorUrl.searchParams.set('error', 'INVALID_REQUEST');
		errorUrl.searchParams.set('message', 'Missing required parameters');
		if (continueUrl) errorUrl.searchParams.set('continueUrl', continueUrl);
		return new Response(null, {
			status: 302,
			headers: { Location: errorUrl.toString() }
		});
	}

	try {
		// Verify OOB code first
		const verifyResult = await authHandler.verifyOobCode(callbackConfig.firebaseApiKey, oobCode);

		switch (mode) {
			case 'resetPassword': {
				// Redirect to password reset page with oobCode
				const resetUrl = new URL(callbackConfig.resetPasswordUrl, origin);
				resetUrl.searchParams.set('oobCode', oobCode);
				resetUrl.searchParams.set('email', verifyResult.email);
				if (continueUrl) resetUrl.searchParams.set('continueUrl', continueUrl);
				return new Response(null, {
					status: 302,
					headers: { Location: resetUrl.toString() }
				});
			}

			case 'verifyEmail': {
				// Execute email verification
				await authHandler.confirmEmailVerification(callbackConfig.firebaseApiKey, oobCode);

				// Redirect to success page
				const successUrl = new URL(callbackConfig.verifyEmailUrl || callbackConfig.successUrl, origin);
				successUrl.searchParams.set('mode', 'verifyEmail');
				successUrl.searchParams.set('email', verifyResult.email);
				if (continueUrl) successUrl.searchParams.set('continueUrl', continueUrl);
				return new Response(null, {
					status: 302,
					headers: { Location: successUrl.toString() }
				});
			}

			case 'recoverEmail': {
				// For email recovery, redirect to a page where user can confirm
				const recoverUrl = new URL(callbackConfig.recoverEmailUrl, origin);
				recoverUrl.searchParams.set('oobCode', oobCode);
				recoverUrl.searchParams.set('email', verifyResult.email);
				if (verifyResult.newEmail) recoverUrl.searchParams.set('newEmail', verifyResult.newEmail);
				if (continueUrl) recoverUrl.searchParams.set('continueUrl', continueUrl);
				return new Response(null, {
					status: 302,
					headers: { Location: recoverUrl.toString() }
				});
			}

			default: {
				const errorUrl = new URL(callbackConfig.errorUrl, origin);
				errorUrl.searchParams.set('error', 'INVALID_MODE');
				errorUrl.searchParams.set('message', `Unknown mode: ${mode}`);
				if (continueUrl) errorUrl.searchParams.set('continueUrl', continueUrl);
				return new Response(null, {
					status: 302,
					headers: { Location: errorUrl.toString() }
				});
			}
		}
	} catch (error) {
		const authError = parseFirebaseError(error);
		const errorUrl = new URL(callbackConfig.errorUrl, origin);
		errorUrl.searchParams.set('error', authError.code);
		errorUrl.searchParams.set('message', authError.message);
		errorUrl.searchParams.set('mode', mode);
		if (continueUrl) errorUrl.searchParams.set('continueUrl', continueUrl);
		return new Response(null, {
			status: 302,
			headers: { Location: errorUrl.toString() }
		});
	}
}
