/**
 * 客户端认证状态管理
 * 使用 Svelte stores 提供响应式的用户状态管理
 */

import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import type { 
  User, 
  AuthState, 
  AuthStateChangeEvent, 
  AuthEvent, 
  AuthEventType 
} from '../types/index.js';

// ============================================================================
// 核心 Stores
// ============================================================================

/**
 * 用户信息 store
 */
export const user = writable<User | null>(null);

/**
 * 认证状态 store
 */
export const authState = writable<AuthState>('loading');

/**
 * 加载状态 store
 */
export const loading = writable<boolean>(false);

/**
 * 错误信息 store
 */
export const error = writable<string | null>(null);

// ============================================================================
// 派生 Stores
// ============================================================================

/**
 * 是否已认证
 */
export const authenticated = derived(
  [user, authState],
  ([$user, $authState]) => $authState === 'authenticated' && !!$user
);

/**
 * 是否为匿名用户
 */
export const isAnonymous = derived(
  user,
  ($user) => $user?.isAnonymous ?? false
);

/**
 * 用户邮箱是否已验证
 */
export const emailVerified = derived(
  user,
  ($user) => $user?.emailVerified ?? false
);

/**
 * 用户显示名称
 */
export const displayName = derived(
  user,
  ($user) => $user?.displayName ?? null
);

/**
 * 用户头像 URL
 */
export const photoURL = derived(
  user,
  ($user) => $user?.photoURL ?? null
);

/**
 * 访问令牌
 */
export const accessToken = derived(
  user,
  ($user) => $user?.accessToken ?? null
);

/**
 * 令牌是否即将过期（5分钟内）
 */
export const tokenExpiringSoon = derived(
  user,
  ($user) => {
    if (!$user?.expirationTime) return false;
    const fiveMinutes = 5 * 60 * 1000;
    return ($user.expirationTime - Date.now()) < fiveMinutes;
  }
);

// ============================================================================
// 事件系统
// ============================================================================

/**
 * 认证事件 store
 */
export const authEvents = writable<AuthEvent[]>([]);

/**
 * 添加认证事件
 */
function addAuthEvent(type: AuthEventType, user?: User | null, data?: any) {
  const event: AuthEvent = {
    type,
    user,
    data,
    timestamp: Date.now()
  };

  authEvents.update(events => [...events.slice(-9), event]); // 保留最近 10 个事件
}

/**
 * 认证状态变化事件
 */
export const authStateChange = derived(
  [user, authState],
  ([$user, $authState], set) => {
    const event: AuthStateChangeEvent = {
      user: $user,
      state: $authState
    };
    set(event);
  }
);

// ============================================================================
// Store 操作函数
// ============================================================================

/**
 * 认证 store 管理器
 */
export class AuthStore {
  /**
   * 设置用户信息
   */
  static setUser(newUser: User | null) {
    user.set(newUser);
    authState.set(newUser ? 'authenticated' : 'unauthenticated');
    
    if (newUser) {
      addAuthEvent('signIn', newUser);
      // 在浏览器环境中保存到 localStorage
      if (browser) {
        try {
          localStorage.setItem('svelteFireAuth:user', JSON.stringify(newUser));
        } catch (e) {
          console.warn('Failed to save user to localStorage:', e);
        }
      }
    } else {
      addAuthEvent('signOut');
      // 清除 localStorage
      if (browser) {
        try {
          localStorage.removeItem('svelteFireAuth:user');
        } catch (e) {
          console.warn('Failed to remove user from localStorage:', e);
        }
      }
    }
  }

  /**
   * 更新用户信息
   */
  static updateUser(updates: Partial<User>) {
    user.update(currentUser => {
      if (!currentUser) return null;
      
      const updatedUser = { ...currentUser, ...updates };
      
      // 更新 localStorage
      if (browser) {
        try {
          localStorage.setItem('svelteFireAuth:user', JSON.stringify(updatedUser));
        } catch (e) {
          console.warn('Failed to update user in localStorage:', e);
        }
      }
      
      addAuthEvent('profileUpdate', updatedUser, updates);
      return updatedUser;
    });
  }

  /**
   * 设置加载状态
   */
  static setLoading(isLoading: boolean) {
    loading.set(isLoading);
  }

  /**
   * 设置错误信息
   */
  static setError(errorMessage: string | null) {
    error.set(errorMessage);
  }

  /**
   * 清除错误信息
   */
  static clearError() {
    error.set(null);
  }

  /**
   * 初始化认证状态
   */
  static async initialize() {
    if (!browser) return;

    authState.set('loading');
    
    try {
      // 尝试从 localStorage 恢复用户信息
      const savedUser = localStorage.getItem('svelteFireAuth:user');
      if (savedUser) {
        const parsedUser: User = JSON.parse(savedUser);
        
        // 检查令牌是否过期
        if (parsedUser.expirationTime && Date.now() > parsedUser.expirationTime) {
          // 令牌已过期，尝试刷新
          await AuthStore.refreshToken();
        } else {
          // 验证用户状态
          const isValid = await AuthStore.validateCurrentUser();
          if (!isValid) {
            AuthStore.setUser(null);
          } else {
            AuthStore.setUser(parsedUser);
          }
        }
      } else {
        // 尝试从服务器获取用户信息
        await AuthStore.fetchCurrentUser();
      }
    } catch (e) {
      console.warn('Failed to initialize auth state:', e);
      AuthStore.setUser(null);
    }
  }

  /**
   * 从服务器获取当前用户
   */
  static async fetchCurrentUser(): Promise<User | null> {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.user) {
          AuthStore.setUser(data.data.user);
          return data.data.user;
        }
      }
      
      AuthStore.setUser(null);
      return null;
    } catch (e) {
      console.warn('Failed to fetch current user:', e);
      AuthStore.setUser(null);
      return null;
    }
  }

  /**
   * 验证当前用户
   */
  static async validateCurrentUser(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * 刷新令牌
   */
  static async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.user) {
          AuthStore.setUser(data.data.user);
          addAuthEvent('tokenRefresh', data.data.user);
          return true;
        }
      }
      
      AuthStore.setUser(null);
      return false;
    } catch (e) {
      console.warn('Failed to refresh token:', e);
      AuthStore.setUser(null);
      return false;
    }
  }

  /**
   * 清除所有认证数据
   */
  static clear() {
    user.set(null);
    authState.set('unauthenticated');
    loading.set(false);
    error.set(null);
    authEvents.set([]);
    
    if (browser) {
      try {
        localStorage.removeItem('svelteFireAuth:user');
      } catch (e) {
        console.warn('Failed to clear localStorage:', e);
      }
    }
  }

  /**
   * 获取当前用户（同步）
   */
  static getCurrentUser(): User | null {
    return get(user);
  }

  /**
   * 获取当前认证状态（同步）
   */
  static getAuthState(): AuthState {
    return get(authState);
  }

  /**
   * 检查是否已认证（同步）
   */
  static isAuthenticated(): boolean {
    return get(authenticated);
  }
}

// ============================================================================
// 自动初始化
// ============================================================================

// 在浏览器环境中自动初始化
if (browser) {
  AuthStore.initialize();
}

// ============================================================================
// 导出主要 store
// ============================================================================

/**
 * 主要的认证 store 对象
 */
export const authStore = {
  // 核心状态
  user,
  authState,
  loading,
  error,
  
  // 派生状态
  authenticated,
  isAnonymous,
  emailVerified,
  displayName,
  photoURL,
  accessToken,
  tokenExpiringSoon,
  
  // 事件
  authEvents,
  authStateChange,
  
  // 操作方法
  setUser: AuthStore.setUser,
  updateUser: AuthStore.updateUser,
  setLoading: AuthStore.setLoading,
  setError: AuthStore.setError,
  clearError: AuthStore.clearError,
  initialize: AuthStore.initialize,
  fetchCurrentUser: AuthStore.fetchCurrentUser,
  validateCurrentUser: AuthStore.validateCurrentUser,
  refreshToken: AuthStore.refreshToken,
  clear: AuthStore.clear,
  getCurrentUser: AuthStore.getCurrentUser,
  getAuthState: AuthStore.getAuthState,
  isAuthenticated: AuthStore.isAuthenticated
};
