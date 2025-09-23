/**
 * 工具函数测试
 */

import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPassword,
  parseToken,
  isTokenExpired,
  formatTimestamp,
  formatRelativeTime,
  generateAvatarURL,
  getUserDisplayName,
  createFirebaseError,
  handleFirebaseError
} from '../utils/index.js';

describe('Email Validation', () => {
  it('should validate correct email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    expect(isValidEmail('user123@test-domain.com')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
    expect(isValidEmail('@domain.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

describe('Password Validation', () => {
  it('should validate strong passwords', () => {
    expect(isValidPassword('StrongPass123!')).toBe(true);
    expect(isValidPassword('MyPassword1')).toBe(true);
  });

  it('should reject weak passwords', () => {
    expect(isValidPassword('weak')).toBe(false);
    expect(isValidPassword('12345678')).toBe(false);
    expect(isValidPassword('password')).toBe(false);
    expect(isValidPassword('')).toBe(false);
  });
});

describe('Token Utilities', () => {
  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.Lp-38RNAeOjNZY_NGk6VmXq5R_nh5SQT8ZZzOLhzKzY';

  it('should parse JWT tokens correctly', () => {
    const parsed = parseToken(mockToken);
    expect(parsed).toHaveProperty('sub', '1234567890');
    expect(parsed).toHaveProperty('name', 'John Doe');
  });

  it('should handle invalid tokens', () => {
    expect(parseToken('invalid-token')).toBeNull();
    expect(parseToken('')).toBeNull();
  });

  it('should check token expiration', () => {
    const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid';
    expect(isTokenExpired(expiredToken)).toBe(true);
    expect(isTokenExpired(mockToken)).toBe(false);
  });
});

describe('Formatting Utilities', () => {
  it('should format timestamps correctly', () => {
    const timestamp = '2023-01-01T12:00:00Z';
    const formatted = formatTimestamp(timestamp);
    expect(formatted).toContain('2023');
  });

  it('should format relative time', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const relative = formatRelativeTime(oneHourAgo.toISOString());
    expect(relative).toContain('小时前');
  });

  it('should generate avatar URLs', () => {
    const url = generateAvatarURL('test@example.com');
    expect(url).toContain('gravatar.com');
    expect(url).toContain('d=identicon');
  });

  it('should get user display names', () => {
    const user1 = {
      uid: '1',
      displayName: 'John Doe',
      email: 'john@example.com',
      emailVerified: true,
      accessToken: 'token1',
      refreshToken: 'refresh1'
    };
    const user2 = {
      uid: '2',
      email: 'jane@example.com',
      emailVerified: true,
      accessToken: 'token2',
      refreshToken: 'refresh2'
    };

    expect(getUserDisplayName(user1)).toBe('John Doe');
    expect(getUserDisplayName(user2)).toBe('jane@example.com');
    expect(getUserDisplayName(null)).toBe('未知用户');
  });
});

describe('Error Handling', () => {
  it('should create Firebase errors', () => {
    const error = createFirebaseError('EMAIL_EXISTS', 'Email already exists');
    expect(error.code).toBe('EMAIL_EXISTS');
    expect(error.message).toBe('Email already exists');
  });

  it('should handle Firebase errors', () => {
    const error = { code: 'EMAIL_NOT_FOUND' };
    const message = handleFirebaseError(error);
    expect(message).toContain('未找到该邮箱地址对应的账户');
  });

  it('should handle unknown errors', () => {
    const error = { code: 'UNKNOWN_ERROR' };
    const message = handleFirebaseError(error);
    expect(message).toContain('未知错误');
  });
});
