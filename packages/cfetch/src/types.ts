/**
 * This module contains types for the cfetch package
 * @module
 */

/**
 * Represents the type of the global `fetch` function.
 *
 * This type is derived from the built-in `fetch` function, allowing you to
 * use it as a reference for type-safe operations involving `fetch`.
 */
export type FetchType = typeof fetch;

/**
 * Represents the input parameter type for the `FetchType` function.
 * This type is derived from the first parameter of the `FetchType` function.
 */
export type Input = Parameters<FetchType>[0];

/**
 * Represents the `init` parameter of the `fetch` function, which is the second parameter
 * in the `FetchType` function signature. This type is used to configure the request,
 * including options such as method, headers, body, and other settings.
 */
export type Init = Parameters<FetchType>[1];

/**
 * Represents the structure of cached data.
 *
 * @property lastCheck - The date and time when the cache was last checked.
 * @property data - The cached response data.
 */
export type CacheDataValue = { lastCheck: Date; data: Response };

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
