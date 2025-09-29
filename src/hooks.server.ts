import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { handleApis } from '$lib/server/hooks.js';

// 这是一个其他钩子的示例。
// 您可以根据需要添加任意数量的钩子。
const logger: Handle = async ({ event, resolve }) => {
	const start = Date.now();
	console.log(`[Logger] --> ${event.request.method} ${event.url.pathname}`);
	const response = await resolve(event);
	console.log(`[Logger] <-- ${response.status} (${Date.now() - start}ms)`);
	return response;
};

// 顺序很重要。`sequence` 将按照提供的顺序运行它们。
// 我们的 API 处理器将在日志记录器之后运行。
export const handle = sequence(
	logger,
	handleApis
	// 在此处添加其他钩子
);