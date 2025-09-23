/**
 * 服务端认证处理器
 * 提供完整的服务端认证 API 端点
 */

import type { RequestEvent } from '@sveltejs/kit';
import type {
  FirebaseConfig,
  SessionCookieConfig,
  User,
  SignUpRequest,
  SignInRequest,
  UpdateProfileRequest,
  UpdateEmailRequest,
  UpdatePasswordRequest,
  SendEmailVerificationRequest,
  SendPasswordResetRequest,
  ConfirmPasswordResetRequest,
  ConfirmEmailVerificationRequest,
  FirebaseAuthError
} from '../types/index.js';
import { FirebaseAuthClient } from '../core/client.js';
import { SessionManager } from './session.js';

/**
 * 认证处理器配置
 */
export interface AuthHandlerConfig {
  firebase: FirebaseConfig;
  session?: SessionCookieConfig;
  cors?: {
    origin?: string | string[];
    credentials?: boolean;
  };
}

/**
 * API 响应接口
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * 认证处理器类
 */
export class AuthHandler {
  private firebaseClient: FirebaseAuthClient;
  private sessionManager: SessionManager;
  private config: AuthHandlerConfig;

  constructor(config: AuthHandlerConfig) {
    this.config = config;
    this.firebaseClient = new FirebaseAuthClient(config.firebase);
    this.sessionManager = new SessionManager(config.firebase, config.session);
  }

  /**
   * 处理认证请求的主要方法
   */
  async handle(event: RequestEvent, apiPrefix?: string): Promise<Response> {
    const { request } = event;
    const url = new URL(request.url);
    const pathname = apiPrefix ? url.pathname.replace(apiPrefix, '/auth') : url.pathname;

    // 设置 CORS 头
    const headers = this.getCorsHeaders();

    // 处理 OPTIONS 请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers });
    }

    try {
      // 路由分发
      switch (pathname) {
        case '/auth/signup':
          return this.handleSignUp(request, headers);
        case '/auth/signin':
          return this.handleSignIn(request, headers);
        case '/auth/signout':
          return this.handleSignOut(request, headers);
        case '/auth/refresh':
          return this.handleRefresh(request, headers);
        case '/auth/profile':
          return this.handleProfile(request, headers);
        case '/auth/update-email':
          return this.handleUpdateEmail(request, headers);
        case '/auth/update-password':
          return this.handleUpdatePassword(request, headers);
        case '/auth/send-email-verification':
          return this.handleSendEmailVerification(request, headers);
        case '/auth/send-password-reset':
          return this.handleSendPasswordReset(request, headers);
        case '/auth/confirm-password-reset':
          return this.handleConfirmPasswordReset(request, headers);
        case '/auth/confirm-email-verification':
          return this.handleConfirmEmailVerification(request, headers);
        case '/auth/delete-account':
          return this.handleDeleteAccount(request, headers);
        case '/auth/user':
          return this.handleGetUser(request, headers);
        default:
          return this.errorResponse('INVALID_ENDPOINT', 'Invalid API endpoint', 404, headers);
      }
    } catch (error) {
      return this.handleError(error, headers);
    }
  }

  /**
   * 用户注册
   */
  private async handleSignUp(request: Request, headers: Headers): Promise<Response> {
    const body: SignUpRequest = await request.json();

    if (!body.email || !body.password) {
      return this.errorResponse('MISSING_FIELDS', 'Email and password are required', 400, headers);
    }

    const response = await this.firebaseClient.signUp(body);
    const user = await this.createUserFromResponse(response);
    const sessionCookie = this.sessionManager.createSessionCookie(user);

    headers.set('Set-Cookie', sessionCookie);
    return this.successResponse({ user }, headers);
  }

  /**
   * 用户登录
   */
  private async handleSignIn(request: Request, headers: Headers): Promise<Response> {
    const body: SignInRequest = await request.json();

    if (!body.email || !body.password) {
      return this.errorResponse('MISSING_FIELDS', 'Email and password are required', 400, headers);
    }

    const response = await this.firebaseClient.signInWithPassword(body);
    const user = await this.createUserFromResponse(response);
    const sessionCookie = this.sessionManager.createSessionCookie(user);

    headers.set('Set-Cookie', sessionCookie);
    return this.successResponse({ user }, headers);
  }

  /**
   * 用户登出
   */
  private async handleSignOut(request: Request, headers: Headers): Promise<Response> {
    const clearCookie = this.sessionManager.clearSessionCookie();
    headers.set('Set-Cookie', clearCookie);
    return this.successResponse({ message: 'Signed out successfully' }, headers);
  }

  /**
   * 刷新令牌
   */
  private async handleRefresh(request: Request, headers: Headers): Promise<Response> {
    const user = await this.getCurrentUser(request);
    if (!user) {
      return this.errorResponse('UNAUTHENTICATED', 'User not authenticated', 401, headers);
    }

    const refreshResponse = await this.firebaseClient.refreshToken(user.refreshToken);
    const updatedUser: User = {
      ...user,
      accessToken: refreshResponse.id_token,
      refreshToken: refreshResponse.refresh_token,
      expiresIn: parseInt(refreshResponse.expires_in),
      expirationTime: Date.now() + parseInt(refreshResponse.expires_in) * 1000
    };

    const sessionCookie = this.sessionManager.createSessionCookie(updatedUser);
    headers.set('Set-Cookie', sessionCookie);
    return this.successResponse({ user: updatedUser }, headers);
  }

  /**
   * 获取当前用户
   */
  private async handleGetUser(request: Request, headers: Headers): Promise<Response> {
    const user = await this.getCurrentUser(request);
    if (!user) {
      return this.errorResponse('UNAUTHENTICATED', 'User not authenticated', 401, headers);
    }

    return this.successResponse({ user }, headers);
  }

  /**
   * 更新用户资料
   */
  private async handleProfile(request: Request, headers: Headers): Promise<Response> {
    const user = await this.getCurrentUser(request);
    if (!user) {
      return this.errorResponse('UNAUTHENTICATED', 'User not authenticated', 401, headers);
    }

    const body: Partial<UpdateProfileRequest> = await request.json();
    const updateRequest: UpdateProfileRequest = {
      idToken: user.accessToken,
      ...body
    };

    const response = await this.firebaseClient.updateProfile(updateRequest);
    const updatedUser = await this.createUserFromUpdateResponse(response, user);
    const sessionCookie = this.sessionManager.createSessionCookie(updatedUser);

    headers.set('Set-Cookie', sessionCookie);
    return this.successResponse({ user: updatedUser }, headers);
  }

  /**
   * 更新邮箱
   */
  private async handleUpdateEmail(request: Request, headers: Headers): Promise<Response> {
    const user = await this.getCurrentUser(request);
    if (!user) {
      return this.errorResponse('UNAUTHENTICATED', 'User not authenticated', 401, headers);
    }

    const body: { email: string } = await request.json();
    if (!body.email) {
      return this.errorResponse('MISSING_EMAIL', 'Email is required', 400, headers);
    }

    const updateRequest: UpdateEmailRequest = {
      idToken: user.accessToken,
      email: body.email
    };

    const response = await this.firebaseClient.updateEmail(updateRequest);
    const updatedUser = await this.createUserFromUpdateResponse(response, user);
    const sessionCookie = this.sessionManager.createSessionCookie(updatedUser);

    headers.set('Set-Cookie', sessionCookie);
    return this.successResponse({ user: updatedUser }, headers);
  }

  /**
   * 更新密码
   */
  private async handleUpdatePassword(request: Request, headers: Headers): Promise<Response> {
    const user = await this.getCurrentUser(request);
    if (!user) {
      return this.errorResponse('UNAUTHENTICATED', 'User not authenticated', 401, headers);
    }

    const body: { password: string } = await request.json();
    if (!body.password) {
      return this.errorResponse('MISSING_PASSWORD', 'Password is required', 400, headers);
    }

    const updateRequest: UpdatePasswordRequest = {
      idToken: user.accessToken,
      password: body.password
    };

    const response = await this.firebaseClient.updatePassword(updateRequest);
    const updatedUser = await this.createUserFromUpdateResponse(response, user);
    const sessionCookie = this.sessionManager.createSessionCookie(updatedUser);

    headers.set('Set-Cookie', sessionCookie);
    return this.successResponse({ user: updatedUser }, headers);
  }

  /**
   * 发送邮箱验证
   */
  private async handleSendEmailVerification(request: Request, headers: Headers): Promise<Response> {
    const user = await this.getCurrentUser(request);
    if (!user) {
      return this.errorResponse('UNAUTHENTICATED', 'User not authenticated', 401, headers);
    }

    const verificationRequest: SendEmailVerificationRequest = {
      requestType: 'VERIFY_EMAIL',
      idToken: user.accessToken
    };

    await this.firebaseClient.sendEmailVerification(verificationRequest);
    return this.successResponse({ message: 'Email verification sent' }, headers);
  }

  /**
   * 发送密码重置邮件
   */
  private async handleSendPasswordReset(request: Request, headers: Headers): Promise<Response> {
    const body: { email: string } = await request.json();
    if (!body.email) {
      return this.errorResponse('MISSING_EMAIL', 'Email is required', 400, headers);
    }

    const resetRequest: SendPasswordResetRequest = {
      requestType: 'PASSWORD_RESET',
      email: body.email
    };

    await this.firebaseClient.sendPasswordReset(resetRequest);
    return this.successResponse({ message: 'Password reset email sent' }, headers);
  }

  /**
   * 确认密码重置
   */
  private async handleConfirmPasswordReset(request: Request, headers: Headers): Promise<Response> {
    const body: ConfirmPasswordResetRequest = await request.json();
    if (!body.oobCode || !body.newPassword) {
      return this.errorResponse('MISSING_FIELDS', 'OOB code and new password are required', 400, headers);
    }

    await this.firebaseClient.confirmPasswordReset(body);
    return this.successResponse({ message: 'Password reset confirmed' }, headers);
  }

  /**
   * 确认邮箱验证
   */
  private async handleConfirmEmailVerification(request: Request, headers: Headers): Promise<Response> {
    const body: ConfirmEmailVerificationRequest = await request.json();
    if (!body.oobCode) {
      return this.errorResponse('MISSING_OOB_CODE', 'OOB code is required', 400, headers);
    }

    await this.firebaseClient.confirmEmailVerification(body);
    return this.successResponse({ message: 'Email verification confirmed' }, headers);
  }

  /**
   * 删除账户
   */
  private async handleDeleteAccount(request: Request, headers: Headers): Promise<Response> {
    const user = await this.getCurrentUser(request);
    if (!user) {
      return this.errorResponse('UNAUTHENTICATED', 'User not authenticated', 401, headers);
    }

    await this.firebaseClient.deleteAccount(user.accessToken);
    const clearCookie = this.sessionManager.clearSessionCookie();
    headers.set('Set-Cookie', clearCookie);
    return this.successResponse({ message: 'Account deleted successfully' }, headers);
  }

  // ============================================================================
  // 辅助方法
  // ============================================================================

  /**
   * 获取当前用户
   */
  private async getCurrentUser(request: Request): Promise<User | null> {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) {
      return null;
    }

    return this.sessionManager.verifySessionCookie(cookieHeader);
  }

  /**
   * 从注册/登录响应创建用户对象
   */
  private async createUserFromResponse(response: any): Promise<User> {
    const accountInfo = await this.firebaseClient.getAccountInfo(response.idToken);
    const userInfo = accountInfo.users[0];

    return {
      uid: response.localId,
      email: response.email,
      displayName: response.displayName || userInfo.displayName,
      emailVerified: response.emailVerified || userInfo.emailVerified,
      photoURL: response.photoUrl || userInfo.photoUrl,
      accessToken: response.idToken,
      refreshToken: response.refreshToken,
      expiresIn: parseInt(response.expiresIn),
      expirationTime: Date.now() + parseInt(response.expiresIn) * 1000,
      createdAt: userInfo.createdAt,
      lastLoginAt: userInfo.lastLoginAt,
      isAnonymous: false
    };
  }

  /**
   * 从更新响应创建用户对象
   */
  private async createUserFromUpdateResponse(response: any, currentUser: User): Promise<User> {
    return {
      ...currentUser,
      email: response.email || currentUser.email,
      displayName: response.displayName || currentUser.displayName,
      photoURL: response.photoUrl || currentUser.photoURL,
      emailVerified: response.emailVerified ?? currentUser.emailVerified,
      accessToken: response.idToken || currentUser.accessToken,
      refreshToken: response.refreshToken || currentUser.refreshToken,
      expiresIn: response.expiresIn ? parseInt(response.expiresIn) : currentUser.expiresIn,
      expirationTime: response.expiresIn
        ? Date.now() + parseInt(response.expiresIn) * 1000
        : currentUser.expirationTime
    };
  }

  /**
   * 获取 CORS 头
   */
  private getCorsHeaders(): Headers {
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    if (this.config.cors) {
      const { origin, credentials } = this.config.cors;

      if (origin) {
        if (Array.isArray(origin)) {
          headers.set('Access-Control-Allow-Origin', origin.join(', '));
        } else {
          headers.set('Access-Control-Allow-Origin', origin);
        }
      }

      if (credentials) {
        headers.set('Access-Control-Allow-Credentials', 'true');
      }

      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    }

    return headers;
  }

  /**
   * 成功响应
   */
  private successResponse<T>(data: T, headers: Headers): Response {
    const response: ApiResponse<T> = {
      success: true,
      data
    };
    return new Response(JSON.stringify(response), { status: 200, headers });
  }

  /**
   * 错误响应
   */
  private errorResponse(code: string, message: string, status: number, headers: Headers): Response {
    const response: ApiResponse = {
      success: false,
      error: { code, message }
    };
    return new Response(JSON.stringify(response), { status, headers });
  }

  /**
   * 处理错误
   */
  private handleError(error: any, headers: Headers): Response {
    if (error && typeof error === 'object' && 'code' in error) {
      const firebaseError = error as FirebaseAuthError;
      return this.errorResponse(firebaseError.code, firebaseError.message, 400, headers);
    }

    return this.errorResponse('INTERNAL_ERROR', 'Internal server error', 500, headers);
  }
}

/**
 * 创建认证处理器（便捷函数）
 */
export function createAuthHandler(config: AuthHandlerConfig) {
  const handler = new AuthHandler(config);
  return (event: RequestEvent, apiPrefix?: string) => handler.handle(event, apiPrefix);
}
