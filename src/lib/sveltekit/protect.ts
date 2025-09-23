/**
 * SvelteKit 路由保护
 * 提供页面级别的认证保护功能
 */

import { redirect } from '@sveltejs/kit';
import type { ServerLoadEvent } from '@sveltejs/kit';
import type { User } from '../types/index.js';

/**
 * 路由保护配置
 */
export interface RouteProtectionConfig {
  /** 登录页面路径 */
  loginPath?: string;
  /** 登录后重定向路径 */
  redirectPath?: string;
  /** 是否允许未验证邮箱的用户访问 */
  allowUnverifiedEmail?: boolean;
  /** 自定义认证检查函数 */
  customCheck?: (user: User | null) => boolean;
  /** 自定义重定向逻辑 */
  customRedirect?: (user: User | null, url: URL) => string | null;
}

/**
 * 默认保护配置
 */
const DEFAULT_PROTECTION_CONFIG: Required<RouteProtectionConfig> = {
  loginPath: '/auth/signin',
  redirectPath: '/dashboard',
  allowUnverifiedEmail: true,
  customCheck: () => true,
  customRedirect: () => null
};

/**
 * 保护页面加载函数
 */
export function protectRoute(
  config?: RouteProtectionConfig
): (event: ServerLoadEvent) => Promise<void> {
  const finalConfig = { ...DEFAULT_PROTECTION_CONFIG, ...config };

  return async (event: ServerLoadEvent) => {
    const { locals, url } = event;
    const user = locals.user as User | null;

    // 检查用户是否已认证
    if (!user) {
      const loginUrl = new URL(finalConfig.loginPath, url.origin);
      loginUrl.searchParams.set('redirect', url.pathname + url.search);
      throw redirect(302, loginUrl.toString());
    }

    // 检查邮箱验证（如果需要）
    if (!finalConfig.allowUnverifiedEmail && !user.emailVerified) {
      throw redirect(302, '/auth/verify-email');
    }

    // 自定义认证检查
    if (!finalConfig.customCheck(user)) {
      const customRedirectPath = finalConfig.customRedirect(user, url);
      if (customRedirectPath) {
        throw redirect(302, customRedirectPath);
      } else {
        throw redirect(302, finalConfig.loginPath);
      }
    }
  };
}

/**
 * 保护需要邮箱验证的路由
 */
export function protectVerifiedRoute(
  config?: Omit<RouteProtectionConfig, 'allowUnverifiedEmail'>
): (event: ServerLoadEvent) => Promise<void> {
  return protectRoute({
    ...config,
    allowUnverifiedEmail: false
  });
}

/**
 * 保护管理员路由
 */
export function protectAdminRoute(
  config?: RouteProtectionConfig
): (event: ServerLoadEvent) => Promise<void> {
  return protectRoute({
    ...config,
    customCheck: (user) => {
      // 这里可以添加管理员权限检查逻辑
      // 例如检查用户的自定义声明或角色
      return user?.email?.endsWith('@admin.com') || false;
    }
  });
}

/**
 * 重定向已认证用户
 */
export function redirectAuthenticated(
  redirectPath: string = '/dashboard'
): (event: ServerLoadEvent) => Promise<void> {
  return async (event: ServerLoadEvent) => {
    const { locals } = event;
    const user = locals.user as User | null;

    if (user) {
      throw redirect(302, redirectPath);
    }
  };
}

/**
 * 创建条件保护
 */
export function createConditionalProtection(
  condition: (event: ServerLoadEvent) => boolean,
  protection: (event: ServerLoadEvent) => Promise<void>
): (event: ServerLoadEvent) => Promise<void> {
  return async (event: ServerLoadEvent) => {
    if (condition(event)) {
      await protection(event);
    }
  };
}

/**
 * 创建基于路径的保护
 */
export function createPathBasedProtection(
  pathPattern: string | RegExp,
  protection: (event: ServerLoadEvent) => Promise<void>
): (event: ServerLoadEvent) => Promise<void> {
  const matcher = typeof pathPattern === 'string'
    ? (path: string) => path.startsWith(pathPattern)
    : (path: string) => pathPattern.test(path);

  return createConditionalProtection(
    (event) => matcher(event.url.pathname),
    protection
  );
}

/**
 * 组合多个保护函数
 */
export function combineProtections(
  ...protections: Array<(event: ServerLoadEvent) => Promise<void>>
): (event: ServerLoadEvent) => Promise<void> {
  return async (event: ServerLoadEvent) => {
    for (const protection of protections) {
      await protection(event);
    }
  };
}

/**
 * 创建角色基础的保护
 */
export function createRoleBasedProtection(
  requiredRoles: string[],
  getRoles: (user: User) => string[],
  config?: RouteProtectionConfig
): (event: ServerLoadEvent) => Promise<void> {
  return protectRoute({
    ...config,
    customCheck: (user) => {
      if (!user) return false;

      const userRoles = getRoles(user);
      return requiredRoles.some(role => userRoles.includes(role));
    }
  });
}

/**
 * 创建权限基础的保护
 */
export function createPermissionBasedProtection(
  requiredPermissions: string[],
  getPermissions: (user: User) => string[],
  config?: RouteProtectionConfig
): (event: ServerLoadEvent) => Promise<void> {
  return protectRoute({
    ...config,
    customCheck: (user) => {
      if (!user) return false;

      const userPermissions = getPermissions(user);
      return requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );
    }
  });
}

/**
 * 创建时间基础的保护（例如：工作时间访问）
 */
export function createTimeBasedProtection(
  allowedHours: { start: number; end: number },
  timezone: string = 'UTC',
  config?: RouteProtectionConfig
): (event: ServerLoadEvent) => Promise<void> {
  return protectRoute({
    ...config,
    customCheck: (user) => {
      if (!user) return false;

      const now = new Date();
      const currentHour = new Intl.DateTimeFormat('en', {
        hour: 'numeric',
        hour12: false,
        timeZone: timezone
      }).format(now);

      const hour = parseInt(currentHour);
      return hour >= allowedHours.start && hour <= allowedHours.end;
    }
  });
}

/**
 * 创建 IP 基础的保护
 */
export function createIPBasedProtection(
  _allowedIPs: string[],
  config?: RouteProtectionConfig
): (event: ServerLoadEvent) => Promise<void> {
  return protectRoute({
    ...config,
    customCheck: (user) => {
      if (!user) return false;

      // 注意：在生产环境中，需要从正确的头部获取真实 IP
      // 这里只是示例
      return true; // 实际实现需要检查 IP
    }
  });
}

/**
 * 创建设备基础的保护
 */
export function createDeviceBasedProtection(
  _allowedDevices: string[],
  config?: RouteProtectionConfig
): (event: ServerLoadEvent) => Promise<void> {
  return protectRoute({
    ...config,
    customCheck: (user) => {
      if (!user) return false;

      // 这里可以检查设备指纹或其他设备标识
      return true; // 实际实现需要检查设备
    }
  });
}
