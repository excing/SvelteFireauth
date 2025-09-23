/**
 * 工具函数和错误处理
 * 提供 token 验证、错误处理等辅助功能
 */

import type { 
  User, 
  FirebaseAuthError, 
  FirebaseErrorCode,
  FirebaseConfig 
} from '../types/index.js';
import { FirebaseAuthClient } from '../core/client.js';

// ============================================================================
// Token 相关工具函数
// ============================================================================

/**
 * 解析 JWT Token（简单解析，不验证签名）
 */
export function parseToken(token: string): any | null {
  try {
    if (!token) {
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    return null;
  }
}

/**
 * 检查 Token 是否过期
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = parseToken(token);
    const exp = payload.exp;
    
    if (!exp) {
      return true;
    }

    // exp 是以秒为单位的时间戳
    return Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}

/**
 * 获取 Token 过期时间
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const payload = parseToken(token);
    const exp = payload.exp;
    
    if (!exp) {
      return null;
    }

    return new Date(exp * 1000);
  } catch {
    return null;
  }
}

/**
 * 获取 Token 剩余有效时间（秒）
 */
export function getTokenRemainingTime(token: string): number {
  try {
    const payload = parseToken(token);
    const exp = payload.exp;
    
    if (!exp) {
      return 0;
    }

    const remaining = exp * 1000 - Date.now();
    return Math.max(0, Math.floor(remaining / 1000));
  } catch {
    return 0;
  }
}

/**
 * 验证 Token 格式
 */
export function isValidTokenFormat(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  const parts = token.split('.');
  return parts.length === 3;
}

/**
 * 验证 ID Token
 */
export async function validateToken(
  token: string,
  firebaseConfig: FirebaseConfig
): Promise<boolean> {
  if (!isValidTokenFormat(token)) {
    return false;
  }

  if (isTokenExpired(token)) {
    return false;
  }

  try {
    const client = new FirebaseAuthClient(firebaseConfig);
    return await client.verifyIdToken(token);
  } catch {
    return false;
  }
}

// ============================================================================
// 错误处理
// ============================================================================

/**
 * Firebase 错误代码映射
 */
const ERROR_MESSAGES: Record<FirebaseErrorCode, string> = {
  EMAIL_EXISTS: '该邮箱地址已被注册',
  EMAIL_NOT_FOUND: '未找到该邮箱地址对应的账户',
  INVALID_EMAIL: '邮箱地址格式无效',
  INVALID_PASSWORD: '密码错误',
  INVALID_ID_TOKEN: '认证令牌无效，请重新登录',
  USER_DISABLED: '该账户已被禁用',
  USER_NOT_FOUND: '未找到该用户',
  WEAK_PASSWORD: '密码强度不足，至少需要6个字符',
  EXPIRED_OOB_CODE: '验证码已过期',
  INVALID_OOB_CODE: '验证码无效',
  OPERATION_NOT_ALLOWED: '该操作未被允许',
  CREDENTIAL_TOO_OLD_LOGIN_AGAIN: '认证信息过期，请重新登录',
  TOKEN_EXPIRED: '令牌已过期，请重新登录',
  MISSING_EMAIL: '请输入邮箱地址',
  MISSING_PASSWORD: '请输入密码',
  MISSING_ID_TOKEN: '缺少认证令牌',
  NETWORK_ERROR: '网络连接错误，请检查网络设置',
  UNKNOWN_ERROR: '发生未知错误，请稍后重试'
};

/**
 * 创建 Firebase 错误对象
 */
export function createFirebaseError(
  code: FirebaseErrorCode,
  customMessage?: string,
  originalError?: any
): FirebaseAuthError {
  const message = customMessage || ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
  const error = new Error(message) as FirebaseAuthError;
  error.code = code;
  error.details = originalError;
  return error;
}

/**
 * 处理 Firebase 错误
 */
export function handleFirebaseError(error: any): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return ERROR_MESSAGES[error.code as FirebaseErrorCode] || ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    const code = mapErrorMessageToCode(error.message);
    return ERROR_MESSAGES[code] || ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * 将错误消息映射到错误代码
 */
function mapErrorMessageToCode(message: string): FirebaseErrorCode {
  const upperMessage = message.toUpperCase();
  
  if (upperMessage.includes('EMAIL_EXISTS')) return 'EMAIL_EXISTS';
  if (upperMessage.includes('EMAIL_NOT_FOUND')) return 'EMAIL_NOT_FOUND';
  if (upperMessage.includes('INVALID_EMAIL')) return 'INVALID_EMAIL';
  if (upperMessage.includes('INVALID_PASSWORD')) return 'INVALID_PASSWORD';
  if (upperMessage.includes('INVALID_ID_TOKEN')) return 'INVALID_ID_TOKEN';
  if (upperMessage.includes('USER_DISABLED')) return 'USER_DISABLED';
  if (upperMessage.includes('USER_NOT_FOUND')) return 'USER_NOT_FOUND';
  if (upperMessage.includes('WEAK_PASSWORD')) return 'WEAK_PASSWORD';
  if (upperMessage.includes('EXPIRED_OOB_CODE')) return 'EXPIRED_OOB_CODE';
  if (upperMessage.includes('INVALID_OOB_CODE')) return 'INVALID_OOB_CODE';
  if (upperMessage.includes('OPERATION_NOT_ALLOWED')) return 'OPERATION_NOT_ALLOWED';
  if (upperMessage.includes('CREDENTIAL_TOO_OLD')) return 'CREDENTIAL_TOO_OLD_LOGIN_AGAIN';
  if (upperMessage.includes('TOKEN_EXPIRED')) return 'TOKEN_EXPIRED';
  if (upperMessage.includes('NETWORK')) return 'NETWORK_ERROR';
  
  return 'UNKNOWN_ERROR';
}

/**
 * 获取用户友好的错误消息
 */
export function getErrorMessage(error: any): string {
  return handleFirebaseError(error);
}

// ============================================================================
// 验证工具函数
// ============================================================================

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证密码强度
 */
export function isValidPassword(password: string): boolean {
  if (!password || password.length < 6) {
    return false;
  }

  // 检查是否包含数字和字母
  const hasNumber = /\d/.test(password);
  const hasLetter = /[a-zA-Z]/.test(password);

  // 纯数字或纯字母的密码被认为是弱密码
  if (!hasNumber || !hasLetter) {
    return false;
  }

  return true;
}

/**
 * 验证显示名称
 */
export function isValidDisplayName(displayName: string): boolean {
  return displayName.trim().length > 0 && displayName.length <= 50;
}

/**
 * 验证 URL 格式
 */
export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// 格式化工具函数
// ============================================================================

/**
 * 格式化时间戳
 */
export function formatTimestamp(timestamp: string | number): string {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

/**
 * 格式化相对时间
 */
export function formatRelativeTime(timestamp: string | number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  return '刚刚';
}

/**
 * 生成用户头像 URL（如果没有头像）
 */
export function generateAvatarURL(emailOrUser: string | User): string {
  let email: string;

  if (typeof emailOrUser === 'string') {
    email = emailOrUser;
  } else {
    if (emailOrUser.photoURL) {
      return emailOrUser.photoURL;
    }
    email = emailOrUser.email;
  }

  // 使用 Gravatar 或其他头像服务
  const hash = btoa(email.toLowerCase().trim());
  return `https://www.gravatar.com/avatar/${hash}?d=identicon&s=200`;
}

/**
 * 获取用户显示名称
 */
export function getUserDisplayName(user: User | null): string {
  if (!user) {
    return '未知用户';
  }

  if (user.displayName) {
    return user.displayName;
  }

  // 返回完整邮箱地址
  return user.email;
}

// ============================================================================
// 安全工具函数
// ============================================================================

/**
 * 生成随机字符串
 */
export function generateRandomString(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 简单的哈希函数（用于非敏感数据）
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString(36);
}

/**
 * 掩码邮箱地址
 */
export function maskEmail(email: string): string {
  const [username, domain] = email.split('@');
  if (username.length <= 2) {
    return `${username[0]}***@${domain}`;
  }
  return `${username.slice(0, 2)}***@${domain}`;
}

/**
 * 检查是否在浏览器环境
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * 安全的 JSON 解析
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}
