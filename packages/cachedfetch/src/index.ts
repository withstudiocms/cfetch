/// <reference types='./cache.d.ts' preserve="true" />
import type { AstroIntegration } from 'astro';
import { addVirtualImports, createResolver } from './utils.js';

/**
 * Astro integration which provides a cacheable fetch function for Astro SSR
 *
 * @example
 * ```typescript
 * import astroCache from '@studiocms/cachedfetch';
 *
 * export default defineConfig({
 *   integrations: [astroCache()],
 * });
 * ```
 */
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
						'cached:fetch': `export * from '${resolve('./wrappers.js')}';`,
					},
				});
			},
		},
	};
}

export default astroCache;
