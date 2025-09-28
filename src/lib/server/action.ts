/**
 * Firebase Action 页面处理器
 * 处理 Firebase 自定义操作链接网址
 */

import type { RequestEvent } from '@sveltejs/kit';
import type {
  FirebaseConfig,
  FirebaseActionMode,
  ActionPageParams,
  ActionResult,
  ActionPageConfig
} from '../types/index.js';
import { FirebaseAuthClient } from '../core/client.js';

/**
 * Action 页面处理器类
 */
export class ActionPageHandler {
  private firebaseClient: FirebaseAuthClient;
  private config: ActionPageConfig;

  constructor(firebaseConfig: FirebaseConfig, config: ActionPageConfig = {}) {
    this.firebaseClient = new FirebaseAuthClient(firebaseConfig);
    this.config = config;
  }

  /**
   * 处理 Action 页面请求
   */
  async handleAction(event: RequestEvent): Promise<Response> {
    const url = new URL(event.request.url);
    const params = this.parseActionParams(url);

    if (!params) {
      return this.renderErrorPage('Invalid action parameters', 'resetPassword');
    }

    try {
      const result = await this.processAction(params);
      
      if (result.success) {
        return this.renderSuccessPage(result);
      } else {
        return this.renderErrorPage(result.error || 'Action failed', params.mode);
      }
    } catch (error) {
      console.error('Action processing error:', error);
      return this.renderErrorPage('Internal server error', params.mode);
    }
  }

  /**
   * 解析 Action 参数
   */
  private parseActionParams(url: URL): ActionPageParams | null {
    const mode = url.searchParams.get('mode') as FirebaseActionMode;
    const oobCode = url.searchParams.get('oobCode');
    const apiKey = url.searchParams.get('apiKey');
    const continueUrl = url.searchParams.get('continueUrl');
    const lang = url.searchParams.get('lang');

    if (!mode || !oobCode) {
      return null;
    }

    return {
      mode,
      oobCode,
      apiKey: apiKey || undefined,
      continueUrl: continueUrl || undefined,
      lang: lang || undefined
    };
  }

  /**
   * 处理具体的 Action
   */
  private async processAction(params: ActionPageParams): Promise<ActionResult> {
    // 检查是否有自定义处理器
    if (this.config.customHandlers?.[params.mode]) {
      return await this.config.customHandlers[params.mode]!(params);
    }

    // 默认处理器
    switch (params.mode) {
      case 'resetPassword':
        return await this.handlePasswordReset(params);
      case 'verifyEmail':
        return await this.handleEmailVerification(params);
      case 'recoverEmail':
        return await this.handleEmailRecovery(params);
      case 'signIn':
        return await this.handleSignInWithEmailLink(params);
      case 'verifyAndChangeEmail':
        return await this.handleVerifyAndChangeEmail(params);
      default:
        return {
          success: false,
          mode: params.mode,
          error: 'Unsupported action mode'
        };
    }
  }

  /**
   * 处理密码重置
   */
  private async handlePasswordReset(params: ActionPageParams): Promise<ActionResult> {
    try {
      // 验证重置代码
      const response = await this.firebaseClient.verifyPasswordResetCode(params.oobCode);
      
      return {
        success: true,
        mode: params.mode,
        data: {
          email: response.email,
          oobCode: params.oobCode
        },
        redirectUrl: params.continueUrl || this.config.defaultRedirectUrl
      };
    } catch (error: any) {
      return {
        success: false,
        mode: params.mode,
        error: error.message || 'Invalid or expired reset code'
      };
    }
  }

  /**
   * 处理邮箱验证
   */
  private async handleEmailVerification(params: ActionPageParams): Promise<ActionResult> {
    try {
      await this.firebaseClient.confirmEmailVerification(params.oobCode);
      
      return {
        success: true,
        mode: params.mode,
        data: { verified: true },
        redirectUrl: params.continueUrl || this.config.defaultRedirectUrl
      };
    } catch (error: any) {
      return {
        success: false,
        mode: params.mode,
        error: error.message || 'Invalid or expired verification code'
      };
    }
  }

  /**
   * 处理邮箱恢复
   */
  private async handleEmailRecovery(params: ActionPageParams): Promise<ActionResult> {
    try {
      const response = await this.firebaseClient.checkActionCode(params.oobCode);
      
      return {
        success: true,
        mode: params.mode,
        data: {
          email: response.data.email,
          previousEmail: response.data.previousEmail
        },
        redirectUrl: params.continueUrl || this.config.defaultRedirectUrl
      };
    } catch (error: any) {
      return {
        success: false,
        mode: params.mode,
        error: error.message || 'Invalid or expired recovery code'
      };
    }
  }

  /**
   * 处理邮箱链接登录
   */
  private async handleSignInWithEmailLink(params: ActionPageParams): Promise<ActionResult> {
    try {
      const response = await this.firebaseClient.signInWithEmailLink(params.oobCode);
      
      return {
        success: true,
        mode: params.mode,
        data: {
          user: response,
          accessToken: response.idToken
        },
        redirectUrl: params.continueUrl || this.config.defaultRedirectUrl
      };
    } catch (error: any) {
      return {
        success: false,
        mode: params.mode,
        error: error.message || 'Invalid or expired sign-in link'
      };
    }
  }

  /**
   * 处理验证并更改邮箱
   */
  private async handleVerifyAndChangeEmail(params: ActionPageParams): Promise<ActionResult> {
    try {
      const response = await this.firebaseClient.checkActionCode(params.oobCode);
      
      return {
        success: true,
        mode: params.mode,
        data: {
          newEmail: response.data.email,
          previousEmail: response.data.previousEmail
        },
        redirectUrl: params.continueUrl || this.config.defaultRedirectUrl
      };
    } catch (error: any) {
      return {
        success: false,
        mode: params.mode,
        error: error.message || 'Invalid or expired verification code'
      };
    }
  }

  /**
   * 渲染成功页面
   */
  private renderSuccessPage(result: ActionResult): Response {
    if (typeof this.config.successPage === 'function') {
      const content = this.config.successPage(result);
      return new Response(content, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (typeof this.config.successPage === 'string') {
      return new Response(this.config.successPage, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // 默认成功页面
    const html = this.getDefaultSuccessPage(result);
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  /**
   * 渲染错误页面
   */
  private renderErrorPage(error: string, mode: FirebaseActionMode): Response {
    if (typeof this.config.errorPage === 'function') {
      const content = this.config.errorPage(error, mode);
      return new Response(content, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    if (typeof this.config.errorPage === 'string') {
      return new Response(this.config.errorPage, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // 默认错误页面
    const html = this.getDefaultErrorPage(error, mode);
    return new Response(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  }

  /**
   * 获取默认成功页面 HTML
   */
  private getDefaultSuccessPage(result: ActionResult): string {
    const messages = {
      resetPassword: '密码重置链接已验证，请设置新密码。',
      verifyEmail: '邮箱验证成功！',
      recoverEmail: '邮箱恢复请求已处理。',
      signIn: '登录成功！',
      verifyAndChangeEmail: '邮箱更改已验证。'
    };

    const message = messages[result.mode] || '操作成功！';
    const redirectUrl = result.redirectUrl || '/';

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>操作成功</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 400px; margin: 0 auto; }
        .success { color: #4CAF50; }
        .button { background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="success">✓ 成功</h1>
        <p>${message}</p>
        <a href="${redirectUrl}" class="button">继续</a>
    </div>
    <script>
        setTimeout(() => {
            window.location.href = '${redirectUrl}';
        }, 3000);
    </script>
</body>
</html>`;
  }

  /**
   * 获取默认错误页面 HTML
   */
  private getDefaultErrorPage(error: string, mode: FirebaseActionMode): string {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>操作失败</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 400px; margin: 0 auto; }
        .error { color: #f44336; }
        .button { background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="error">✗ 错误</h1>
        <p>${error}</p>
        <a href="/" class="button">返回首页</a>
    </div>
</body>
</html>`;
  }
}

/**
 * 创建 Action 页面处理器
 */
export function createActionPageHandler(
  firebaseConfig: FirebaseConfig,
  config?: ActionPageConfig
) {
  return (event: RequestEvent) => {
    const handler = new ActionPageHandler(firebaseConfig, config);
    return handler.handleAction(event);
  };
}
