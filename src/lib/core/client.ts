/**
 * Firebase Auth REST API 客户端
 * 提供所有 Firebase Auth REST API 的底层调用功能
 */

import type {
  FirebaseConfig,
  SignUpRequest,
  SignUpResponse,
  SignInRequest,
  SignInResponse,
  GetAccountInfoResponse,
  UpdateProfileRequest,
  UpdateEmailRequest,
  UpdatePasswordRequest,
  UpdateAccountResponse,
  SendEmailVerificationRequest,
  SendPasswordResetRequest,
  SendOobCodeResponse,
  ConfirmPasswordResetRequest,
  ConfirmEmailVerificationRequest,
  RefreshTokenResponse,
  FirebaseAuthError
} from '../types/index.js';

/**
 * Firebase Auth REST API 基础 URL
 */
const FIREBASE_AUTH_BASE_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';
const FIREBASE_TOKEN_BASE_URL = 'https://securetoken.googleapis.com/v1/token';

/**
 * Firebase Auth REST API 客户端类
 */
export class FirebaseAuthClient {
  private config: FirebaseConfig;

  constructor(config: FirebaseConfig) {
    this.config = config;
  }

  /**
   * 发送 HTTP 请求的通用方法
   */
  private async request<T>(
    url: string,
    method: 'GET' | 'POST' = 'POST',
    body?: any,
    headers?: Record<string, string>
  ): Promise<T> {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await response.json();

      if (!response.ok) {
        throw this.createError(data);
      }

      return data;
    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      throw this.createError({ error: { message: 'NETWORK_ERROR' } });
    }
  }

  /**
   * 创建 Firebase 错误对象
   */
  private createError(errorData: any): FirebaseAuthError {
    const message = errorData?.error?.message || 'UNKNOWN_ERROR';
    const error = new Error(message) as FirebaseAuthError;
    error.code = message;
    error.details = errorData;
    return error;
  }

  /**
   * 构建 API URL
   */
  private buildUrl(endpoint: string): string {
    return `${FIREBASE_AUTH_BASE_URL}:${endpoint}?key=${this.config.apiKey}`;
  }

  /**
   * 构建 Token API URL
   */
  private buildTokenUrl(): string {
    return `${FIREBASE_TOKEN_BASE_URL}?key=${this.config.apiKey}`;
  }

  // ============================================================================
  // 认证操作
  // ============================================================================

  /**
   * 用户注册
   */
  async signUp(request: SignUpRequest): Promise<SignUpResponse> {
    const url = this.buildUrl('signUp');
    return this.request<SignUpResponse>(url, 'POST', {
      ...request,
      returnSecureToken: true
    });
  }

  /**
   * 用户登录
   */
  async signInWithPassword(request: SignInRequest): Promise<SignInResponse> {
    const url = this.buildUrl('signInWithPassword');
    return this.request<SignInResponse>(url, 'POST', {
      ...request,
      returnSecureToken: true
    });
  }

  /**
   * 刷新访问令牌
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    const url = this.buildTokenUrl();
    return this.request<RefreshTokenResponse>(url, 'POST', {
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    });
  }

  /**
   * 获取用户信息
   */
  async getAccountInfo(idToken: string): Promise<GetAccountInfoResponse> {
    const url = this.buildUrl('lookup');
    return this.request<GetAccountInfoResponse>(url, 'POST', {
      idToken
    });
  }

  // ============================================================================
  // 用户资料管理
  // ============================================================================

  /**
   * 更新用户资料
   */
  async updateProfile(request: UpdateProfileRequest): Promise<UpdateAccountResponse> {
    const url = this.buildUrl('update');
    return this.request<UpdateAccountResponse>(url, 'POST', {
      ...request,
      returnSecureToken: true
    });
  }

  /**
   * 更新用户邮箱
   */
  async updateEmail(request: UpdateEmailRequest): Promise<UpdateAccountResponse> {
    const url = this.buildUrl('update');
    return this.request<UpdateAccountResponse>(url, 'POST', {
      ...request,
      returnSecureToken: true
    });
  }

  /**
   * 更新用户密码
   */
  async updatePassword(request: UpdatePasswordRequest): Promise<UpdateAccountResponse> {
    const url = this.buildUrl('update');
    return this.request<UpdateAccountResponse>(url, 'POST', {
      ...request,
      returnSecureToken: true
    });
  }

  /**
   * 删除用户账户
   */
  async deleteAccount(idToken: string): Promise<void> {
    const url = this.buildUrl('delete');
    await this.request(url, 'POST', { idToken });
  }

  // ============================================================================
  // 邮箱验证和密码重置
  // ============================================================================

  /**
   * 发送邮箱验证
   */
  async sendEmailVerification(request: SendEmailVerificationRequest): Promise<SendOobCodeResponse> {
    const url = this.buildUrl('sendOobCode');
    return this.request<SendOobCodeResponse>(url, 'POST', request);
  }

  /**
   * 发送密码重置邮件
   */
  async sendPasswordReset(request: SendPasswordResetRequest): Promise<SendOobCodeResponse> {
    const url = this.buildUrl('sendOobCode');
    return this.request<SendOobCodeResponse>(url, 'POST', request);
  }

  /**
   * 验证密码重置代码
   */
  async verifyPasswordResetCode(oobCode: string): Promise<{ email: string; requestType: string }> {
    const url = this.buildUrl('resetPassword');
    return this.request(url, 'POST', { oobCode });
  }

  /**
   * 确认密码重置
   */
  async confirmPasswordReset(request: ConfirmPasswordResetRequest): Promise<{ email: string; requestType: string }> {
    const url = this.buildUrl('resetPassword');
    return this.request(url, 'POST', request);
  }

  /**
   * 确认邮箱验证
   */
  async confirmEmailVerification(request: ConfirmEmailVerificationRequest): Promise<UpdateAccountResponse> {
    const url = this.buildUrl('update');
    return this.request<UpdateAccountResponse>(url, 'POST', request);
  }

  // ============================================================================
  // 工具方法
  // ============================================================================

  /**
   * 检查邮箱是否已存在
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const url = this.buildUrl('createAuthUri');
      const response = await this.request<{ registered: boolean }>(url, 'POST', {
        identifier: email,
        continueUri: 'http://localhost'
      });
      return response.registered || false;
    } catch {
      return false;
    }
  }

  /**
   * 验证 ID Token 是否有效
   */
  async verifyIdToken(idToken: string): Promise<boolean> {
    try {
      await this.getAccountInfo(idToken);
      return true;
    } catch {
      return false;
    }
  }
}
