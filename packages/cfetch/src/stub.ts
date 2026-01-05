/**
 * This module contains a stub file for type generation
 * @module
 */

import { createResolver } from './utils/integration.js';

const { resolve } = createResolver(import.meta.url);

const stub = `
declare module 'virtual:cfetch/config' {
	type CacheConfig = import("${resolve('./types.js')}").CacheConfigLive;
	const defaultConfig: CacheConfig;
	export default defaultConfig;
}

declare module 'c:fetch' {
	export type CacheConfig = import("${resolve('./types.js')}").CacheConfig;
	export type CachedResponse<T> = import("${resolve('./wrappers.js')}").CachedResponse<T>;
	export type CFetchConfig = import("${resolve('./wrappers.js')}").CFetchConfig;
	
	export const Duration: typeof import("${resolve('./wrappers.js')}").Duration;

	declare const FetchError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => import("effect/Cause").YieldableError & {
		readonly _tag: "FetchError";
	} & Readonly<A>;

	/**
	 * Custom error type for fetch-related errors.
	 */
	export declare class FetchError extends FetchError_base<{
		message: string;
		cause?: unknown;
	}> {
	}

	/**
	 * No-op parser for HEAD requests.
	 * 
	 * @template U - The type of the parsed data
	 * @param _ - The Response object (ignored)
	 * @returns A Promise that resolves to undefined
	 */
	export const noOpParser: typeof import("${resolve('./wrappers.js')}").noOpParser;

	/**
	 * Fetches data from a URL with caching capabilities using Effect.
	 * 
	 * This function performs an HTTP request with built-in caching logic. It first checks
	 * the cache for existing data, and if not found, fetches from the network, parses the
	 * response, and caches successful responses for future use.
	 * 
	 * @template T - The type of the parsed response data
	 * 
	 * @param url - The URL to fetch data from
	 * @param parser - A function that parses the Response object into type T
	 * @param options - Optional RequestInit configuration for the fetch request
	 * @param cacheConfig - Optional cache configuration object
	 * @param cacheConfig.ttl - Time-to-live duration for the cached entry
	 * @param cacheConfig.tags - Tags to associate with the cached entry for invalidation
	 * @param cacheConfig.key - Custom cache key (defaults to URL and options hash)
	 * 
	 * @returns An Effect that yields a CachedResponse containing the parsed data and response metadata
	 * 
	 * @throws {FetchError} When the network request fails or response parsing fails
	 * 
	 * @remarks
	 * - Cache keys are automatically generated from the URL and options if not provided
	 * - Only successful responses (response.ok === true) are cached
	 * - Cache hits are logged to console for debugging
	 * - The effect is provided with CacheLive layer automatically
	 */
	export const cFetchEffect: typeof import("${resolve('./wrappers.js')}").cFetchEffect;

	/**
	 * Creates an Effect that fetches JSON data from a URL with caching support.
	 * 
	 * @template T - The expected type of the JSON response data
	 * @param url - The URL to fetch data from
	 * @param options - Optional fetch configuration options (headers, method, etc.)
	 * @param cacheConfig - Optional cache configuration
	 * @param cacheConfig.ttl - Time-to-live duration for the cached response
	 * @param cacheConfig.tags - Tags to associate with the cached entry for invalidation
	 * @param cacheConfig.key - Custom cache key to use instead of the default URL-based key
	 * @returns An Effect that yields a CachedResponse containing the parsed JSON data, or fails with a FetchError
	 */
	export const cFetchEffectJson: typeof import("${resolve('./wrappers.js')}").cFetchEffectJson;


	/**
	 * Fetches a resource from the specified URL and returns the response body as text.
	 * 
	 * @param url - The URL to fetch the resource from.
	 * @param options - Optional fetch configuration including method, headers, body, etc.
	 * @param cacheConfig - Optional cache configuration.
	 * @param cacheConfig.ttl - Time-to-live duration for the cached response.
	 * @param cacheConfig.tags - Array of tags to associate with the cached entry for invalidation purposes.
	 * @param cacheConfig.key - Custom cache key. If not provided, the URL will be used as the key.
	 * 
	 * @returns An Effect that resolves to a CachedResponse containing the response text,
	 *          or fails with a FetchError if the request fails.
	 */
	export const cFetchEffectText: typeof import("${resolve('./wrappers.js')}").cFetchEffectText;

	/**
	 * Fetches a resource and returns it as a Blob with caching support.
	 * 
	 * @param url - The URL of the resource to fetch
	 * @param options - Optional fetch request configuration (headers, method, etc.)
	 * @param cacheConfig - Optional cache configuration object
	 * @param cacheConfig.ttl - Time-to-live duration for the cached response
	 * @param cacheConfig.tags - Array of tags to associate with the cached entry
	 * @param cacheConfig.key - Custom cache key to use instead of the default
	 * 
	 * @returns An Effect that resolves to a CachedResponse containing a Blob, or fails with a FetchError
	 */
	export const cFetchEffectBlob: typeof import("${resolve('./wrappers.js')}").cFetchEffectBlob;

	/**
	 * Executes a cached fetch request with configurable caching behavior.
	 * 
	 * @template T - The type of data returned after parsing the response
	 * @param url - The URL to fetch from
	 * @param parser - A function that parses the Response object into the desired type T
	 * @param options - Optional fetch request configuration (headers, method, body, etc.)
	 * @param cacheConfig - Optional cache configuration object
	 * @param cacheConfig.ttl - Time-to-live duration for the cached response
	 * @param cacheConfig.tags - Array of tags to associate with the cached entry for invalidation purposes
	 * @param cacheConfig.key - Custom cache key; if not provided, a key will be generated from the URL and options
	 * @returns A Promise that resolves to a CachedResponse containing the parsed data
	 */
	export const cFetch: typeof import("${resolve('./wrappers.js')}").cFetch;

	/**
	 * Fetches and parses JSON data from the specified URL with caching support.
	 * 
	 * @template T - The expected type of the parsed JSON response data
	 * @param url - The URL to fetch data from
	 * @param options - Optional fetch configuration options (headers, method, body, etc.)
	 * @param cacheConfig - Optional cache configuration object
	 * @param cacheConfig.ttl - Time-to-live duration for the cached response
	 * @param cacheConfig.tags - Array of tags to associate with the cached entry for invalidation purposes
	 * @param cacheConfig.key - Custom cache key to use instead of the default
	 * @returns A Promise that resolves to a CachedResponse containing the parsed JSON data of type T
	 */
	export const cFetchJson: typeof import("${resolve('./wrappers.js')}").cFetchJson;

	/**
	 * Fetches a URL and returns the response as text with caching support.
	 * 
	 * @param url - The URL to fetch
	 * @param options - Optional fetch configuration options (headers, method, etc.)
	 * @param cacheConfig - Optional cache configuration
	 * @param cacheConfig.ttl - Time-to-live duration for the cached response
	 * @param cacheConfig.tags - Tags to associate with the cached response for invalidation
	 * @param cacheConfig.key - Custom cache key (defaults to URL if not provided)
	 * @returns A promise that resolves to a CachedResponse containing the response text
	 */
	export const cFetchText: typeof import("${resolve('./wrappers.js')}").cFetchText;

	/**
	 * Fetches a Blob resource from the specified URL with optional caching configuration.
	 * 
	 * @param url - The URL to fetch the Blob resource from
	 * @param options - Optional fetch request configuration (headers, method, etc.)
	 * @param cacheConfig - Optional cache configuration object
	 * @param cacheConfig.ttl - Time-to-live duration for the cached response
	 * @param cacheConfig.tags - Array of cache tags for cache invalidation
	 * @param cacheConfig.key - Custom cache key for storing the response
	 * @returns A Promise that resolves to a CachedResponse containing a Blob
	 */
	export const cFetchBlob: typeof import("${resolve('./wrappers.js')}").cFetchBlob;
}

`;

export default stub;
