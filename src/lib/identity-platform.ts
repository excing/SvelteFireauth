
/**
 * @fileoverview Identity Platform REST API 客户端
 *
 * 该文件提供了一个用于与 Google Cloud Identity Platform REST API 交互的单例类。
 * 它包括用于用户身份验证、配置文件管理和其他相关操作的方法。
 *
 * @see https://cloud.google.com/identity-platform/docs/use-rest-api?hl=zh-cn
 */

/**
 * 表示来自 Identity Platform API 的错误响应。
 */
export interface IdentityPlatformError {
  error: {
    code: number;
    message: string;
    errors: {
      message: string;
      domain: string;
      reason: string;
    }[];
  };
}

/**
 * 表示将自定义令牌交换为 ID 和刷新令牌时的响应。
 */
export interface CustomTokenResponse {
  /** 经过身份验证的用户的 ID 令牌。 */
  idToken: string;
  /** 经过身份验证的用户的刷新令牌。 */
  refreshToken: string;
  /** ID 令牌过期前的秒数。 */
  expiresIn: string;
}

/**
 * 表示刷新 ID 令牌时的响应。
 */
export interface RefreshTokenResponse {
    /** 新的 ID 令牌。 */
    id_token: string;
    /** 新的刷新令牌。 */
    refresh_token: string;
    /** 新 ID 令牌过期前的秒数。 */
    expires_in: string;
    /** 令牌的类型。 */
    token_type: string;
    /** 用户 ID。 */
    user_id: string;
    /** 项目 ID。 */
    project_id: string;
}

/**
 * 表示注册或登录用户时的响应。
 */
export interface AuthResponse {
  /** 用户的 ID。 */
  localId: string;
  /** 用户的电子邮件地址。 */
  email: string;
  /** 用户的显示名称。 */
  displayName: string;
  /** 经过身份验证的用户的 ID 令牌。 */
  idToken: string;
  /** 用户是否是新用户。 */
  registered?: boolean;
  /** 经过身份验证的用户的刷新令牌。 */
  refreshToken: string;
  /** ID 令牌过期前的秒数。 */
  expiresIn: string;
}

/**
 * 表示为电子邮件获取提供程序时的响应。
 */
export interface FetchProvidersResponse {
  /** 与电子邮件地址关联的所有提供程序。 */
  allProviders: string[];
  /** 电子邮件地址是否已注册。 */
  registered: boolean;
  /** 用于通过电子邮件登录的会话 ID。 */
  sessionId?: string;
}

/**
 * 表示 Identity Platform 中的用户。
 */
export interface User {
    /** 用户的 ID。 */
    localId: string;
    /** 用户的电子邮件地址。 */
    email: string;
    /** 用户的电子邮件是否已验证。 */
    emailVerified: boolean;
    /** 用户的显示名称。 */
    displayName: string;
    /** 用户的照片 URL。 */
    photoUrl: string;
    /** 用户的密码哈希。 */
    passwordHash: string;
    /** 用户个人资料上次更新的时间戳（以毫秒为单位）。 */
    lastLoginAt: string;
    /** 创建用户的时间戳（以毫秒为单位）。 */
    createdAt: string;
    /** 用户的提供程序数据。 */
    providerUserInfo: {
        providerId: string;
        federatedId: string;
        displayName: string;
        photoUrl: string;
        email: string;
    }[];
}

/**
 * 表示获取用户数据时的响应。
 */
export interface GetUserDataResponse {
  /** 用户列表。 */
  users: User[];
}

class IdentityPlatform {
  private static instance: IdentityPlatform;
  private apiKey: string;
  private baseUrl = 'https://identitytoolkit.googleapis.com/v1';

  private constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 获取 IdentityPlatform 类的单例实例。
   * @param {string} [apiKey] - Identity Platform 的 API 密钥。首次调用时需要。
   * @returns {IdentityPlatform} 单例实例。
   */
  public static getInstance(apiKey?: string): IdentityPlatform {
    if (!IdentityPlatform.instance) {
      if (!apiKey) {
        throw new Error('初始化 IdentityPlatform 实例需要 API 密钥。');
      }
      IdentityPlatform.instance = new IdentityPlatform(apiKey);
    }
    return IdentityPlatform.instance;
  }

  /**
   * 将自定义令牌交换为 ID 和刷新令牌。
   * @param {string} token - 要交换的自定义令牌。
   * @param {boolean} [returnSecureToken=true] - 是否返回安全令牌。
   * @returns {Promise<CustomTokenResponse | IdentityPlatformError>} API 的响应。
   */
  async exchangeCustomToken(token: string, returnSecureToken: boolean = true): Promise<CustomTokenResponse | IdentityPlatformError> {
    const response = await fetch(`${this.baseUrl}/accounts:signInWithCustomToken?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        returnSecureToken,
      }),
    });
    return response.json();
  }

  /**
   * 使用刷新令牌刷新 ID 令牌。
   * @param {string} refreshToken - 要使用的刷新令牌。
   * @returns {Promise<RefreshTokenResponse | IdentityPlatformError>} API 的响应。
   */
  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse | IdentityPlatformError> {
    const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }),
    });
    return response.json();
  }

  /**
   * 使用电子邮件和密码注册新用户。
   * @param {string} email - 用户的电子邮件。
   * @param {string} password - 用户的密码。
   * @param {boolean} [returnSecureToken=true] - 是否返回安全令牌。
   * @returns {Promise<AuthResponse | IdentityPlatformError>} API 的响应。
   */
  async signUpWithEmailPassword(email: string, password: string, returnSecureToken: boolean = true): Promise<AuthResponse | IdentityPlatformError> {
    const response = await fetch(`${this.baseUrl}/accounts:signUp?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken,
      }),
    });
    return response.json();
  }

  /**
   * 使用电子邮件和密码登录用户。
   * @param {string} email - 用户的电子邮件。
   * @param {string} password - 用户的密码。
   * @param {boolean} [returnSecureToken=true] - 是否返回安全令牌。
   * @returns {Promise<AuthResponse | IdentityPlatformError>} API 的响应。
   */
  async signInWithEmailPassword(email: string, password: string, returnSecureToken: boolean = true): Promise<AuthResponse | IdentityPlatformError> {
    const response = await fetch(`${this.baseUrl}/accounts:signInWithPassword?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken,
      }),
    });
    return response.json();
  }

  /**
   * 匿名登录用户。
   * @param {boolean} [returnSecureToken=true] - 是否返回安全令牌。
   * @returns {Promise<AuthResponse | IdentityPlatformError>} API 的响应。
   */
  async signInAnonymously(returnSecureToken: boolean = true): Promise<AuthResponse | IdentityPlatformError> {
    const response = await fetch(`${this.baseUrl}/accounts:signUp?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            returnSecureToken,
        }),
    });
    return response.json();
  }

  /**
   * 使用 OAuth 凭据登录。
   * @param {string} requestUri - IDP 将用户重定向回的 URI。
   * @param {string} postBody - OAuth 请求的 post 正文。
   * @param {boolean} [returnSecureToken=true] - 是否返回安全令牌。
   * @param {boolean} [returnIdpCredential=true] - 是否返回 IDP 凭据。
   * @returns {Promise<AuthResponse | IdentityPlatformError>} API 的响应。
   */
  async signInWithOAuth(requestUri: string, postBody: string, returnSecureToken: boolean = true, returnIdpCredential: boolean = true): Promise<AuthResponse | IdentityPlatformError> {
    const response = await fetch(`${this.baseUrl}/accounts:signInWithIdp?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            requestUri,
            postBody,
            returnSecureToken,
            returnIdpCredential,
        }),
    });
    return response.json();
  }

  /**
   * 检索与指定电子邮件地址关联的提供程序列表。
   * @param {string} email - 用户的电子邮件。
   * @returns {Promise<FetchProvidersResponse | IdentityPlatformError>} API 的响应。
   */
  async fetchProvidersForEmail(email: string): Promise<FetchProvidersResponse | IdentityPlatformError> {
    const response = await fetch(`${this.baseUrl}/accounts:createAuthUri?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: email,
        continueUri: window.location.href,
      }),
    });
    return response.json();
  }

  /**
   * 发送密码重置电子邮件。
   * @param {string} email - 用户的电子邮件。
   * @returns {Promise<{ email: string } | IdentityPlatformError>} API 的响应。
   */
  async sendPasswordResetEmail(email: string): Promise<{ email: string } | IdentityPlatformError> {
    const response = await fetch(`${this.baseUrl}/accounts:sendOobCode?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email,
      }),
    });
    return response.json();
  }

  /**
   * 确认密码重置。
   * @param {string} oobCode - 密码重置电子邮件中的带外代码。
   * @param {string} newPassword - 用户的新密码。
   * @returns {Promise<{ email: string, requestType: string } | IdentityPlatformError>} API 的响应。
   */
  async confirmPasswordReset(oobCode: string, newPassword: string): Promise<{ email: string, requestType: string } | IdentityPlatformError> {
    const response = await fetch(`${this.baseUrl}/accounts:resetPassword?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        oobCode,
        newPassword,
      }),
    });
    return response.json();
  }

  /**
   * 更改用户的电子邮件。
   * @param {string} idToken - 用户的 ID 令牌。
   * @param {string} email - 用户的新电子邮件。
   * @param {boolean} [returnSecureToken=true] - 是否返回安全令牌。
   * @returns {Promise<AuthResponse | IdentityPlatformError>} API 的响应。
   */
  async changeEmail(idToken: string, email: string, returnSecureToken: boolean = true): Promise<AuthResponse | IdentityPlatformError> {
    const response = await fetch(`${this.baseUrl}/accounts:update?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
        email,
        returnSecureToken,
      }),
    });
    return response.json();
  }

  /**
   * 更改用户的密码。
   * @param {string} idToken - 用户的 ID 令牌。
   * @param {string} password - 用户的新密码。
   * @param {boolean} [returnSecureToken=true] - 是否返回安全令牌。
   * @returns {Promise<AuthResponse | IdentityPlatformError>} API 的响应。
   */
  async changePassword(idToken: string, password: string, returnSecureToken: boolean = true): Promise<AuthResponse | IdentityPlatformError> {
    const response = await fetch(`${this.baseUrl}/accounts:update?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
        password,
        returnSecureToken,
      }),
    });
    return response.json();
  }

  /**
   * 更新用户的个人资料。
   * @param {string} idToken - 用户的 ID 令牌。
   * @param {string} [displayName] - 用户的新显示名称。
   * @param {string} [photoUrl] - 用户的新照片 URL。
   * @param {boolean} [returnSecureToken=true] - 是否返回安全令牌。
   * @returns {Promise<AuthResponse | IdentityPlatformError>} API 的响应。
   */
  async updateProfile(idToken: string, displayName?: string, photoUrl?: string, returnSecureToken: boolean = true): Promise<AuthResponse | IdentityPlatformError> {
    const response = await fetch(`${this.baseUrl}/accounts:update?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
        displayName,
        photoUrl,
        returnSecureToken,
      }),
    });
    return response.json();
  }

  /**
   * 获取用户数据。
   * @param {string} idToken - 用户的 ID 令牌。
   * @returns {Promise<GetUserDataResponse | IdentityPlatformError>} API 的响应。
   */
  async getUserData(idToken: string): Promise<GetUserDataResponse | IdentityPlatformError> {
    const response = await fetch(`${this.baseUrl}/accounts:lookup?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
      }),
    });
    return response.json();
  }

  /**
   * 将电子邮件/密码凭据链接到现有用户帐户。
   * @param {string} idToken - 用户的 ID 令牌。
   * @param {string} email - 用户的电子邮件。
   * @param {string} password - 用户的密码。
   * @param {boolean} [returnSecureToken=true] - 是否返回安全令牌。
   * @returns {Promise<AuthResponse | IdentityPlatformError>} API 的响应。
   */
  async linkWithEmailPassword(idToken: string, email: string, password: string, returnSecureToken: boolean = true): Promise<AuthResponse | IdentityPlatformError> {
    const response = await fetch(`${this.baseUrl}/accounts:update?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            idToken,
            email,
            password,
            returnSecureToken,
        }),
    });
    return response.json();
  }

  /**
   * 将 OAuth 凭据链接到现有用户帐户。
   * @param {string} idToken - 用户的 ID 令牌。
   * @param {string} requestUri - IDP 将用户重定向回的 URI。
   * @param {string} postBody - OAuth 请求的 post 正文。
   * @param {boolean} [returnSecureToken=true] - 是否返回安全令牌。
   * @returns {Promise<AuthResponse | IdentityPlatformError>} API 的响应。
   */
  async linkWithOAuth(idToken: string, requestUri: string, postBody: string, returnSecureToken: boolean = true): Promise<AuthResponse | IdentityPlatformError> {
    const response = await fetch(`${this.baseUrl}/accounts:signInWithIdp?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            idToken,
            requestUri,
            postBody,
            returnSecureToken,
        }),
    });
    return response.json();
  }

  /**
   * 从用户帐户取消提供程序的链接。
   * @param {string} idToken - 用户的 ID 令牌。
   * @param {string[]} providerId - 要取消链接的提供程序 ID。
   * @returns {Promise<AuthResponse | IdentityPlatformError>} API 的响应。
   */
  async unlinkProvider(idToken: string, providerId: string[]): Promise<AuthResponse | IdentityPlatformError> {
    const response = await fetch(`${this.baseUrl}/accounts:update?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            idToken,
            deleteProvider: providerId,
        }),
    });
    return response.json();
  }

  /**
   * 发送验证电子邮件。
   * @param {string} idToken - 用户的 ID 令牌。
   * @returns {Promise<{ email: string } | IdentityPlatformError>} API 的响应。
   */
  async sendEmailVerification(idToken: string): Promise<{ email: string } | IdentityPlatformError> {
    const response = await fetch(`${this.baseUrl}/accounts:sendOobCode?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requestType: 'VERIFY_EMAIL',
        idToken,
      }),
    });
    return response.json();
  }

  /**
   * 确认电子邮件验证。
   * @param {string} oobCode - 电子邮件验证电子邮件中的带外代码。
   * @returns {Promise<{ email: string, localId: string } | IdentityPlatformError>} API 的响应。
   */
  async confirmEmailVerification(oobCode: string): Promise<{ email: string, localId: string } | IdentityPlatformError> {
    const response = await fetch(`${this.baseUrl}/accounts:update?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        oobCode,
      }),
    });
    return response.json();
  }

  /**
   * 删除用户帐户。
   * @param {string} idToken - 用户的 ID 令牌。
   * @returns {Promise<{} | IdentityPlatformError>} API 的响应。
   */
  async deleteAccount(idToken: string): Promise<{} | IdentityPlatformError> {
    const response = await fetch(`${this.baseUrl}/accounts:delete?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken,
      }),
    });
    return response.json();
  }
}

export default IdentityPlatform;
