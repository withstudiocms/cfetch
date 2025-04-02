import type { APIRoute } from 'astro';

export const GET: APIRoute = () => {
	return new Response(JSON.stringify({ foo: 'bar' }), {
		status: 200,
		headers: {
			'Content-Type': 'application/json',
		},
	});
};
