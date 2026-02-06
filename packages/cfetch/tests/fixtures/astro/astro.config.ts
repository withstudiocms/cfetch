import node from '@astrojs/node';
import cFetch from '@studiocms/cfetch';
import { defineConfig } from 'astro/config';
import { hmrIntegration } from 'astro-integration-kit/dev';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	integrations: [
		cFetch(),
		hmrIntegration({
			directory: '../../../dist',
		}),
	],
});
