import type { CacheConfig, CacheDataValue, Init, Input } from './types.js';
import isOlderThan from './utils/isOlderThan.js';
import { defaultConfig as _config } from './consts.js';

export type { CacheConfig };

/**
 * Loads the default configuration for the application by dynamically importing
 * the module `virtual:cfetch/config`. If the import is successful, it merges
 * the default export of the module with its `lifetime` property to create the
 * configuration object. If the import fails, it falls back to using `_config`.
 */
const defaultConfig = await import('virtual:cfetch/config')
	.then((mod) => {
		return mod.default;
	})
	.catch(() => {
		return _config;
	});

/**
 * Exported for tests
 */
export const cachedData = new Map<string, CacheDataValue>();

export async function cFetch(
	input: Input,
	init?: Init,
	cacheConfig?: Partial<CacheConfig>
): Promise<Response>;
export async function cFetch(
	input: Input,
	init?: Init,
	cacheConfig?: Partial<CacheConfig>,
	metadata?: boolean
): Promise<CacheDataValue>;

/**
 * Fetches data with caching capabilities. If the data is not present in the cache
 * or the cached data is older than the specified lifetime, it fetches new data
 * and updates the cache. Otherwise, it returns the cached data.
 *
 * @param input - The input to the fetch function, typically a URL or Request object.
 * @param init - An optional configuration object for the fetch request.
 * @param cacheConfig - Partial configuration for the cache behavior. Defaults to `defaultConfig`.
 * @param metadata - A boolean indicating whether to return the full cached object (including metadata)
 *               or just the data. Defaults to `false`.
 * @returns The fetched or cached data. If `full` is `true`, returns an object containing
 *          both the data and metadata (e.g., `lastCheck`).
 * @throws An error if fetching new data fails and no cached data is available.
 */
export async function cFetch(
	input: Input,
	init: Init = undefined,
	cacheConfig: Partial<CacheConfig> = defaultConfig,
	metadata = false
) {
	if (init?.method && init.method !== 'GET') {
		console.warn(
			'Warning: cFetch is designed for GET requests. Using it with other methods will not cache the response.'
		);
		const newResponse = fetch(input, init);
		return metadata ? { lastCheck: new Date(), data: newResponse } : newResponse;
	}

	const { lifetime }: CacheConfig = {
		...defaultConfig,
		...cacheConfig,
	};

	const storedData = cachedData.get(input.toString());

	if (!storedData || isOlderThan(storedData.lastCheck, lifetime)) {
		const newResponse = await fetch(input, init);
		if (!newResponse.ok) {
			if (!storedData) {
				throw new Error('Failed to retrieve cached data, and failed to fetch new data');
			}
			return metadata ? storedData : storedData.data;
		}
		const newCachedData = { lastCheck: new Date(), data: newResponse };
		cachedData.set(input.toString(), newCachedData);
		return metadata ? newCachedData : newResponse;
	}
	return metadata ? storedData : storedData.data;
}
