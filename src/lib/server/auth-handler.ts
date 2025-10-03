/**
 * Firebase Auth API handler
 */

import type {
	SignUpRequest,
	SignUpResponse,
	SignInRequest,
	SignInResponse,
	RefreshTokenRequest,
	RefreshTokenResponse,
	GetUserRequest,
	GetUserResponse,
	UpdateProfileRequest,
	UpdateProfileResponse,
	DeleteAccountRequest,
	SendPasswordResetEmailRequest,
	SendPasswordResetEmailResponse,
	ConfirmPasswordResetRequest,
	ConfirmPasswordResetResponse,
	SendEmailVerificationRequest,
	SendEmailVerificationResponse
} from '../shared/types.js';
import { buildFirebaseAuthUrl, buildFirebaseTokenUrl, parseFirebaseError } from '../shared/utils.js';
import { FIREBASE_ENDPOINTS } from '../shared/constants.js';

/**
 * Base Firebase API request handler
 */
async function firebaseRequest<T>(
	url: string,
	body?: unknown
): Promise<T> {
	try {
		const response = await fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: body ? JSON.stringify(body) : undefined
		});

		const data = await response.json();

		if (!response.ok) {
			throw parseFirebaseError(data);
		}

		return data as T;
	} catch (error) {
		if (error && typeof error === 'object' && 'code' in error) {
			throw error;
		}
		throw parseFirebaseError(error);
	}
}

/**
 * Sign up with email and password
 */
export async function signUp(
	apiKey: string,
	email: string,
	password: string
): Promise<SignUpResponse> {
	const url = buildFirebaseAuthUrl(FIREBASE_ENDPOINTS.SIGN_UP, apiKey);
	const body: SignUpRequest = {
		email,
		password,
		returnSecureToken: true
	};

	return firebaseRequest<SignUpResponse>(url, body);
}

/**
 * Sign in with email and password
 */
export async function signIn(
	apiKey: string,
	email: string,
	password: string
): Promise<SignInResponse> {
	const url = buildFirebaseAuthUrl(FIREBASE_ENDPOINTS.SIGN_IN, apiKey);
	const body: SignInRequest = {
		email,
		password,
		returnSecureToken: true
	};

	return firebaseRequest<SignInResponse>(url, body);
}

/**
 * Refresh ID token
 */
export async function refreshToken(
	apiKey: string,
	refreshToken: string
): Promise<RefreshTokenResponse> {
	const url = buildFirebaseTokenUrl(apiKey);
	const body: RefreshTokenRequest = {
		grant_type: 'refresh_token',
		refresh_token: refreshToken
	};

	return firebaseRequest<RefreshTokenResponse>(url, body);
}

/**
 * Get user information
 */
export async function getUser(apiKey: string, idToken: string): Promise<GetUserResponse> {
	const url = buildFirebaseAuthUrl(FIREBASE_ENDPOINTS.GET_USER, apiKey);
	const body: GetUserRequest = {
		idToken
	};

	return firebaseRequest<GetUserResponse>(url, body);
}

/**
 * Update user profile
 */
export async function updateProfile(
	apiKey: string,
	idToken: string,
	displayName?: string,
	photoUrl?: string
): Promise<UpdateProfileResponse> {
	const url = buildFirebaseAuthUrl(FIREBASE_ENDPOINTS.UPDATE_USER, apiKey);
	const body: UpdateProfileRequest = {
		idToken,
		displayName,
		photoUrl,
		returnSecureToken: true
	};

	return firebaseRequest<UpdateProfileResponse>(url, body);
}

/**
 * Delete user account
 */
export async function deleteAccount(apiKey: string, idToken: string): Promise<void> {
	const url = buildFirebaseAuthUrl(FIREBASE_ENDPOINTS.DELETE_USER, apiKey);
	const body: DeleteAccountRequest = {
		idToken
	};

	await firebaseRequest<unknown>(url, body);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
	apiKey: string,
	email: string
): Promise<SendPasswordResetEmailResponse> {
	const url = buildFirebaseAuthUrl(FIREBASE_ENDPOINTS.SEND_OOB_CODE, apiKey);
	const body: SendPasswordResetEmailRequest = {
		requestType: 'PASSWORD_RESET',
		email
	};

	return firebaseRequest<SendPasswordResetEmailResponse>(url, body);
}

/**
 * Confirm password reset
 */
export async function confirmPasswordReset(
	apiKey: string,
	oobCode: string,
	newPassword: string
): Promise<ConfirmPasswordResetResponse> {
	const url = buildFirebaseAuthUrl(FIREBASE_ENDPOINTS.RESET_PASSWORD, apiKey);
	const body: ConfirmPasswordResetRequest = {
		oobCode,
		newPassword
	};

	return firebaseRequest<ConfirmPasswordResetResponse>(url, body);
}

/**
 * Send email verification
 */
export async function sendEmailVerification(
	apiKey: string,
	idToken: string
): Promise<SendEmailVerificationResponse> {
	const url = buildFirebaseAuthUrl(FIREBASE_ENDPOINTS.SEND_OOB_CODE, apiKey);
	const body: SendEmailVerificationRequest = {
		requestType: 'VERIFY_EMAIL',
		idToken
	};

	return firebaseRequest<SendEmailVerificationResponse>(url, body);
}

/**
 * Confirm email verification
 */
export async function confirmEmailVerification(
	apiKey: string,
	oobCode: string
): Promise<UpdateProfileResponse> {
	const url = buildFirebaseAuthUrl(FIREBASE_ENDPOINTS.VERIFY_EMAIL, apiKey);
	const body = {
		oobCode
	};

	return firebaseRequest<UpdateProfileResponse>(url, body);
}

