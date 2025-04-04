import type { APIContext, APIRoute } from 'astro';
import { cFetch } from 'c:fetch';

export const GET: APIRoute = async (ctx: APIContext) => {
	const origin = ctx.url.origin;

	const exampleAPI = new URL('/example', origin);

	const response = await cFetch(exampleAPI);

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
