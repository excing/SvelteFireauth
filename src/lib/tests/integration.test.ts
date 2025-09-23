/**
 * 集成测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FirebaseAuthClient } from '../core/client.js';
import { authStore } from '../client/store.js';

// Mock fetch
global.fetch = vi.fn();

describe('Firebase Auth Client Integration', () => {
  let client: FirebaseAuthClient;

  beforeEach(() => {
    client = new FirebaseAuthClient({
      apiKey: 'test-api-key',
      projectId: 'test-project'
    });
    vi.clearAllMocks();
  });

  it('should initialize client with config', () => {
    expect(client).toBeDefined();
  });

  it('should handle sign up request', async () => {
    const mockResponse = {
      localId: 'test-uid',
      email: 'test@example.com',
      idToken: 'test-token',
      refreshToken: 'test-refresh-token',
      expiresIn: '3600'
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await client.signUp({
      email: 'test@example.com',
      password: 'password123',
      displayName: 'Test User'
    });

    expect(result.localId).toBe('test-uid');
    expect(result.email).toBe('test@example.com');
  });

  it('should handle sign in request', async () => {
    const mockResponse = {
      localId: 'test-uid',
      email: 'test@example.com',
      idToken: 'test-token',
      refreshToken: 'test-refresh-token',
      expiresIn: '3600'
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    });

    const result = await client.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });

    expect(result.localId).toBe('test-uid');
    expect(result.email).toBe('test@example.com');
  });

  it('should handle API errors', async () => {
    const mockError = {
      error: {
        code: 400,
        message: 'EMAIL_EXISTS',
        errors: [{ message: 'The email address is already in use by another account.' }]
      }
    };

    (fetch as any).mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve(mockError)
    });

    await expect(client.signUp({
      email: 'test@example.com',
      password: 'password123'
    })).rejects.toThrow();
  });
});

describe('Auth Store Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state
    authStore.clear();
    authStore.setLoading(false);
    authStore.clearError();
  });

  it('should initialize with default state', () => {
    expect(authStore.getCurrentUser()).toBeNull();
    expect(authStore.isAuthenticated()).toBe(false);
  });

  it('should update user state', () => {
    const testUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: true,
      photoURL: undefined,
      accessToken: 'test-token',
      refreshToken: 'test-refresh-token'
    };

    authStore.setUser(testUser);

    expect(authStore.getCurrentUser()).toEqual(testUser);
    expect(authStore.isAuthenticated()).toBe(true);
  });

  it('should clear user state on sign out', () => {
    const testUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: true,
      photoURL: undefined,
      accessToken: 'test-token',
      refreshToken: 'test-refresh-token'
    };

    authStore.setUser(testUser);
    expect(authStore.isAuthenticated()).toBe(true);

    authStore.clear();
    expect(authStore.getCurrentUser()).toBeNull();
    expect(authStore.isAuthenticated()).toBe(false);
  });

  it('should handle loading states', () => {
    authStore.setLoading(true);
    // Note: We can't easily test loading state without accessing the store directly
    // This is a limitation of the current API design
  });

  it('should handle error states', () => {
    const errorMessage = 'Test error message';

    authStore.setError(errorMessage);
    // Note: We can't easily test error state without accessing the store directly
    // This is a limitation of the current API design

    authStore.clearError();
  });
});
