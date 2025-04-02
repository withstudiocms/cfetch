import { defineConfig } from 'astro/config';
import astroCache from '@studiocms/cachedfetch';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: node({ mode: 'standalone' }),
	integrations: [astroCache()],
});
