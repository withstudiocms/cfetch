/// <reference types='./cache.d.ts' preserve="true" />
import type { AstroIntegration } from 'astro';
import { defaultConfig } from './consts.js';
import type { CacheConfig } from './types.js';
import { addVirtualImports, createResolver } from './utils/integration.js';
import stub from './stub.js';

/**
 * Astro integration that allows you to have a cached fetch function in your Astro SSR project.
 *
 * This integration will add a virtual import for `cached:fetch` that you can use in your components.
 *
 * @returns {AstroIntegration} The integration object for Astro
 * @see {@link https://github.com/withstudiocms/cfetch} for more details
 * @example
 * ```typescript
 * import { defineConfig } from 'astro/config';
 * import cFetch from '@studiocms/cfetch';
 *
 * export default defineConfig({
 *   integrations: [
 *     cFetch({
 * 	     lifetime: '1h', // OPTIONAL Cache lifetime, can be '<number>m' or '<number>h'
 *     })
 *   ],
 * });
 * ```
 *
 * then in your components you can use:
 *
 * ```typescript
 * import { cFetch } from 'c:fetch';
 *
 * const response = await cFetch('https://example.com/api/data');
 * const data = await response.json();
 * // Use the data in your component
 * ```
 */
export function astroCache(opts?: CacheConfig): AstroIntegration {
	const name = '@studiocms/cfetch';
	const { resolve } = createResolver(import.meta.url);
	const options: CacheConfig = {
		...defaultConfig,
		...opts,
	};
	return {
		name,
		hooks: {
			'astro:config:setup': (params) => {
				addVirtualImports(params, {
					name,
					imports: {
						'virtual:cfetch/config': `export default ${JSON.stringify(options)}`,
						'c:fetch': `export * from '${resolve('./wrappers.js')}';`,
					},
				});
			},
			'astro:config:done': ({ injectTypes }) => {
				injectTypes({
					filename: 'cfetch.d.ts',
					content: stub,
				});
			},
		},
	};
}

export default astroCache;
