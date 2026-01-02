/**
 * @module @studiocms/cfetch
 *
 * An Astro integration that provides a caching fetch utility using Effect.
 *
 * This module exports the `cFetch` function, which can be used to create an Astro
 * integration that adds virtual modules for cached fetching capabilities. It also
 * exports the `Duration` type from Effect for specifying cache lifetimes.
 *
 * The `cFetch` integration injects virtual modules:
 * - `virtual:cfetch/config`: Exports the default cache configuration.
 * - `c:fetch`: Exports various cached fetch functions and types.
 *
 * Example usage:
 *
 * ```ts
 * import cFetch, { Duration } from '@studiocms/cfetch';
 * import { defineConfig } from 'astro/config';
 *
 * export default defineConfig({
 *   integrations: [
 *     cFetch({
 *       lifetime: Duration.minutes(5), // Set cache lifetime to 5 minutes (default is 1 hour)
 *     }),
 *   ],
 * });
 * ```
 * 
 * You can then use the cached fetch functions in your Astro components or pages:
 * 
 * ```ts
 * import { cFetch } from 'c:fetch';
 * 
 * const response = await cFetch('https://api.example.com/data', (res) => res.json());
 * console.log(response.data);
 * ```
 */

import type { AstroIntegration } from 'astro';
import { addVirtualImports, createResolver } from './utils/integration.js';
import type { CacheConfig } from './types.js';
import { defaultConfig } from './consts.js';
import stub from './stub.js';
import { Duration } from 'effect';

export { Duration } from 'effect';

/**
 * Creates a caching fetch integration for Astro.
 * 
 * This integration provides a cached fetch implementation that can be configured
 * with custom cache lifetime and other options. It sets up virtual module imports
 * and injects TypeScript type definitions for the cached fetch functionality.
 * 
 * @param opts - Optional cache configuration options to customize the caching behavior
 * @returns An Astro integration object with hooks for configuration setup and completion
 * 
 * @example
 * ```typescript
 * // astro.config.mjs
 * import cFetch, { Duration } from '@studiocms/cfetch';
 * 
 * export default defineConfig({
 *   integrations: [
 *     cFetch({
 *       lifetime: Duration.minutes(10), // Cache entries live for 10 minutes (default is 1 hour)
 *     })
 *   ]
 * });
 * ```
 */
export function cFetch(opts?: CacheConfig): AstroIntegration {
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
						'virtual:cfetch/config': `export default ${JSON.stringify({
							// Convert Duration.DurationInput to milliseconds number (required to preserve value through JSON.stringify)
							lifetime: Duration.toMillis(options.lifetime)
						})}`,
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

export default cFetch;
