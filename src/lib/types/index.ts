/**
 * SvelteFireAuth 类型定义
 * 基于 Firebase Auth REST API 的完整类型系统
 */

// ============================================================================
// 用户数据结构
// ============================================================================

/**
 * 用户信息接口 - 基于您提供的数据结构
 */
export interface User {
  /** 用户唯一标识符 */
  uid: string;
  /** 用户邮箱地址 */
  email: string;
  /** 用户显示名称 */
  displayName?: string;
  /** 邮箱是否已验证 */
  emailVerified: boolean;
  /** 用户头像 URL */
  photoURL?: string;
  /** 账户创建时间 */
  createdAt?: string;
  /** 最后登录时间 */
  lastLoginAt?: string;
  /** 是否为匿名用户 */
  isAnonymous?: boolean;
  /** 访问令牌 */
  accessToken: string;
  /** 刷新令牌 */
  refreshToken: string;
  /** accessToken 有效时长（秒） */
  expiresIn?: number;
  /** accessToken 过期时间戳 */
  expirationTime?: number;
}

/**
 * 用户认证状态
 */
export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

/**
 * 提供商用户信息
 */
export interface ProviderUserInfo {
  providerId: string;
  federatedId: string;
  displayName?: string;
  photoUrl?: string;
  email?: string;
  rawId?: string;
  screenName?: string;
}

// ============================================================================
// Firebase Auth REST API 响应类型
// ============================================================================

/**
 * Firebase Auth 注册响应
 */
export interface SignUpResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  displayName?: string;
  emailVerified?: boolean;
}

/**
 * Firebase Auth 登录响应
 */
export interface SignInResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  displayName?: string;
  emailVerified?: boolean;
  photoUrl?: string;
  registered?: boolean;
}

/**
 * 获取用户信息响应
 */
export interface GetAccountInfoResponse {
  users: Array<{
    localId: string;
    email: string;
    emailVerified: boolean;
    displayName?: string;
    providerUserInfo?: ProviderUserInfo[];
    photoUrl?: string;
    passwordHash?: string;
    passwordUpdatedAt?: number;
    validSince?: string;
    disabled?: boolean;
    lastLoginAt?: string;
    createdAt?: string;
    customAuth?: boolean;
    tenantId?: string;
  }>;
}

/**
 * 更新账户信息响应
 */
export interface UpdateAccountResponse {
  localId: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  passwordHash?: string;
  providerUserInfo?: ProviderUserInfo[];
  idToken?: string;
  refreshToken?: string;
  expiresIn?: string;
  emailVerified?: boolean;
}

/**
 * 发送 OOB 代码响应
 */
export interface SendOobCodeResponse {
  email: string;
}

/**
 * 刷新令牌响应
 */
export interface RefreshTokenResponse {
  access_token: string;
  expires_in: string;
  token_type: string;
  refresh_token: string;
  id_token: string;
  user_id: string;
  project_id: string;
}

// ============================================================================
// 请求参数类型
// ============================================================================

/**
 * 注册请求参数
 */
export interface SignUpRequest {
  email: string;
  password: string;
  displayName?: string;
  returnSecureToken?: boolean;
}

/**
 * 登录请求参数
 */
export interface SignInRequest {
  email: string;
  password: string;
  returnSecureToken?: boolean;
}

/**
 * 更新用户资料请求参数
 */
export interface UpdateProfileRequest {
  idToken: string;
  displayName?: string;
  photoUrl?: string;
  deleteAttribute?: string[];
  returnSecureToken?: boolean;
}

/**
 * 更新邮箱请求参数
 */
export interface UpdateEmailRequest {
  idToken: string;
  email: string;
  returnSecureToken?: boolean;
}

/**
 * 更新密码请求参数
 */
export interface UpdatePasswordRequest {
  idToken: string;
  password: string;
  returnSecureToken?: boolean;
}

/**
 * 发送邮箱验证请求参数
 */
export interface SendEmailVerificationRequest {
  requestType: 'VERIFY_EMAIL';
  idToken: string;
}

/**
 * 发送密码重置请求参数
 */
export interface SendPasswordResetRequest {
  requestType: 'PASSWORD_RESET';
  email: string;
}

/**
 * 确认密码重置请求参数
 */
export interface ConfirmPasswordResetRequest {
  oobCode: string;
  newPassword: string;
}

/**
 * 确认邮箱验证请求参数
 */
export interface ConfirmEmailVerificationRequest {
  oobCode: string;
}

// ============================================================================
// 配置类型
// ============================================================================

/**
 * Firebase 项目配置
 */
export interface FirebaseConfig {
  /** Firebase 项目的 API 密钥 */
  apiKey: string;
  /** 项目 ID */
  projectId?: string;
  /** 认证域名 */
  authDomain?: string;
  /** 是否启用调试模式 */
  debug?: boolean;
}

/**
 * 会话 Cookie 配置
 */
export interface SessionCookieConfig {
  /** Cookie 名称，默认为 '__session' */
  name?: string;
  /** Cookie 有效期（秒），默认为 5 天 */
  maxAge?: number;
  /** Cookie 路径，默认为 '/' */
  path?: string;
  /** 是否仅 HTTPS，默认为 true */
  secure?: boolean;
  /** 是否仅 HTTP，默认为 true */
  httpOnly?: boolean;
  /** SameSite 策略，默认为 'lax' */
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * 认证中间件配置
 */
export interface AuthMiddlewareConfig {
  /** 需要认证的路径模式 */
  protectedPaths?: string[];
  /** 公开路径模式 */
  publicPaths?: string[];
  /** 登录页面路径 */
  loginPath?: string;
  /** 登录后重定向路径 */
  redirectPath?: string;
  /** 是否自动刷新令牌 */
  autoRefresh?: boolean;
}

// ============================================================================
// 错误处理类型
// ============================================================================

/**
 * Firebase Auth 错误代码
 */
export type FirebaseErrorCode = 
  | 'EMAIL_EXISTS'
  | 'EMAIL_NOT_FOUND'
  | 'INVALID_EMAIL'
  | 'INVALID_PASSWORD'
  | 'INVALID_ID_TOKEN'
  | 'USER_DISABLED'
  | 'USER_NOT_FOUND'
  | 'WEAK_PASSWORD'
  | 'EXPIRED_OOB_CODE'
  | 'INVALID_OOB_CODE'
  | 'OPERATION_NOT_ALLOWED'
  | 'CREDENTIAL_TOO_OLD_LOGIN_AGAIN'
  | 'TOKEN_EXPIRED'
  | 'MISSING_EMAIL'
  | 'MISSING_PASSWORD'
  | 'MISSING_ID_TOKEN'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Firebase Auth 错误
 */
export interface FirebaseAuthError extends Error {
  code: FirebaseErrorCode;
  message: string;
  details?: any;
}

// ============================================================================
// 事件类型
// ============================================================================

/**
 * 认证状态变化事件
 */
export interface AuthStateChangeEvent {
  user: User | null;
  state: AuthState;
}

/**
 * 认证事件类型
 */
export type AuthEventType = 
  | 'signIn'
  | 'signOut'
  | 'signUp'
  | 'tokenRefresh'
  | 'profileUpdate'
  | 'emailVerification'
  | 'passwordReset';

/**
 * 认证事件
 */
export interface AuthEvent {
  type: AuthEventType;
  user?: User | null;
  data?: any;
  timestamp: number;
}
