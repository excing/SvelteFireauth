/**
 * 服务端会话管理
 * 处理 session cookies 的创建、验证和管理
 */

import type { 
  User, 
  SessionCookieConfig, 
  FirebaseConfig,
  FirebaseAuthError 
} from '../types/index.js';
import { FirebaseAuthClient } from '../core/client.js';

/**
 * 默认会话 Cookie 配置
 */
const DEFAULT_SESSION_CONFIG: Required<SessionCookieConfig> = {
  name: '__session',
  maxAge: 5 * 24 * 60 * 60, // 5 天
  path: '/',
  secure: true,
  httpOnly: true,
  sameSite: 'lax'
};

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
 * 会话管理器类
 */
export class SessionManager {
  private config: Required<SessionCookieConfig>;
  private firebaseClient: FirebaseAuthClient;

  constructor(
    firebaseConfig: FirebaseConfig,
    sessionConfig?: SessionCookieConfig
  ) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...sessionConfig };
    this.firebaseClient = new FirebaseAuthClient(firebaseConfig);
  }

  /**
   * 创建会话 Cookie
   */
  createSessionCookie(user: User): string {
    const sessionData: SessionData = {
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

  /**
   * 验证会话 Cookie
   */
  async verifySessionCookie(cookieValue: string): Promise<User | null> {
    try {
      // 解析 Cookie 值
      const sessionData = this.parseSessionData(cookieValue);
      if (!sessionData) {
        return null;
      }

      // 检查是否过期
      if (Date.now() > sessionData.expirationTime) {
        // 尝试刷新令牌
        try {
          const refreshResponse = await this.firebaseClient.refreshToken(sessionData.refreshToken);
          
          // 更新会话数据
          sessionData.accessToken = refreshResponse.id_token;
          sessionData.refreshToken = refreshResponse.refresh_token;
          sessionData.expirationTime = Date.now() + parseInt(refreshResponse.expires_in) * 1000;
          
          return this.sessionDataToUser(sessionData);
        } catch {
          return null;
        }
      }

      // 验证访问令牌
      const isValid = await this.firebaseClient.verifyIdToken(sessionData.accessToken);
      if (!isValid) {
        return null;
      }

      return this.sessionDataToUser(sessionData);
    } catch {
      return null;
    }
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
 * 创建会话 Cookie（便捷函数）
 */
export function createSessionCookie(
  user: User,
  firebaseConfig: FirebaseConfig,
  sessionConfig?: SessionCookieConfig
): string {
  const manager = new SessionManager(firebaseConfig, sessionConfig);
  return manager.createSessionCookie(user);
}

/**
 * 验证会话 Cookie（便捷函数）
 */
export async function verifySessionCookie(
  cookieValue: string,
  firebaseConfig: FirebaseConfig,
  sessionConfig?: SessionCookieConfig
): Promise<User | null> {
  const manager = new SessionManager(firebaseConfig, sessionConfig);
  return manager.verifySessionCookie(cookieValue);
}

/**
 * 清除会话 Cookie（便捷函数）
 */
export function clearSessionCookie(sessionConfig?: SessionCookieConfig): string {
  const config = { ...DEFAULT_SESSION_CONFIG, ...sessionConfig };
  return `${config.name}=; Path=${config.path}; Max-Age=0; HttpOnly; SameSite=${config.sameSite}${config.secure ? '; Secure' : ''}`;
}
