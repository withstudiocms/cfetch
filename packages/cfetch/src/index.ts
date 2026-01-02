/**
 * This module contains the AstroIntegration for cFetch
 * @module
 */

import type { AstroIntegration } from 'astro';
import { addVirtualImports, createResolver } from './utils/integration.js';
import type { CacheConfig } from './types.js';
import { defaultConfig } from './consts.js';
import stub from './stub.js';
import { Duration } from 'effect';

export { Duration } from 'effect';

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
