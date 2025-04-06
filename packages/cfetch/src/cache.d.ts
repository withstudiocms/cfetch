declare module 'virtual:cfetch/config' {
	/**
	 * Default configuration for the cache passed from the user.
	 *
	 * @property lifetime - Specifies the duration for which the cache is valid.
	 *                       The format should be a template literal string representing
	 *                       either minutes (`<number>m`) or hours (`<number>h`).
	 *                       For example: "5m" for 5 minutes or "2h" for 2 hours.
	 */
	const defaultConfig: import('./types').CacheConfig;
	export default defaultConfig;
}

declare module 'c:fetch' {
	/**
	 * Represents the type of the global `fetch` function.
	 *
	 * This type is derived from the built-in `fetch` function, allowing you to
	 * use it as a reference for type-safe operations involving `fetch`.
	 */
	type FetchType = typeof fetch;
	/**
	 * Represents the input parameter type for the `FetchType` function.
	 * This type is derived from the first parameter of the `FetchType` function.
	 */
	type Input = Parameters<FetchType>[0];
	/**
	 * Represents the `init` parameter of the `fetch` function, which is the second parameter
	 * in the `FetchType` function signature. This type is used to configure the request,
	 * including options such as method, headers, body, and other settings.
	 */
	type Init = Parameters<FetchType>[1];
	/**
	 * Represents the structure of cached data.
	 *
	 * @property lastCheck - The date and time when the cache was last checked.
	 * @property data - The cached response data.
	 */
	type CacheDataValue = { lastCheck: Date; data: Response };
	/**
	 * Represents the configuration for caching.
	 *
	 * @property lifetime - Specifies the duration for which the cache is valid.
	 *                       The format should be a template literal string representing
	 *                       either minutes (`<number>m`) or hours (`<number>h`).
	 *                       For example: "5m" for 5 minutes or "2h" for 2 hours.
	 */
	export interface CacheConfig {
		/**
		 * Specifies the duration for which the cache is valid.
		 *     The format should be a template literal string representing
		 *     either minutes (`<number>m`) or hours (`<number>h`).
		 *     For example: "5m" for 5 minutes or "2h" for 2 hours.
		 */
		lifetime: `${number}m` | `${number}h`;
	}
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
	export function cFetch(
		input: Input,
		init?: Init,
		cacheConfig?: Partial<CacheConfig>,
		type?: 'json' | 'text'
	): Promise<Response>;
	export function cFetch(
		input: Input,
		init?: Init,
		cacheConfig?: Partial<CacheConfig>,
		type?: 'json' | 'text',
		metadata?: boolean
	): Promise<CacheDataValue>;
}
