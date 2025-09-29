import type { Handle, RequestEvent } from '@sveltejs/kit';

type ApiHandler = (event: RequestEvent) => Promise<Response>;

const apiRoutes = new Map<string, ApiHandler>();

/**
 * Register an API handler for a specific path prefix.
 * @param path The path prefix (e.g., '/api/auth')
 * @param handler The function to handle requests to this path.
 */
export function registerApi(path: string, handler: ApiHandler): void {
	if (apiRoutes.has(path)) {
		console.warn(`API path already registered: ${path}. Overwriting.`);
	}
	apiRoutes.set(path, handler);
}

/**
 * The main SvelteKit handle function that dispatches to registered API handlers.
 */
export const handleApis: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;

	for (const [path, handler] of apiRoutes.entries()) {
		if (pathname.startsWith(path)) {
			return await handler(event);
		}
	}

	// If no API route matches, continue with normal SvelteKit routing.
	return resolve(event);
};
