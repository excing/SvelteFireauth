/**
 * Server-side exports for SvelteFireauth
 */

// Hooks
export { createAuthHandle, createAuthGuard } from './hooks.js';

// Route handlers
export {
	handleSignUp,
	handleSignIn,
	handleSignOut,
	handleRefreshToken,
	handleGetUser,
	handleUpdateUser,
	handleDeleteUser,
	handlePasswordReset,
	handlePasswordConfirm,
	handleVerifyEmail,
	handleVerifyEmailConfirm,
	handleAuthCallback
} from './route-handlers.js';

// Auth handler functions (for advanced use cases)
export {
	signUp,
	signIn,
	refreshToken,
	getUser,
	updateProfile,
	deleteAccount,
	sendPasswordResetEmail,
	confirmPasswordReset,
	sendEmailVerification,
	confirmEmailVerification,
	verifyOobCode
} from './auth-handler.js';

// Auth callback processing (for custom implementations)
export { processAuthCallback } from './auth-callback.js';

// Types
export type {
	AuthHandleConfig,
	AuthCallbackConfig,
	RouteHandlerConfig,
	AuthGuardConfig,
	SessionConfig,
	SessionData,
	AuthCallbackParams
} from './types.js';

