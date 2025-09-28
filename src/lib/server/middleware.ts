/**
 * 服务端认证中间件
 * 提供路由保护和自动认证检查功能
 */

import type { Handle, RequestEvent } from '@sveltejs/kit';
import type { 
  FirebaseConfig, 
  SessionCookieConfig, 
  AuthMiddlewareConfig, 
  User 
} from '../types/index.js';
import type { SessionManager } from './session.js';
import { createDefaultSessionManager } from './session.js';

/**
 * 认证中间件配置
 */
export interface AuthMiddlewareOptions {
  firebase: FirebaseConfig;
  sessionManager?: SessionManager;
  session?: SessionCookieConfig;
  config?: AuthMiddlewareConfig;
}

/**
 * 默认中间件配置
 */
const DEFAULT_MIDDLEWARE_CONFIG: Required<AuthMiddlewareConfig> = {
  protectedPaths: ['/dashboard', '/profile', '/admin'],
  publicPaths: ['/auth', '/api/auth', '/', '/about', '/contact'],
  loginPath: '/auth/signin',
  redirectPath: '/dashboard',
  autoRefresh: true
};

/**
 * 认证中间件类
 */
export class AuthMiddleware {
  private sessionManager: SessionManager;
  private config: Required<AuthMiddlewareConfig>;

  constructor(options: AuthMiddlewareOptions) {
    this.sessionManager = options.sessionManager || createDefaultSessionManager(options.session);
    this.config = { ...DEFAULT_MIDDLEWARE_CONFIG, ...options.config };
  }

  /**
   * 创建 SvelteKit Handle 函数
   */
  createHandle(): Handle {
    return async ({ event, resolve }) => {
      // 添加认证信息到 locals
      await this.addAuthToLocals(event);

      // 检查路由保护
      const redirectResponse = await this.checkRouteProtection(event);
      if (redirectResponse) {
        return redirectResponse;
      }

      // 继续处理请求
      return resolve(event);
    };
  }

  /**
   * 添加认证信息到 event.locals
   */
  private async addAuthToLocals(event: RequestEvent): Promise<void> {
    try {
      const cookieHeader = event.request.headers.get('cookie');
      if (!cookieHeader) {
        event.locals.user = null;
        event.locals.authenticated = false;
        return;
      }

      const user = await this.sessionManager.verifySession(cookieHeader);
      event.locals.user = user;
      event.locals.authenticated = !!user;

      // 如果启用自动刷新且令牌即将过期，设置刷新标志
      if (user && this.config.autoRefresh && this.shouldRefreshToken(user)) {
        event.locals.shouldRefreshToken = true;
      }
    } catch (error) {
      event.locals.user = null;
      event.locals.authenticated = false;
    }
  }

  /**
   * 检查路由保护
   */
  private async checkRouteProtection(event: RequestEvent): Promise<Response | null> {
    const { url } = event;
    const pathname = url.pathname;

    // 检查是否为公开路径
    if (this.isPublicPath(pathname)) {
      return null;
    }

    // 检查是否为受保护路径
    if (this.isProtectedPath(pathname)) {
      if (!event.locals.authenticated) {
        // 未认证用户访问受保护路径，重定向到登录页
        const loginUrl = new URL(this.config.loginPath, url.origin);
        loginUrl.searchParams.set('redirect', pathname);
        return new Response(null, {
          status: 302,
          headers: {
            Location: loginUrl.toString()
          }
        });
      }
    }

    return null;
  }

  /**
   * 检查是否为公开路径
   */
  private isPublicPath(pathname: string): boolean {
    return this.config.publicPaths.some(path => {
      if (path.endsWith('*')) {
        return pathname.startsWith(path.slice(0, -1));
      }
      return pathname === path || pathname.startsWith(path + '/');
    });
  }

  /**
   * 检查是否为受保护路径
   */
  private isProtectedPath(pathname: string): boolean {
    return this.config.protectedPaths.some(path => {
      if (path.endsWith('*')) {
        return pathname.startsWith(path.slice(0, -1));
      }
      return pathname === path || pathname.startsWith(path + '/');
    });
  }

  /**
   * 检查是否应该刷新令牌
   */
  private shouldRefreshToken(user: User): boolean {
    if (!user.expirationTime) {
      return false;
    }

    // 如果令牌在 5 分钟内过期，则需要刷新
    const fiveMinutes = 5 * 60 * 1000;
    return (user.expirationTime - Date.now()) < fiveMinutes;
  }

  /**
   * 获取配置
   */
  getConfig(): Required<AuthMiddlewareConfig> {
    return { ...this.config };
  }
}

/**
 * 创建认证中间件（便捷函数）
 */
export function authMiddleware(options: AuthMiddlewareOptions): Handle {
  const middleware = new AuthMiddleware(options);
  return middleware.createHandle();
}

/**
 * 创建简单的认证检查中间件
 */
export function createSimpleAuthMiddleware(
  firebaseConfig: FirebaseConfig,
  protectedPaths: string[] = ['/dashboard', '/profile'],
  loginPath: string = '/auth/signin'
): Handle {
  return authMiddleware({
    firebase: firebaseConfig,
    config: {
      protectedPaths,
      publicPaths: ['/auth', '/api/auth', '/', '/about'],
      loginPath,
      redirectPath: '/dashboard',
      autoRefresh: true
    }
  });
}

/**
 * 扩展 SvelteKit 的 App.Locals 接口
 */
declare global {
  namespace App {
    interface Locals {
      user: User | null;
      authenticated: boolean;
      shouldRefreshToken?: boolean;
    }
  }
}
