/**
 * SvelteKit Hooks 集成
 * 提供简单的 hooks.server.ts 集成方案
 */

import type { Handle, RequestEvent } from '@sveltejs/kit';
import type {
  FirebaseConfig,
  SessionCookieConfig,
  AuthMiddlewareConfig,
  UserTransformer,
  ResponseTransformer,
  ActionPageConfig
} from '../types/index.js';
import { createAuthHandler, type AuthHandlerConfig } from '../server/handler.js';
import { authMiddleware, type AuthMiddlewareOptions } from '../server/middleware.js';
import { createActionPageHandler } from '../server/action.js';
import type { SessionManager } from '../server/session.js';

/**
 * 认证 Hook 配置
 */
export interface AuthHookConfig {
  /** Firebase 配置 */
  firebase: FirebaseConfig;
  /** 自定义会话管理器 */
  sessionManager?: SessionManager;
  /** 会话 Cookie 配置 */
  session?: SessionCookieConfig;
  /** 用户数据转换器 */
  userTransformer?: UserTransformer;
  /** 响应数据转换器 */
  responseTransformer?: ResponseTransformer;
  /** 中间件配置 */
  middleware?: AuthMiddlewareConfig;
  /** API 路径前缀，默认为 '/api/auth' */
  apiPrefix?: string;
  /** Action 页面路径前缀，默认为 '/auth/action' */
  actionPrefix?: string;
  /** Action 页面配置 */
  actionConfig?: ActionPageConfig;
  /** CORS 配置 */
  cors?: {
    origin?: string | string[];
    credentials?: boolean;
  };
}

/**
 * 创建认证 Hook
 */
export function createAuthHook(config: AuthHookConfig): Handle {
  const apiPrefix = config.apiPrefix || '/api/auth';
  const actionPrefix = config.actionPrefix || '/auth/action';

  // 创建认证处理器
  const authHandlerConfig: AuthHandlerConfig = {
    firebase: config.firebase,
    sessionManager: config.sessionManager,
    session: config.session,
    userTransformer: config.userTransformer,
    responseTransformer: config.responseTransformer,
    cors: config.cors
  };
  const handleAuth = createAuthHandler(authHandlerConfig);

  // 创建 Action 页面处理器
  const handleAction = createActionPageHandler(config.firebase, config.actionConfig);

  // 创建认证中间件
  const middlewareOptions: AuthMiddlewareOptions = {
    firebase: config.firebase,
    sessionManager: config.sessionManager,
    session: config.session,
    config: config.middleware
  };
  const handleMiddleware = authMiddleware(middlewareOptions);

  // 返回组合的 Handle 函数
  return async ({ event, resolve }) => {
    const { url } = event;

    // 检查是否为认证 API 请求
    if (url.pathname.startsWith(apiPrefix)) {
      return handleAuth(event, apiPrefix);
    }

    // 检查是否为 Action 页面请求
    if (url.pathname.startsWith(actionPrefix)) {
      return handleAction(event);
    }

    // 对于非 API 请求，应用认证中间件
    return handleMiddleware({ event, resolve });
  };
}

/**
 * 创建简单的认证 Hook（便捷函数）
 */
export function createSimpleAuthHook(
  firebaseConfig: FirebaseConfig,
  options?: {
    protectedPaths?: string[];
    loginPath?: string;
    apiPrefix?: string;
    cors?: {
      origin?: string | string[];
      credentials?: boolean;
    };
  }
): Handle {
  return createAuthHook({
    firebase: firebaseConfig,
    middleware: {
      protectedPaths: options?.protectedPaths || ['/dashboard', '/profile'],
      publicPaths: ['/auth', '/api/auth', '/', '/about'],
      loginPath: options?.loginPath || '/auth/signin',
      redirectPath: '/dashboard',
      autoRefresh: true
    },
    apiPrefix: options?.apiPrefix,
    cors: options?.cors
  });
}

/**
 * 创建仅 API 的认证 Hook
 */
export function createApiOnlyAuthHook(
  firebaseConfig: FirebaseConfig,
  options?: {
    apiPrefix?: string;
    cors?: {
      origin?: string | string[];
      credentials?: boolean;
    };
  }
): Handle {
  const apiPrefix = options?.apiPrefix || '/api/auth';

  const authHandlerConfig: AuthHandlerConfig = {
    firebase: firebaseConfig,
    cors: options?.cors
  };
  const handleAuth = createAuthHandler(authHandlerConfig);

  return async ({ event, resolve }) => {
    const { url } = event;

    // 只处理认证 API 请求
    if (url.pathname.startsWith(apiPrefix)) {
      return handleAuth(event, apiPrefix);
    }

    // 其他请求正常处理
    return resolve(event);
  };
}

/**
 * 创建仅中间件的认证 Hook
 */
export function createMiddlewareOnlyAuthHook(
  firebaseConfig: FirebaseConfig,
  middlewareConfig?: AuthMiddlewareConfig
): Handle {
  const middlewareOptions: AuthMiddlewareOptions = {
    firebase: firebaseConfig,
    config: middlewareConfig
  };

  return authMiddleware(middlewareOptions);
}

/**
 * 组合多个 Handle 函数
 */
export function sequence(...handlers: Handle[]): Handle {
  return async ({ event, resolve }) => {
    let currentResolve = resolve;

    // 从后往前构建处理链
    for (let i = handlers.length - 1; i >= 0; i--) {
      const handler = handlers[i];
      const nextResolve = currentResolve;

      currentResolve = async (event) => {
        return handler({
          event,
          resolve: nextResolve
        });
      };
    }

    return currentResolve(event);
  };
}

/**
 * 创建条件 Handle
 */
export function createConditionalHandle(
  condition: (event: RequestEvent) => boolean,
  handler: Handle,
  fallback?: Handle
): Handle {
  return async ({ event, resolve }) => {
    if (condition(event)) {
      return handler({ event, resolve });
    } else if (fallback) {
      return fallback({ event, resolve });
    } else {
      return resolve(event);
    }
  };
}

/**
 * 创建路径匹配的 Handle
 */
export function createPathHandle(
  pathPattern: string | RegExp,
  handler: Handle
): Handle {
  const matcher = typeof pathPattern === 'string'
    ? (path: string) => path.startsWith(pathPattern)
    : (path: string) => pathPattern.test(path);

  return createConditionalHandle(
    (event) => matcher(event.url.pathname),
    handler
  );
}
