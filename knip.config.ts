import type { KnipConfig } from 'knip';

const config: KnipConfig = {
	exclude: ['duplicates', 'optionalPeerDependencies'],
	ignoreDependencies: ['c'],
	workspaces: {
		'.': {
			ignoreDependencies: ['@changesets/config', '@changesets/write'],
			entry: ['.github/workflows/*.yml', 'scripts/*.{cjs,ts}'],
			project: ['.github/workflows/*.yml', 'scripts/*.{cjs,ts}'],
		},
		'packages/*': {
			entry: ['src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			project: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			astro: {
				entry: ['src/**/*.astro'],
				project: ['src/**/*.astro'],
			},
		},
		'packages/*/tests/fixtures/astro': {
			ignoreDependencies: ['sharp'],
			entry: ['src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			project: ['src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			astro: {
				entry: [
					'astro.config.{js,cjs,mjs,ts,mts}',
					'src/content/config.ts',
					'src/content.config.ts',
					'src/pages/**/*.{astro,mdx,js,ts}',
					'src/content/**/*.mdx',
					'src/components/**/*.{astro,js,ts}',
					'src/middleware.{js,ts}',
					'src/actions/index.{js,ts}',
				],
			},
		},
	},
};

export default config;
