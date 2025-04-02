declare module 'studiocms:cachedfetch' {
	/**
	 * Represents the configuration for caching.
	 *
	 * @property lifetime - Specifies the duration for which the cache is valid.
	 *                       The format should be a template literal string representing
	 *                       either minutes (`<number>m`) or hours (`<number>h`).
	 *                       For example: "5m" for 5 minutes or "2h" for 2 hours.
	 */
	export type CacheConfig = import('./wrappers').CacheConfig;
	/**
	 * Fetches a resource using the Fetch API with caching capabilities.
	 *
	 * This function checks if the requested resource is already cached and if the cache is still valid
	 * based on the provided or default cache configuration. If the cache is valid, it returns the cached
	 * response. Otherwise, it fetches the resource from the network, updates the cache, and returns the
	 * new response.
	 *
	 * @param input - The input to the fetch request, which can be a URL string or a Request object.
	 * @param init - An optional configuration object for the fetch request, such as headers or method.
	 * @param cacheConfig - An optional partial configuration object for cache settings, such as lifetime.
	 *
	 * @returns A promise that resolves to the response of the fetch request, either from the cache or the network.
	 */
	export const cachedFetch: typeof import('./wrappers').cachedFetch;
}
