import { defineProject } from 'vitest/config';

process.env.NODE_OPTIONS ??= '--enable-source-maps';
process.setSourceMapsEnabled(true);

export default defineProject({
	test: {
		maxConcurrency: 1,
		name: '@studiocms/cachedfetch',
		exclude: [
			'**/node_modules/**',
			'**/dist/**',
			'**/playwright/**',
			'**/cypress/**',
			'**/.{idea,git,cache,output,temp}/**',
			'**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*',
		],
	},
});
