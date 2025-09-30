
import type { AuthResponse, IdentityPlatformError, GetUserDataResponse, RefreshTokenResponse } from '../identity-platform.js';

/**
 * 一个通用的 API 调用函数, 用于与后端的 /api/auth/* 端点交互.
 * @param action - 要调用的 API action, 例如 'signUpWithEmailPassword'.
 * @param body - 发送到 API 的请求体.
 * @returns API 的 JSON 响应.
 */
async function callAuthApi<T>(action: string, body: unknown): Promise<T> {
    const response = await fetch(`/api/auth/${action}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
        // 将 API 返回的错误结构包装成一个 Error 对象抛出
        throw new Error(data.error?.message || 'An unknown error occurred');
    }

    return data as T;
}

// --- 导出每个 API action 对应的辅助函数 ---

export const signUpWithEmailPassword = (email: string, password: string) =>
    callAuthApi<AuthResponse>('signUpWithEmailPassword', { email, password });

export const signInWithEmailPassword = (email: string, password: string) =>
    callAuthApi<AuthResponse>('signInWithEmailPassword', { email, password });

export const signInAnonymously = () =>
    callAuthApi<AuthResponse>('signInAnonymously', {});

export const refreshToken = (token: string) =>
    callAuthApi<RefreshTokenResponse>('refreshToken', { refreshToken: token });

export const sendPasswordResetEmail = (email: string) =>
    callAuthApi<{ email: string }>('sendPasswordResetEmail', { email });

export const confirmPasswordReset = (oobCode: string, newPassword: string) =>
    callAuthApi<{ email: string, requestType: string }>('confirmPasswordReset', { oobCode, newPassword });

export const getUserData = (idToken: string) =>
    callAuthApi<GetUserDataResponse>('getUserData', { idToken });

export const updateProfile = (idToken: string, displayName?: string, photoUrl?: string) =>
    callAuthApi<AuthResponse>('updateProfile', { idToken, displayName, photoUrl });

export const changeEmail = (idToken: string, email: string) =>
    callAuthApi<AuthResponse>('changeEmail', { idToken, email });

export const changePassword = (idToken: string, password: string) =>
    callAuthApi<AuthResponse>('changePassword', { idToken, password });

export const sendEmailVerification = (idToken: string) =>
    callAuthApi<{ email: string }>('sendEmailVerification', { idToken });

export const confirmEmailVerification = (oobCode: string) =>
    callAuthApi<{ email: string, localId: string }>('confirmEmailVerification', { oobCode });

export const deleteAccount = (idToken: string) =>
    callAuthApi<{}>('deleteAccount', { idToken });
