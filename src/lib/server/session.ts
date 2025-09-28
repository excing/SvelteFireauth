/**
 * 服务端会话管理接口
 * 允许外部实现自定义的会话管理策略
 */

import type {
  User,
  SessionCookieConfig
} from '../types/index.js';

/**
 * 会话数据接口
 */
interface SessionData {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName?: string;
  photoURL?: string;
  accessToken: string;
  refreshToken: string;
  expirationTime: number;
  createdAt: number;
}

/**
 * 会话管理器接口
 * 外部可以实现此接口来提供自定义的会话管理
 */
export interface SessionManager {
  /**
   * 创建会话
   * @param user 用户信息
   * @returns 会话标识符或 cookie 字符串
   */
  createSession(user: User): Promise<string> | string;

  /**
   * 验证会话
   * @param sessionId 会话标识符
   * @returns 用户信息，如果会话无效则返回 null
   */
  verifySession(sessionId: string): Promise<User | null> | User | null;

  /**
   * 删除会话
   * @param sessionId 会话标识符
   * @returns 清除会话的 cookie 字符串或其他清除指令
   */
  clearSession(sessionId?: string): Promise<string> | string;

  /**
   * 刷新会话（可选）
   * @param sessionId 当前会话标识符
   * @returns 新的会话标识符
   */
  refreshSession?(sessionId: string): Promise<string> | string;
}

/**
 * 默认会话 Cookie 配置
 */
export const DEFAULT_SESSION_CONFIG: Required<SessionCookieConfig> = {
  name: '__session',
  maxAge: 5 * 24 * 60 * 60, // 5 天
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'lax'
};

/**
 * 默认的基于 Cookie 的会话管理器实现
 * 这是一个简单的参考实现，生产环境建议使用更安全的方案
 */
export class DefaultCookieSessionManager implements SessionManager {
  private config: Required<SessionCookieConfig>;

  constructor(sessionConfig?: SessionCookieConfig) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...sessionConfig };
  }

  createSession(user: User): string {
    const sessionData = {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      displayName: user.displayName,
      photoURL: user.photoURL,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
      expirationTime: user.expirationTime || Date.now() + (user.expiresIn || 3600) * 1000,
      createdAt: Date.now()
    };

    // 简单的 Base64 编码（生产环境应使用 JWT 或加密）
    const encodedData = Buffer.from(JSON.stringify(sessionData)).toString('base64');

    return this.formatCookie(encodedData);
  }

  verifySession(cookieValue: string): User | null {
    try {
      // 解析 Cookie 值
      const sessionData = this.parseSessionData(cookieValue);
      if (!sessionData) {
        return null;
      }

      // 检查是否过期（简单检查，不刷新令牌）
      if (Date.now() > sessionData.expirationTime) {
        return null;
      }

      return this.sessionDataToUser(sessionData);
    } catch {
      return null;
    }
  }

  clearSession(): string {
    return `${this.config.name}=; Path=${this.config.path}; Max-Age=0; HttpOnly; SameSite=${this.config.sameSite}${this.config.secure ? '; Secure' : ''}`;
  }

  /**
   * 删除会话 Cookie
   */
  clearSessionCookie(): string {
    return `${this.config.name}=; Path=${this.config.path}; Max-Age=0; HttpOnly; SameSite=${this.config.sameSite}${this.config.secure ? '; Secure' : ''}`;
  }

  /**
   * 格式化 Cookie 字符串
   */
  private formatCookie(value: string): string {
    const parts = [
      `${this.config.name}=${value}`,
      `Path=${this.config.path}`,
      `Max-Age=${this.config.maxAge}`,
      'HttpOnly',
      `SameSite=${this.config.sameSite}`
    ];

    if (this.config.secure) {
      parts.push('Secure');
    }

    return parts.join('; ');
  }

  /**
   * 解析会话数据
   */
  private parseSessionData(cookieValue: string): SessionData | null {
    try {
      // 从 Cookie 字符串中提取值
      const match = cookieValue.match(new RegExp(`${this.config.name}=([^;]+)`));
      if (!match) {
        return null;
      }

      const encodedData = match[1];
      const decodedData = Buffer.from(encodedData, 'base64').toString('utf-8');
      return JSON.parse(decodedData);
    } catch {
      return null;
    }
  }

  /**
   * 将会话数据转换为用户对象
   */
  private sessionDataToUser(sessionData: SessionData): User {
    return {
      uid: sessionData.uid,
      email: sessionData.email,
      emailVerified: sessionData.emailVerified,
      displayName: sessionData.displayName,
      photoURL: sessionData.photoURL,
      accessToken: sessionData.accessToken,
      refreshToken: sessionData.refreshToken,
      expirationTime: sessionData.expirationTime,
      expiresIn: Math.floor((sessionData.expirationTime - Date.now()) / 1000),
      createdAt: new Date(sessionData.createdAt).toISOString(),
      isAnonymous: false
    };
  }

  /**
   * 获取 Cookie 配置
   */
  getConfig(): Required<SessionCookieConfig> {
    return { ...this.config };
  }
}

/**
 * 便捷函数：创建默认的 Cookie 会话管理器
 */
export function createDefaultSessionManager(sessionConfig?: SessionCookieConfig): SessionManager {
  return new DefaultCookieSessionManager(sessionConfig);
}

/**
 * 便捷函数：清除会话 Cookie
 */
export function clearSessionCookie(sessionConfig?: SessionCookieConfig): string {
  const config = { ...DEFAULT_SESSION_CONFIG, ...sessionConfig };
  return `${config.name}=; Path=${config.path}; Max-Age=0; HttpOnly; SameSite=${config.sameSite}${config.secure ? '; Secure' : ''}`;
}
