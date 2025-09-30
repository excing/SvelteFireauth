/**
 * Shared constants
 */

/**
 * Firebase Auth REST API base URLs
 */
export const FIREBASE_AUTH_BASE_URL = 'https://identitytoolkit.googleapis.com/v1';
export const FIREBASE_TOKEN_BASE_URL = 'https://securetoken.googleapis.com/v1';

/**
 * Firebase Auth API endpoints
 */
export const FIREBASE_ENDPOINTS = {
	SIGN_UP: '/accounts:signUp',
	SIGN_IN: '/accounts:signInWithPassword',
	REFRESH_TOKEN: '/token',
	GET_USER: '/accounts:lookup',
	UPDATE_USER: '/accounts:update',
	DELETE_USER: '/accounts:delete',
	SEND_OOB_CODE: '/accounts:sendOobCode',
	RESET_PASSWORD: '/accounts:resetPassword',
	VERIFY_EMAIL: '/accounts:update'
} as const;

/**
 * Default API paths for proxy mode
 */
export const DEFAULT_API_PATH = '/api/auth';
export const DEFAULT_CALLBACK_PATH = '__/auth/action';

/**
 * Local API endpoints (for proxy mode)
 */
export const LOCAL_ENDPOINTS = {
	SIGN_UP: '/signup',
	SIGN_IN: '/signin',
	SIGN_OUT: '/signout',
	REFRESH_TOKEN: '/refresh',
	GET_USER: '/user',
	UPDATE_USER: '/user',
	DELETE_USER: '/user',
	PASSWORD_RESET: '/password-reset',
	PASSWORD_CONFIRM: '/password-confirm',
	VERIFY_EMAIL: '/verify-email',
	VERIFY_EMAIL_CONFIRM: '/verify-email-confirm'
} as const;

/**
 * Firebase error codes
 */
export const FIREBASE_ERROR_CODES = {
	EMAIL_EXISTS: 'EMAIL_EXISTS',
	INVALID_EMAIL: 'INVALID_EMAIL',
	WEAK_PASSWORD: 'WEAK_PASSWORD',
	EMAIL_NOT_FOUND: 'EMAIL_NOT_FOUND',
	INVALID_PASSWORD: 'INVALID_PASSWORD',
	USER_DISABLED: 'USER_DISABLED',
	TOKEN_EXPIRED: 'TOKEN_EXPIRED',
	INVALID_ID_TOKEN: 'INVALID_ID_TOKEN',
	INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',
	USER_NOT_FOUND: 'USER_NOT_FOUND',
	OPERATION_NOT_ALLOWED: 'OPERATION_NOT_ALLOWED',
	TOO_MANY_ATTEMPTS_TRY_LATER: 'TOO_MANY_ATTEMPTS_TRY_LATER'
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
	[FIREBASE_ERROR_CODES.EMAIL_EXISTS]: 'The email address is already in use',
	[FIREBASE_ERROR_CODES.INVALID_EMAIL]: 'The email address is invalid',
	[FIREBASE_ERROR_CODES.WEAK_PASSWORD]: 'The password is too weak',
	[FIREBASE_ERROR_CODES.EMAIL_NOT_FOUND]: 'Email not found',
	[FIREBASE_ERROR_CODES.INVALID_PASSWORD]: 'Invalid password',
	[FIREBASE_ERROR_CODES.USER_DISABLED]: 'User account has been disabled',
	[FIREBASE_ERROR_CODES.TOKEN_EXPIRED]: 'Token has expired',
	[FIREBASE_ERROR_CODES.INVALID_ID_TOKEN]: 'Invalid ID token',
	[FIREBASE_ERROR_CODES.INVALID_REFRESH_TOKEN]: 'Invalid refresh token',
	[FIREBASE_ERROR_CODES.USER_NOT_FOUND]: 'User not found',
	[FIREBASE_ERROR_CODES.OPERATION_NOT_ALLOWED]: 'Operation not allowed',
	[FIREBASE_ERROR_CODES.TOO_MANY_ATTEMPTS_TRY_LATER]: 'Too many attempts, please try again later'
} as const;

/**
 * Default session configuration
 */
export const DEFAULT_SESSION_CONFIG = {
	cookieName: 'session',
	maxAge: 60 * 60 * 24 * 5, // 5 days
	secure: true,
	httpOnly: true,
	sameSite: 'lax' as const,
	path: '/'
};

/**
 * Token storage keys
 */
export const STORAGE_KEYS = {
	ID_TOKEN: 'sveltefireauth_id_token',
	REFRESH_TOKEN: 'sveltefireauth_refresh_token',
	USER: 'sveltefireauth_user',
	EXPIRES_AT: 'sveltefireauth_expires_at'
} as const;

/**
 * Default token refresh interval (in milliseconds)
 * Refresh 5 minutes before expiration
 */
export const DEFAULT_REFRESH_INTERVAL = 55 * 60 * 1000; // 55 minutes

