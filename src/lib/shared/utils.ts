/**
 * Shared utility functions
 */

import type { AuthError, FirebaseErrorResponse } from './types.js';
import { ERROR_MESSAGES, FIREBASE_TOKEN_BASE_URL, FIREBASE_AUTH_BASE_URL } from './constants.js';

/**
 * Build Firebase Auth API URL
 */
export function buildFirebaseAuthUrl(endpoint: string, apiKey: string): string {
	const baseUrl = FIREBASE_AUTH_BASE_URL;
	return `${baseUrl}${endpoint}?key=${apiKey}`;
}

/**
 * Build Firebase Token API URL
 */
export function buildFirebaseTokenUrl(apiKey: string): string {
	const baseUrl = FIREBASE_TOKEN_BASE_URL;
	return `${baseUrl}/token?key=${apiKey}`;
}

/**
 * Parse Firebase error response
 */
export function parseFirebaseError(error: any): AuthError {
	// Handle Firebase error response format
	if (error.error && error.error.message) {
		const errorMessage = error.error.message;
		
		// Extract error code from message (e.g., "EMAIL_EXISTS" from "EMAIL_EXISTS : The email address is already in use")
		const errorCode = errorMessage.split(':')[0].trim();
		
		return {
			code: errorCode,
			message: ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES] || errorMessage,
			details: error.error
		};
	}
	
	// Handle generic errors
	if (error instanceof Error) {
		return {
			code: 'UNKNOWN_ERROR',
			message: error.message,
			details: error
		};
	}
	
	// Handle unknown error format
	return {
		code: 'UNKNOWN_ERROR',
		message: 'An unknown error occurred',
		details: error
	};
}

/**
 * Check if error is a Firebase error
 */
export function isFirebaseError(error: any): error is FirebaseErrorResponse {
	return error && error.error && typeof error.error.message === 'string';
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isValidPassword(password: string, minLength: number = 6): boolean {
	return password.length >= minLength;
}

/**
 * Calculate token expiration time
 */
export function calculateExpiresAt(expiresIn: string | number): number {
	const expiresInSeconds = typeof expiresIn === 'string' ? parseInt(expiresIn, 10) : expiresIn;
	return Date.now() + expiresInSeconds * 1000;
}

/**
 * Check if token is expired
 */
export function isTokenExpired(expiresAt: number): boolean {
	return Date.now() >= expiresAt;
}

/**
 * Check if token will expire soon (within 5 minutes)
 */
export function willTokenExpireSoon(expiresAt: number, bufferMs: number = 5 * 60 * 1000): boolean {
	return Date.now() + bufferMs >= expiresAt;
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
	try {
		return JSON.parse(json);
	} catch {
		return fallback;
	}
}

/**
 * Safe JSON stringify
 */
export function safeJsonStringify(value: any, fallback: string = '{}'): string {
	try {
		return JSON.stringify(value);
	} catch {
		return fallback;
	}
}

/**
 * Create auth error
 */
export function createAuthError(code: string, message?: string): AuthError {
	return {
		code,
		message: message || ERROR_MESSAGES[code as keyof typeof ERROR_MESSAGES] || 'An error occurred',
		details: null
	};
}

/**
 * Match route pattern
 */
export function matchRoute(pathname: string, pattern: string): boolean {
	// Simple pattern matching - can be enhanced with more complex patterns
	if (pattern === pathname) return true;
	
	// Support wildcard patterns like /dashboard/*
	if (pattern.endsWith('/*')) {
		const basePattern = pattern.slice(0, -2);
		return pathname.startsWith(basePattern);
	}
	
	return false;
}

/**
 * Check if route matches any pattern in list
 */
export function matchesAnyRoute(pathname: string, patterns: string[]): boolean {
	return patterns.some(pattern => matchRoute(pathname, pattern));
}

/**
 * Sanitize user data (remove sensitive information)
 */
export function sanitizeUser(user: any): any {
	const { passwordHash, ...sanitized } = user;
	return sanitized;
}

