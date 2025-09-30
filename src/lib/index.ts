/**
 * SvelteFireauth - Firebase Authentication for SvelteKit
 *
 * This is a Svelte library that provides Firebase Authentication integration
 * for SvelteKit applications with both server-side and client-side support.
 */

// Re-export shared types
export type {
	User,
	AuthError,
	SignUpRequest,
	SignUpResponse,
	SignInRequest,
	SignInResponse,
	RefreshTokenRequest,
	RefreshTokenResponse,
	GetUserResponse,
	UpdateProfileRequest,
	UpdateProfileResponse,
	AuthMode,
	ResponseTransformer
} from './shared/types.js';

// Re-export shared constants
export {
	FIREBASE_AUTH_BASE_URL,
	FIREBASE_TOKEN_BASE_URL,
	FIREBASE_ENDPOINTS,
	DEFAULT_API_PATH,
	DEFAULT_CALLBACK_PATH,
	LOCAL_ENDPOINTS,
	FIREBASE_ERROR_CODES,
	ERROR_MESSAGES
} from './shared/constants.js';

// Re-export shared utils
export {
	buildFirebaseAuthUrl,
	buildFirebaseTokenUrl,
	parseFirebaseError,
	isValidEmail,
	isValidPassword,
	calculateExpiresAt,
	isTokenExpired,
	willTokenExpireSoon
} from './shared/utils.js';
