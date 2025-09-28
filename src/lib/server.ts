// SvelteFireAuth - 服务端导出
// 仅用于服务端环境

// 类型定义
export type * from './types/index.js';

// 核心 API 客户端
export { FirebaseAuthClient } from './core/client.js';

// 服务端功能
export { createAuthHandler, type AuthHandlerConfig } from './server/handler.js';
export { authMiddleware, type AuthMiddlewareOptions } from './server/middleware.js';
export {
  type SessionManager,
  DefaultCookieSessionManager,
  createDefaultSessionManager,
  clearSessionCookie,
  DEFAULT_SESSION_CONFIG
} from './server/session.js';
export { ActionPageHandler, createActionPageHandler } from './server/action.js';

// SvelteKit 集成
export { createAuthHook, createSimpleAuthHook, type AuthHookConfig } from './sveltekit/hooks.js';
export { 
  protectRoute,
  protectVerifiedRoute,
  protectAdminRoute,
  redirectAuthenticated,
  createRoleBasedProtection,
  createPermissionBasedProtection,
  createTimeBasedProtection,
  createIPBasedProtection,
  createDeviceBasedProtection,
  createConditionalProtection,
  createPathBasedProtection,
  combineProtections
} from './sveltekit/protect.js';

// 工具函数
export { 
  validateToken, 
  parseToken, 
  isTokenExpired,
  createFirebaseError,
  handleFirebaseError,
  isValidEmail,
  isValidPassword,
  formatTimestamp,
  formatRelativeTime,
  generateAvatarURL,
  getUserDisplayName
} from './utils/index.js';
