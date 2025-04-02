import type { APIContext, APIRoute } from 'astro';
import { cachedFetch } from 'cached:fetch';

export const GET: APIRoute = async (ctx: APIContext) => {
	const origin = ctx.url.origin;

	const exampleAPI = new URL('/example', origin);

	const response = await cachedFetch(exampleAPI);

	if (!response.ok) {
		return new Response(null, {
			status: 400,
		});
	}

	const data = await response.json();

	return new Response(data.foo, {
		status: 200,
	});
};
