import node from '@astrojs/node';
import cFetch from '@studiocms/cfetch';
import { hmrIntegration } from 'astro-integration-kit/dev';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	integrations: [
		cFetch(),
		...(process.env.vitest !== 'true'
			? [
					hmrIntegration({
						directory: '../../../dist',
					}),
				]
			: []),
	],
});
