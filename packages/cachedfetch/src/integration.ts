import type { AstroIntegration } from 'astro';
import { addVirtualImports, createResolver } from './utils.js';

export function astroCache(): AstroIntegration {
	const name = '@studiocms/cachedfetch';
	const { resolve } = createResolver(import.meta.url);
	return {
		name,
		hooks: {
			'astro:config:setup': (params) => {
				addVirtualImports(params, {
					name,
					imports: {
						'studiocms:cachedfetch': `export * from '${resolve('./wrappers.js')}';`,
					},
				});
			},
		},
	};
}
