/**
 * Shared types used across client and server
 */

/**
 * User information
 */
export interface User {
	localId: string;
	email: string;
	emailVerified: boolean;
	displayName?: string;
	photoUrl?: string;
	disabled?: boolean;
	createdAt?: string;
	lastLoginAt?: string;
	providerUserInfo?: ProviderUserInfo[];
}

/**
 * Provider user information
 */
export interface ProviderUserInfo {
	providerId: string;
	displayName?: string;
	photoUrl?: string;
	federatedId?: string;
	email?: string;
	rawId?: string;
}

/**
 * Authentication error
 */
export interface AuthError {
	code: string;
	message: string;
	details?: any;
}

/**
 * Sign up request
 */
export interface SignUpRequest {
	email: string;
	password: string;
	returnSecureToken?: boolean;
}

/**
 * Sign up response from Firebase
 */
export interface SignUpResponse {
	idToken: string;
	email: string;
	refreshToken: string;
	expiresIn: string;
	localId: string;
}

/**
 * Sign in request
 */
export interface SignInRequest {
	email: string;
	password: string;
	returnSecureToken?: boolean;
}

/**
 * Sign in response from Firebase
 */
export interface SignInResponse {
	idToken: string;
	email: string;
	refreshToken: string;
	expiresIn: string;
	localId: string;
	registered: boolean;
	displayName?: string;
	photoUrl?: string;
}

/**
 * Refresh token request
 */
export interface RefreshTokenRequest {
	grant_type: 'refresh_token';
	refresh_token: string;
}

/**
 * Refresh token response from Firebase
 */
export interface RefreshTokenResponse {
	access_token: string;
	expires_in: string;
	token_type: string;
	refresh_token: string;
	id_token: string;
	user_id: string;
	project_id: string;
}

/**
 * Get user request
 */
export interface GetUserRequest {
	idToken: string;
}

/**
 * Get user response from Firebase
 */
export interface GetUserResponse {
	users: User[];
}

/**
 * Update profile request
 */
export interface UpdateProfileRequest {
	idToken: string;
	displayName?: string;
	photoUrl?: string;
	deleteAttribute?: string[];
	returnSecureToken?: boolean;
}

/**
 * Update profile response from Firebase
 */
export interface UpdateProfileResponse {
	localId: string;
	email: string;
	displayName?: string;
	photoUrl?: string;
	passwordHash?: string;
	providerUserInfo?: ProviderUserInfo[];
	idToken?: string;
	refreshToken?: string;
	expiresIn?: string;
}

/**
 * Delete account request
 */
export interface DeleteAccountRequest {
	idToken: string;
}

/**
 * Send password reset email request
 */
export interface SendPasswordResetEmailRequest {
	requestType: 'PASSWORD_RESET';
	email: string;
}

/**
 * Send password reset email response
 */
export interface SendPasswordResetEmailResponse {
	email: string;
}

/**
 * Confirm password reset request
 */
export interface ConfirmPasswordResetRequest {
	oobCode: string;
	newPassword: string;
}

/**
 * Confirm password reset response
 */
export interface ConfirmPasswordResetResponse {
	email: string;
	requestType: string;
}

/**
 * Send email verification request
 */
export interface SendEmailVerificationRequest {
	requestType: 'VERIFY_EMAIL';
	idToken: string;
}

/**
 * Send email verification response
 */
export interface SendEmailVerificationResponse {
	email: string;
}

/**
 * Confirm email verification request
 */
export interface ConfirmEmailVerificationRequest {
	oobCode: string;
}

/**
 * Verify OOB code request
 */
export interface VerifyOobCodeRequest {
	oobCode: string;
}

/**
 * Verify OOB code response
 */
export interface VerifyOobCodeResponse {
	email: string;
	requestType: 'PASSWORD_RESET' | 'VERIFY_EMAIL' | 'RECOVER_EMAIL';
	newEmail?: string;
}

/**
 * Firebase error response
 */
export interface FirebaseErrorResponse {
	error: {
		code: number;
		message: string;
		errors?: Array<{
			message: string;
			domain: string;
			reason: string;
		}>;
	};
}

/**
 * Auth mode: direct or proxy
 */
export type AuthMode = 'direct' | 'proxy';

/**
 * Response transformer function
 */
export type ResponseTransformer = (data: any) => any;

