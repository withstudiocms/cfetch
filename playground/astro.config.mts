import node from '@astrojs/node';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	site: 'https://test.studiocms.dev',
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	security: {
		checkOrigin: false,
	},
	integrations: [],
});
