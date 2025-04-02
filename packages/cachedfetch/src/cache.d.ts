declare module 'studiocms:cachedfetch' {
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
	export declare function cachedFetch(
		input: Input,
		init: Init,
		cacheConfig?: Partial<CacheConfig>
	): Promise<Response>;
	export declare function cachedFetch(
		input: Input,
		init: Init,
		cacheConfig?: Partial<CacheConfig>,
		metadata?: boolean
	): Promise<CacheDataValue>;
}
