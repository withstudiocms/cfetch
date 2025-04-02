import type { KnipConfig } from 'knip';

const config: KnipConfig = {
	exclude: ['duplicates', 'optionalPeerDependencies'],
	workspaces: {
		'.': {
			ignoreDependencies: ['@changesets/config', '@changesets/write'],
			entry: ['.github/workflows/*.yml', 'scripts/*.{cjs,ts}'],
			project: ['.github/workflows/*.yml', 'scripts/*.{cjs,ts}'],
		},
		'build-scripts': {
			entry: '{index,cli}.js',
			project: '**/*.js',
		},
		'packages/*': {
			ignoreDependencies: ['@grapesjs/studio-sdk-plugins'],
			entry: ['src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			project: ['**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			astro: {
				entry: ['src/**/*.astro'],
				project: ['src/**/*.astro'],
			},
		},
		playground: {
			ignoreDependencies: ['sharp'],
			entry: ['src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			project: ['src/**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}'],
			astro: {
				entry: [
					'studiocms.config.{js,cjs,mjs,ts,mts}',
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
