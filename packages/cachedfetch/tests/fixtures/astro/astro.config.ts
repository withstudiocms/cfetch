import { defineConfig } from 'astro/config';
import astroCache from '@studiocms/cachedfetch';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	integrations: [astroCache()],
});
