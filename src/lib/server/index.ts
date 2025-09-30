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
	handleVerifyEmailConfirm
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
	confirmEmailVerification
} from './auth-handler.js';

// Types
export type {
	AuthHandleConfig,
	RouteHandlerConfig,
	AuthGuardConfig,
	SessionConfig,
	SessionData,
	AuthCallbackParams
} from './types.js';

