/**
 * Firebase Auth Client for browser
 */

import type {
	SignUpResponse,
	SignInResponse,
	RefreshTokenResponse,
	GetUserResponse,
	UpdateProfileResponse,
	SendPasswordResetEmailResponse,
	ConfirmPasswordResetResponse,
	SendEmailVerificationResponse,
	User
} from '../shared/types.js';
import type { AuthClientConfig, SignUpCredentials, SignInCredentials, UpdateProfileData } from './types.js';
import { buildFirebaseAuthUrl, buildFirebaseTokenUrl, parseFirebaseError } from '../shared/utils.js';
import { FIREBASE_ENDPOINTS, DEFAULT_API_PATH, LOCAL_ENDPOINTS } from '../shared/constants.js';

/**
 * Firebase Auth Client
 */
export class FirebaseAuthClient {
	private config: AuthClientConfig;

	constructor(config: AuthClientConfig) {
		this.config = config;
	}

	/**
	 * Make API request (direct or proxy mode)
	 */
	private async request<T>(
		endpoint: string,
		method: string = 'POST',
		body?: any,
		headers?: Record<string, string>
	): Promise<T> {
		try {
			let url: string;

			if (this.config.mode === 'direct') {
				// Direct Firebase API call
				if (!this.config.apiKey) {
					throw new Error('API key is required for direct mode');
				}

				if (endpoint === '/token') {
					url = buildFirebaseTokenUrl(this.config.apiKey);
				} else {
					url = buildFirebaseAuthUrl(endpoint, this.config.apiKey);
				}
			} else {
				// Proxy mode
				const proxyPath = this.config.proxyPath || DEFAULT_API_PATH;
				const localEndpoint = this.getLocalEndpoint(endpoint);
				url = `${proxyPath}${localEndpoint}`;
			}

			const response = await fetch(url, {
				method,
				headers: {
					'Content-Type': 'application/json',
					...headers
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
	 * Map Firebase endpoint to local endpoint
	 */
	private getLocalEndpoint(firebaseEndpoint: string): string {
		const mapping: Record<string, string> = {
			[FIREBASE_ENDPOINTS.SIGN_UP]: LOCAL_ENDPOINTS.SIGN_UP,
			[FIREBASE_ENDPOINTS.SIGN_IN]: LOCAL_ENDPOINTS.SIGN_IN,
			['/token']: LOCAL_ENDPOINTS.REFRESH_TOKEN,
			[FIREBASE_ENDPOINTS.GET_USER]: LOCAL_ENDPOINTS.GET_USER,
			[FIREBASE_ENDPOINTS.UPDATE_USER]: LOCAL_ENDPOINTS.UPDATE_USER,
			[FIREBASE_ENDPOINTS.DELETE_USER]: LOCAL_ENDPOINTS.DELETE_USER,
			[FIREBASE_ENDPOINTS.SEND_OOB_CODE]: LOCAL_ENDPOINTS.PASSWORD_RESET,
			[FIREBASE_ENDPOINTS.RESET_PASSWORD]: LOCAL_ENDPOINTS.PASSWORD_CONFIRM
		};

		return mapping[firebaseEndpoint] || firebaseEndpoint;
	}

	/**
	 * Sign up with email and password
	 */
	async signUp(credentials: SignUpCredentials): Promise<SignUpResponse> {
		return this.request<SignUpResponse>(FIREBASE_ENDPOINTS.SIGN_UP, 'POST', {
			email: credentials.email,
			password: credentials.password,
			returnSecureToken: true
		});
	}

	/**
	 * Sign in with email and password
	 */
	async signIn(credentials: SignInCredentials): Promise<SignInResponse> {
		return this.request<SignInResponse>(FIREBASE_ENDPOINTS.SIGN_IN, 'POST', {
			email: credentials.email,
			password: credentials.password,
			returnSecureToken: true
		});
	}

	/**
	 * Refresh ID token
	 */
	async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
		return this.request<RefreshTokenResponse>('/token', 'POST', {
			grant_type: 'refresh_token',
			refresh_token: refreshToken
		});
	}

	/**
	 * Get user information
	 */
	async getUser(idToken: string): Promise<User | null> {
		const response = await this.request<GetUserResponse>(
			FIREBASE_ENDPOINTS.GET_USER,
			this.config.mode === 'direct' ? 'POST' : 'GET',
			this.config.mode === 'direct' ? { idToken } : undefined,
			{ Authorization: `Bearer ${idToken}` }
		);

		return response.users && response.users.length > 0 ? response.users[0] : null;
	}

	/**
	 * Update user profile
	 */
	async updateProfile(data: UpdateProfileData, idToken: string): Promise<UpdateProfileResponse> {
		return this.request<UpdateProfileResponse>(
			FIREBASE_ENDPOINTS.UPDATE_USER,
			this.config.mode === 'direct' ? 'POST' : 'PUT',
			{
				idToken: this.config.mode === 'direct' ? idToken : undefined,
				displayName: data.displayName,
				photoUrl: data.photoUrl,
				returnSecureToken: true
			},
			{ Authorization: `Bearer ${idToken}` }
		);
	}

	/**
	 * Delete user account
	 */
	async deleteAccount(idToken: string): Promise<void> {
		await this.request<void>(
			FIREBASE_ENDPOINTS.DELETE_USER,
			this.config.mode === 'direct' ? 'POST' : 'DELETE',
			this.config.mode === 'direct' ? { idToken } : undefined,
			{ Authorization: `Bearer ${idToken}` }
		);
	}

	/**
	 * Send password reset email
	 */
	async sendPasswordResetEmail(email: string): Promise<SendPasswordResetEmailResponse> {
		return this.request<SendPasswordResetEmailResponse>(FIREBASE_ENDPOINTS.SEND_OOB_CODE, 'POST', {
			requestType: 'PASSWORD_RESET',
			email
		});
	}

	/**
	 * Confirm password reset
	 */
	async confirmPasswordReset(oobCode: string, newPassword: string): Promise<ConfirmPasswordResetResponse> {
		return this.request<ConfirmPasswordResetResponse>(FIREBASE_ENDPOINTS.RESET_PASSWORD, 'POST', {
			oobCode,
			newPassword
		});
	}

	/**
	 * Send email verification
	 */
	async sendEmailVerification(idToken: string): Promise<SendEmailVerificationResponse> {
		return this.request<SendEmailVerificationResponse>(
			FIREBASE_ENDPOINTS.SEND_OOB_CODE,
			'POST',
			{
				requestType: 'VERIFY_EMAIL',
				idToken
			},
			{ Authorization: `Bearer ${idToken}` }
		);
	}

	/**
	 * Confirm email verification
	 */
	async confirmEmailVerification(oobCode: string): Promise<UpdateProfileResponse> {
		return this.request<UpdateProfileResponse>(FIREBASE_ENDPOINTS.VERIFY_EMAIL, 'POST', {
			oobCode
		});
	}
}

