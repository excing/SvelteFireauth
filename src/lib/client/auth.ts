/**
 * 客户端认证操作
 * 提供所有客户端认证相关的函数
 */

import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import type {
  User,
  SignUpRequest,
  SignInRequest
} from '../types/index.js';
import { AuthStore, authStore } from './store.js';

// ============================================================================
// API 调用辅助函数
// ============================================================================

/**
 * 发送认证 API 请求
 */
async function authRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'POST',
  body?: any
): Promise<T> {
  try {
    AuthStore.setLoading(true);
    AuthStore.clearError();

    const response = await fetch(`/api/auth${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const error = data.error || { code: 'UNKNOWN_ERROR', message: 'Unknown error occurred' };
      throw new Error(error.message);
    }

    return data.data;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    AuthStore.setError(errorMessage);
    throw error;
  } finally {
    AuthStore.setLoading(false);
  }
}

// ============================================================================
// 认证操作
// ============================================================================

/**
 * 用户注册
 */
export async function signUp(
  email: string,
  password: string,
  displayName?: string,
  redirectTo?: string
): Promise<User> {
  if (!browser) {
    throw new Error('signUp can only be called in the browser');
  }

  const request: SignUpRequest = {
    email,
    password,
    displayName,
    returnSecureToken: true
  };

  const result = await authRequest<{ user: User }>('/signup', 'POST', request);
  AuthStore.setUser(result.user);

  // 重定向到指定页面
  if (redirectTo) {
    await goto(redirectTo);
  }

  return result.user;
}

/**
 * 用户登录
 */
export async function signIn(
  email: string,
  password: string,
  redirectTo?: string
): Promise<User> {
  if (!browser) {
    throw new Error('signIn can only be called in the browser');
  }

  const request: SignInRequest = {
    email,
    password,
    returnSecureToken: true
  };

  const result = await authRequest<{ user: User }>('/signin', 'POST', request);
  AuthStore.setUser(result.user);

  // 重定向到指定页面
  if (redirectTo) {
    await goto(redirectTo);
  }

  return result.user;
}

/**
 * 用户登出
 */
export async function signOut(redirectTo?: string): Promise<void> {
  if (!browser) {
    throw new Error('signOut can only be called in the browser');
  }

  await authRequest('/signout', 'POST');
  AuthStore.setUser(null);

  // 重定向到指定页面
  if (redirectTo) {
    await goto(redirectTo);
  }
}

/**
 * 刷新令牌
 */
export async function refreshToken(): Promise<User> {
  if (!browser) {
    throw new Error('refreshToken can only be called in the browser');
  }

  const result = await authRequest<{ user: User }>('/refresh', 'POST');
  AuthStore.setUser(result.user);
  return result.user;
}

// ============================================================================
// 用户资料管理
// ============================================================================

/**
 * 更新用户资料
 */
export async function updateProfile(updates: {
  displayName?: string;
  photoURL?: string;
}): Promise<User> {
  if (!browser) {
    throw new Error('updateProfile can only be called in the browser');
  }

  const result = await authRequest<{ user: User }>('/profile', 'POST', updates);
  AuthStore.setUser(result.user);
  return result.user;
}

/**
 * 更新用户邮箱
 */
export async function updateEmail(email: string): Promise<User> {
  if (!browser) {
    throw new Error('updateEmail can only be called in the browser');
  }

  const result = await authRequest<{ user: User }>('/update-email', 'POST', { email });
  AuthStore.setUser(result.user);
  return result.user;
}

/**
 * 更新用户密码
 */
export async function updatePassword(password: string): Promise<User> {
  if (!browser) {
    throw new Error('updatePassword can only be called in the browser');
  }

  const result = await authRequest<{ user: User }>('/update-password', 'POST', { password });
  AuthStore.setUser(result.user);
  return result.user;
}

/**
 * 删除用户账户
 */
export async function deleteAccount(redirectTo?: string): Promise<void> {
  if (!browser) {
    throw new Error('deleteAccount can only be called in the browser');
  }

  await authRequest('/delete-account', 'POST');
  AuthStore.setUser(null);

  // 重定向到指定页面
  if (redirectTo) {
    await goto(redirectTo);
  }
}

// ============================================================================
// 邮箱验证和密码重置
// ============================================================================

/**
 * 发送邮箱验证
 */
export async function sendEmailVerification(): Promise<void> {
  if (!browser) {
    throw new Error('sendEmailVerification can only be called in the browser');
  }

  await authRequest('/send-email-verification', 'POST');
}

/**
 * 发送密码重置邮件
 */
export async function sendPasswordReset(email: string): Promise<void> {
  if (!browser) {
    throw new Error('sendPasswordReset can only be called in the browser');
  }

  await authRequest('/send-password-reset', 'POST', { email });
}

/**
 * 确认密码重置
 */
export async function confirmPasswordReset(
  oobCode: string,
  newPassword: string
): Promise<void> {
  if (!browser) {
    throw new Error('confirmPasswordReset can only be called in the browser');
  }

  await authRequest('/confirm-password-reset', 'POST', { oobCode, newPassword });
}

/**
 * 确认邮箱验证
 */
export async function confirmEmailVerification(oobCode: string): Promise<void> {
  if (!browser) {
    throw new Error('confirmEmailVerification can only be called in the browser');
  }

  await authRequest('/confirm-email-verification', 'POST', { oobCode });
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 获取当前用户
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!browser) {
    return null;
  }

  try {
    const result = await authRequest<{ user: User }>('/user', 'GET');
    AuthStore.setUser(result.user);
    return result.user;
  } catch {
    AuthStore.setUser(null);
    return null;
  }
}

/**
 * 检查邮箱是否已存在
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  if (!browser) {
    return false;
  }

  try {
    const response = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`, {
      credentials: 'include'
    });
    const data = await response.json();
    return data.exists || false;
  } catch {
    return false;
  }
}

/**
 * 等待认证状态初始化完成
 */
export function waitForAuthInit(): Promise<void> {
  return new Promise((resolve) => {
    const unsubscribe = authStore.authState.subscribe((state: string) => {
      if (state !== 'loading') {
        unsubscribe();
        resolve();
      }
    });
  });
}

/**
 * 检查用户是否已认证
 */
export function isAuthenticated(): boolean {
  return AuthStore.isAuthenticated();
}

/**
 * 获取当前用户（同步）
 */
export function getCurrentUserSync(): User | null {
  return AuthStore.getCurrentUser();
}

/**
 * 需要认证的装饰器函数
 */
export function requireAuth<T extends any[], R>(
  fn: (...args: T) => R,
  redirectTo: string = '/auth/signin'
): (...args: T) => R {
  return (...args: T): R => {
    if (!isAuthenticated()) {
      if (browser) {
        goto(redirectTo);
      }
      throw new Error('Authentication required');
    }
    return fn(...args);
  };
}

/**
 * 创建认证守卫
 */
export function createAuthGuard(redirectTo: string = '/auth/signin') {
  return {
    /**
     * 检查认证状态，未认证则重定向
     */
    check(): boolean {
      const authenticated = isAuthenticated();
      if (!authenticated && browser) {
        goto(redirectTo);
      }
      return authenticated;
    },

    /**
     * 等待认证状态并检查
     */
    async waitAndCheck(): Promise<boolean> {
      await waitForAuthInit();
      return this.check();
    },

    /**
     * 要求认证的高阶函数
     */
    require<T extends any[], R>(fn: (...args: T) => R): (...args: T) => R {
      return requireAuth(fn, redirectTo);
    }
  };
}
