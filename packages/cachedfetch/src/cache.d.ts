declare module 'studiocms:cachedfetch' {
	type FetchType = typeof fetch;
	type Input = Parameters<FetchType>[0];
	type Init = Parameters<FetchType>[1];
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

	export function cachedFetch(
		input: Input,
		init: Init,
		cacheConfig?: Partial<CacheConfig>
	): Promise<Response>;
	export function cachedFetch(
		input: Input,
		init: Init,
		cacheConfig?: Partial<CacheConfig>,
		metadata?: boolean
	): Promise<CacheDataValue>;
}
