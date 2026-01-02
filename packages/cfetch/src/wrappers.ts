import { Effect, Layer, Data, type Duration } from "effect";
import { CacheServiceNew, CacheMaps, type CacheEntry } from "./cache.js";

export type { CacheConfig } from "./types.js";
export { Duration } from 'effect';

// In-memory cache maps
const store = new Map<string, CacheEntry<unknown>>();
const tagIndex = new Map<string, Set<string>>();
const CacheMapLayer = Layer.succeed(CacheMaps, { store, tagIndex });

// Create the cache layer
const CacheLive = CacheServiceNew.Default.pipe(
    Layer.provide(CacheMapLayer)
)

// Define fetch errors
class FetchError extends Data.TaggedError("FetchError")<{
    message: string;
    cause?: unknown;
}> { }

// Cached data structure
export interface CachedResponse<T> {
    data: T;
    status: number;
    statusText: string;
    headers: Record<string, string>;
}

interface CFetchConfig {
    ttl?: Duration.DurationInput;
    tags?: string[];
    key?: string;
    verbose?: boolean;
}

// ========================================================
// Effects
// ========================================================

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
    url: string,
    parser: (response: Response) => Promise<T>,
    options?: RequestInit,
    cacheConfig?: CFetchConfig
): Effect.Effect<CachedResponse<T>, FetchError, never> =>
    Effect.gen(function* () {
        const { key, verbose = false, ...cacheOpts } = cacheConfig || {};

        const cache = yield* CacheServiceNew;
        const cacheKey = key || `${url}-${JSON.stringify(options || {})}`;

        // Check cache first
        const cached = yield* cache.get<CachedResponse<T>>(cacheKey);
        if (cached) {
            verbose && console.log(`Cache hit for: ${url}`);
            return cached;
        }

        verbose && console.log(`Cache miss for: ${url}`);

        // Fetch from network
        const response = yield*
            Effect.tryPromise({
                try: () => fetch(url, options),
                catch: (cause) => new FetchError({ message: "Failed to fetch", cause }),
            });

        // Parse the response data
        const data = yield*
            Effect.tryPromise({
                try: () => parser(response),
                catch: (cause) => new FetchError({ message: "Failed to parse response", cause }),
            });

        // Create cached response with metadata
        const cachedResponse: CachedResponse<T> = {
            data,
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
        };

        // Cache successful responses
        if (response.ok) {
            yield* cache.set(cacheKey, cachedResponse, cacheOpts);
        }

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
    url: string,
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
    url: string,
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
    url: string,
    options?: RequestInit,
    cacheConfig?: CFetchConfig
): Effect.Effect<CachedResponse<Blob>, FetchError, never> =>
    cFetchEffect(url, (res) => res.blob(), options, cacheConfig);

/**
 * Helper to run an Effect and return a Promise.
 */
const runEffect = <A, E>(effect: Effect.Effect<A, E, never>): Promise<A> => Effect.runPromise(effect);

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
    url: string,
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
    url: string,
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
    url: string,
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
    url: string,
    options?: RequestInit,
    cacheConfig?: CFetchConfig
): Promise<CachedResponse<Blob>> => runEffect(cFetchEffectBlob(url, options, cacheConfig));