/// <reference types='./cache.d.ts' preserve="true" />
import type { AstroIntegration } from 'astro';
import { addVirtualImports, createResolver } from './utils.js';

/**
 * Astro integration which provides a cacheable fetch function for Astro SSR
 *
 * @example
 * ```typescript
 * import cFetch from '@studiocms/cfetch';
 *
 * export default defineConfig({
 *   integrations: [cFetch()],
 * });
 * ```
 */
export function astroCache(): AstroIntegration {
	const name = '@studiocms/cfetch';
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
