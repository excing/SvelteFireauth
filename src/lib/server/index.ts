
import type { Handle } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import IdentityPlatform from '../identity-platform.js';

/**
 * 创建一个 SvelteKit Handle 函数, 用于处理身份验证相关的 API 请求.
 * 该 Handle 会拦截所有指向 /api/auth/ 的请求, 并将其路由到相应的 Identity Platform API 方法.
 *
 * @param apiKey - 你的 Google Cloud Identity Platform 项目的 API 密钥.
 * @returns 一个 SvelteKit Handle 函数.
 */
export function createAuthHanle(apiKey: string): Handle {
	return async ({ event, resolve }) => {
		const { url, request } = event;

		// 仅处理 /api/auth/ 路径下的请求
		if (!url.pathname.startsWith('/api/auth/')) {
			return resolve(event);
		}

		// 从 URL 中提取 action
		const action = url.pathname.split('/').pop();
		if (!action) {
			return json({ error: 'No action specified' }, { status: 400 });
		}

		try {
			const identityPlatform = IdentityPlatform.getInstance(apiKey);
			const body = await request.json();

			let response: unknown;

			// 根据 action 调用对应的 IdentityPlatform 方法
			switch (action) {
				case 'signUpWithEmailPassword':
					response = await identityPlatform.signUpWithEmailPassword(body.email, body.password);
					break;
				case 'signInWithEmailPassword':
					response = await identityPlatform.signInWithEmailPassword(body.email, body.password);
					break;
				case 'signInAnonymously':
					response = await identityPlatform.signInAnonymously();
					break;
				case 'refreshToken':
					response = await identityPlatform.refreshToken(body.refreshToken);
					break;
				case 'sendPasswordResetEmail':
					response = await identityPlatform.sendPasswordResetEmail(body.email);
					break;
				case 'confirmPasswordReset':
					response = await identityPlatform.confirmPasswordReset(body.oobCode, body.newPassword);
					break;
				case 'getUserData':
					response = await identityPlatform.getUserData(body.idToken);
					break;
				case 'updateProfile':
					response = await identityPlatform.updateProfile(body.idToken, body.displayName, body.photoUrl);
					break;
				case 'changeEmail':
					response = await identityPlatform.changeEmail(body.idToken, body.email);
					break;
				case 'changePassword':
					response = await identityPlatform.changePassword(body.idToken, body.password);
					break;
				case 'sendEmailVerification':
					response = await identityPlatform.sendEmailVerification(body.idToken);
					break;
				case 'confirmEmailVerification':
					response = await identityPlatform.confirmEmailVerification(body.oobCode);
					break;
				case 'deleteAccount':
					response = await identityPlatform.deleteAccount(body.idToken);
					break;
				// 可以根据需要添加更多 action
				default:
					return json({ error: `Unknown action: ${action}` }, { status: 404 });
			}

			// @ts-expect-error: response 包含 error 时, 我们需要检查并设置正确的状态码
			if (response && response.error) {
				// @ts-expect-error: response 包含 error 时, 我们需要检查并设置正确的状态码
				return json(response, { status: response.error.code || 400 });
			}

			return json(response);

		} catch (e) {
			const error = e as Error;
			return json({ error: error.message }, { status: 500 });
		}
	};
}
