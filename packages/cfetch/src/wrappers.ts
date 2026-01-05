/**
 * @module cfetch/wrappers
 *
 * Provides cached fetch wrappers using Effect for caching capabilities.
 *
 * This module exports functions to perform HTTP requests with built-in caching logic.
 * It defines types for cached responses and errors, and implements functions to fetch
 * data with various parsing options (JSON, text, Blob) while leveraging an in-memory
 * cache layer.
 */

import { Data, type Duration, Effect, Layer } from 'effect';
import { type CacheEntry, CacheMaps, CacheService } from './cache.js';

export type { CacheConfig } from './types.js';
export { Duration } from 'effect';

// In-memory cache maps
const store = new Map<string, CacheEntry<unknown>>();
const tagIndex = new Map<string, Set<string>>();
const CacheMapLayer = Layer.succeed(CacheMaps, { store, tagIndex });

// Create the cache layer
const CacheLive = CacheService.Default.pipe(Layer.provide(CacheMapLayer));

/**
 * Custom error type for fetch-related errors.
 */
export class FetchError extends Data.TaggedError('FetchError')<{
	message: string;
	cause?: unknown;
}> {}

// Cached data structure
export interface CachedResponse<T> {
	data: T;
	ok: boolean;
	status: number;
	statusText: string;
	headers: Record<string, string>;
}

/**
 * Configuration options for cached fetch requests.
 */
export interface CFetchConfig {
	ttl?: Duration.DurationInput;
	tags?: string[];
	key?: string;
	verbose?: boolean;
}

/**
 * Helper to run an Effect and return a Promise.
 */
const runEffect = <A, E>(effect: Effect.Effect<A, E, never>): Promise<A> =>
	Effect.runPromise(effect);

// HTTP methods that are cacheable
const cacheableMethods = ['GET', 'HEAD'];

/**
 * No-op parser for HEAD requests.
 *
 * @template U - The type of the parsed data
 * @param _ - The Response object (ignored)
 * @returns A Promise that resolves to undefined
 */
export const noOpParser = <U>(_: Response): Promise<U> => Promise.resolve(undefined as U);

// ========================================================
// Effects
// ========================================================

/**
 * Fetches data from a URL and parses the response using a provided parser function.
 *
 * @template T - The type of the parsed data
 * @param url - The URL to fetch from, either as a string or URL object
 * @param parser - An async function that takes a Response and returns the parsed data of type T
 * @param options - Optional fetch configuration options (headers, method, body, etc.)
 * @returns An Effect that yields a CachedResponse containing the parsed data, response status, headers, and metadata
 * @throws {FetchError} When the fetch operation fails or when response parsing fails
 *
 * @example
 * ```typescript
 * const result = await Effect.runPromise(
 *   fetchAndParse('https://api.example.com/data', (res) => res.json())
 * );
 * ```
 */
const fetchAndParse = <T>(
	url: string | URL,
	parser: (response: Response) => Promise<T>,
	options?: RequestInit
): Effect.Effect<CachedResponse<T>, FetchError, never> =>
	Effect.gen(function* () {
		// Perform the fetch operation
		const response = yield* Effect.tryPromise({
			try: () => fetch(url, options),
			catch: (cause) => new FetchError({ message: 'Failed to fetch', cause }),
		});

		// Parse the response using the provided parser
		const data = yield* Effect.tryPromise({
			try: () => parser(response),
			catch: (cause) => new FetchError({ message: 'Failed to parse response', cause }),
		});

		// Return the cached response structure
		return {
			data,
			ok: response.ok,
			status: response.status,
			statusText: response.statusText,
			headers: Object.fromEntries(response.headers.entries()),
		} satisfies CachedResponse<T>;
	});

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
 * - Only 2xx responses are cached
 * - Users needing negative caching should implement custom logic
 * - The effect is provided with CacheLive layer automatically
 * - Non-cacheable HTTP methods (e.g. POST, PUT) bypass the cache entirely
 * - The parser function is bypassed for HEAD requests, returning undefined data
 * - Verbose logging can be enabled via cacheConfig.verbose
 *
 * @example
 * ```typescript
 * const effect = cFetchEffect(
 *   'https://api.example.com/data',
 *   (res) => res.json(),
 *   { method: 'GET' },
 *   { ttl: Duration.minutes(5), tags: ['api-data'] }
 * );
 * ```
 */
export const cFetchEffect = <T>(
	url: string | URL,
	parser: (response: Response) => Promise<T>,
	options?: RequestInit,
	cacheConfig?: CFetchConfig
): Effect.Effect<CachedResponse<T>, FetchError, never> =>
	Effect.gen(function* () {
		const cache = yield* CacheService;

		const { key, verbose = false, ...cacheOpts } = cacheConfig || {};

		// Determine HTTP method
		const method = options?.method?.toUpperCase() || 'GET';

		// Bypass cache for non-cacheable methods
		if (!cacheableMethods.includes(method)) {
			if (verbose) console.log(`[c:fetch] Bypassing cache for non-cacheable method: ${method}`);
			return yield* fetchAndParse<T>(url, parser, options);
		}

		// Get URL string
		const urlString = typeof url === 'string' ? url : url.href;

		// Filter to only cache-relevant, serializable options
		const cacheRelevantOptions = options
			? {
					method: options.method,
					headers:
						options.headers instanceof Headers
							? Object.fromEntries(
									[...options.headers.entries()].sort(([a], [b]) => a.localeCompare(b))
								)
							: options.headers
								? Object.fromEntries(
										Object.entries(options.headers).sort(([a], [b]) => a.localeCompare(b))
									)
								: undefined,
					body: typeof options.body === 'string' ? options.body : undefined,
				}
			: {};

		// Warn if body is non-serializable and no explicit key provided
		if (options?.body && typeof options.body !== 'string' && !key && verbose) {
			console.warn(
				`[c:fetch] Non-serializable request body detected for ${urlString}. Consider providing an explicit cache key via cacheConfig.key to avoid collisions.`
			);
		}

		const cacheKey = key ?? `${urlString}-${JSON.stringify(cacheRelevantOptions)}`;

		// Check cache first
		const cached = yield* cache.get<CachedResponse<T>>(cacheKey);

		if (cached) {
			if (verbose) console.log(`[c:fetch] Cache hit for: ${cacheKey}, returning cached response.`);
			return cached;
		}

		if (verbose) console.log(`[c:fetch] Cache miss for: ${cacheKey}, fetching from network.`);

		// Get the needed parser (no-op for HEAD requests)
		const effectiveParser = method === 'HEAD' ? noOpParser : parser;

		// Create cached response with metadata
		const cachedResponse = yield* fetchAndParse<T>(url, effectiveParser, options);

		// Cache successful responses
		if (cachedResponse.ok) {
			yield* cache.set(cacheKey, cachedResponse, cacheOpts);
			if (verbose) console.log(`[c:fetch] Cached response for: ${cacheKey}`);
		}

		// Return the cached response
		return cachedResponse;
	}).pipe(Effect.provide(CacheLive));

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
 *
 * @example
 * ```typescript
 * const effect = cFetchEffectJson<User>(
 *   'https://api.example.com/user/123',
 *   { method: 'GET' },
 *   { ttl: Duration.minutes(5), tags: ['user'] }
 * );
 * ```
 */
export const cFetchEffectJson = <T>(
	url: string | URL,
	options?: RequestInit,
	cacheConfig?: CFetchConfig
): Effect.Effect<CachedResponse<T>, FetchError, never> =>
	cFetchEffect(url, (res) => res.json() as Promise<T>, options, cacheConfig);

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
 *
 * @example
 * ```typescript
 * const textEffect = cFetchEffectText(
 *   'https://api.example.com/data',
 *   { method: 'GET' },
 *   { ttl: Duration.minutes(5), tags: ['api', 'data'] }
 * );
 * ```
 */
export const cFetchEffectText = (
	url: string | URL,
	options?: RequestInit,
	cacheConfig?: CFetchConfig
): Effect.Effect<CachedResponse<string>, FetchError, never> =>
	cFetchEffect(url, (res) => res.text(), options, cacheConfig);

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
 *
 * @example
 * ```typescript
 * const imageEffect = cFetchEffectBlob(
 *   'https://example.com/image.png',
 *   { method: 'GET' },
 *   { ttl: Duration.hours(1), tags: ['images'] }
 * );
 * ```
 */
export const cFetchEffectBlob = (
	url: string | URL,
	options?: RequestInit,
	cacheConfig?: CFetchConfig
): Effect.Effect<CachedResponse<Blob>, FetchError, never> =>
	cFetchEffect(url, (res) => res.blob(), options, cacheConfig);

// ========================================================
// Regular Functions
// ========================================================

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
 *
 * @example
 * ```typescript
 * const result = await cFetch(
 *   'https://api.example.com/data',
 *   (res) => res.json(),
 *   { method: 'GET' },
 *   { ttl: Duration.minutes(5), tags: ['api-data'] }
 * );
 * ```
 */
export const cFetch = <T>(
	url: string | URL,
	parser: (response: Response) => Promise<T>,
	options?: RequestInit,
	cacheConfig?: CFetchConfig
): Promise<CachedResponse<T>> => runEffect(cFetchEffect(url, parser, options, cacheConfig));

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
 *
 * @example
 * ```typescript
 * const result = await cFetchJson<User>('https://api.example.com/user/123', {
 *   method: 'GET',
 *   headers: { 'Authorization': 'Bearer token' }
 * }, {
 *   ttl: Duration.minutes(5),
 *   tags: ['user-data']
 * });
 * ```
 */
export const cFetchJson = <T>(
	url: string | URL,
	options?: RequestInit,
	cacheConfig?: CFetchConfig
): Promise<CachedResponse<T>> => runEffect(cFetchEffectJson(url, options, cacheConfig));

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
 *
 * @example
 * ```typescript
 * const result = await cFetchText('https://api.example.com/data', {
 *   method: 'GET'
 * }, {
 *   ttl: Duration.hours(1),
 *   tags: ['api', 'data']
 * });
 * ```
 */
export const cFetchText = (
	url: string | URL,
	options?: RequestInit,
	cacheConfig?: CFetchConfig
): Promise<CachedResponse<string>> => runEffect(cFetchEffectText(url, options, cacheConfig));

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
 *
 * @example
 * ```typescript
 * const response = await cFetchBlob('https://example.com/image.png', {}, { ttl: Duration.minutes(5) });
 * const blob = response.data;
 * ```
 */
export const cFetchBlob = (
	url: string | URL,
	options?: RequestInit,
	cacheConfig?: CFetchConfig
): Promise<CachedResponse<Blob>> => runEffect(cFetchEffectBlob(url, options, cacheConfig));
