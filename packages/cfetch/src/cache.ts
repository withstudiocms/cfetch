/**
 * @module cfetch/cache
 * Cache service implementation using Effect-TS.
 */

import { Clock, Context, Duration, Effect } from 'effect';
import { defaultConfigLive } from './consts.ts';

/**
 * Represents a cache entry with its value, expiration time, last updated time, and tags.
 */
export interface CacheEntry<A> {
	value: A;
	expiresAt: number;
	lastUpdatedAt: number; // Timestamp of last update
	tags: Set<string>; // For tag-based invalidation
}

/**
 * Represents the status of a cache entry, including expiration and tags.
 */
export interface CacheEntryStatus {
	expiresAt: Date;
	lastUpdatedAt: Date;
	tags: Set<string>;
}

/**
 * Tag to hold the in-memory cache maps.
 *
 * This tag provides access to the main cache store and the tag index for invalidation.
 */
export class CacheMaps extends Context.Tag('@studiocms/cfetch/CacheMaps')<
	CacheMaps,
	{
		store: Map<string, CacheEntry<unknown>>;
		tagIndex: Map<string, Set<string>>;
	}
>() {}

/**
 * Error thrown when there is an issue fetching the cache configuration.
 */
class ConfigFetchError {
	readonly _tag = 'ConfigFetchError';
}

/**
 * Fetches the cache configuration from the virtual module.
 * Falls back to default configuration if not available.
 */
const getConfig = async () => {
	try {
		const config = await import('virtual:cfetch/config');
		return config.default;
	} catch (error) {
		console.warn('Could not load virtual:cfetch/config, using default config.');
		return defaultConfigLive;
	}
};

/**
 * A service for managing cached data with TTL (time-to-live) and tag-based invalidation.
 *
 * @remarks
 * This service provides an in-memory cache with the following features:
 * - Automatic expiration based on TTL
 * - Tag-based organization for batch invalidation
 * - Effect-based API for safe side-effect management
 *
 * @example
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const cache = yield* CacheService;
 *
 *   // Set a value with custom TTL and tags
 *   yield* cache.set('user:123', userData, {
 *     ttl: Duration.minutes(5),
 *     tags: ['user', 'profile']
 *   });
 *
 *   // Get a value
 *   const result = yield* cache.get('user:123');
 *
 *   // Invalidate all entries with specific tags
 *   yield* cache.invalidateTags(['user']);
 * });
 * ```
 *
 * @public
 */
export class CacheService extends Effect.Service<CacheService>()('@studiocms/cfetch/CacheService', {
	effect: Effect.gen(function* () {
		const { store, tagIndex } = yield* CacheMaps;

		/**
		 * Get the Cache Configuration from the virtual module, with a fallback to default configuration.
		 *
		 * This function attempts to load the cache configuration from the virtual module `virtual:cfetch/config`. If the module is not available or fails to load, it catches the error and returns a default configuration. This ensures that the cache service always has a valid configuration to work with, even in environments where the virtual module cannot be resolved.
		 *
		 * @returns {import('virtual:cfetch/config').CacheConfigLive} The cache configuration object
		 * @throws {ConfigFetchError} If there is an error fetching the configuration
		 */
		const config = yield* Effect.tryPromise({
			try: () => getConfig(),
			catch: () => new ConfigFetchError(),
		}).pipe(Effect.catchTag('ConfigFetchError', () => Effect.succeed(defaultConfigLive)));

		/**
		 * Retrieves a value from the cache by its key, checking for expiration and returning null if the entry is not found or has expired.
		 *
		 * @template A - The type of the cached value
		 * @param key - The key associated with the cached entry
		 * @returns An Effect that yields the cached value of type A, or null if not found or expired
		 */
		const get = <A>(key: string) =>
			Effect.gen(function* () {
				const now = yield* Clock.currentTimeMillis;
				const entry = store.get(key) as CacheEntry<A> | undefined;

				if (!entry) return null;
				if (entry.expiresAt < now) {
					// Entry has expired
					yield* deleteKey(key);
					return null;
				}

				return entry.value;
			});

		/**
		 * Sets a value in the cache with an optional TTL and tags for invalidation.
		 *
		 * This function adds a new entry to the cache with the specified key and value. It calculates the expiration time based on the provided TTL (or the default lifetime from the configuration) and associates any provided tags with the entry for later invalidation. If tags are provided, it also updates the tag index to allow for efficient invalidation of entries by tag.
		 *
		 * @template A - The type of the value being cached
		 * @param key - The key to associate with the cached entry
		 * @param value - The value to cache
		 * @param options - Optional configuration for the cache entry, including TTL and tags
		 */
		const set = <A>(
			key: string,
			value: A,
			options?: { ttl?: Duration.DurationInput; tags?: string[] }
		) =>
			Effect.gen(function* () {
				const now = yield* Clock.currentTimeMillis;
				const ttl = options?.ttl ?? Duration.millis(config.lifetime);
				const tags = new Set(options?.tags ?? []);

				const expiresAt = now + Duration.toMillis(ttl);
				store.set(key, { value, expiresAt, lastUpdatedAt: now, tags });

				for (const tag of tags) {
					if (!tagIndex.has(tag)) {
						tagIndex.set(tag, new Set());
					}
					tagIndex.get(tag)?.add(key);
				}
			});

		/**
		 * Deletes a cache entry by its key, removing it from the cache and updating the tag index accordingly.
		 *
		 * This function removes a cache entry identified by the given key from the main cache store. If the entry exists, it also iterates through the associated tags and updates the tag index to remove references to the deleted key. If a tag no longer has any keys associated with it after deletion, the tag is removed from the index entirely.
		 *
		 * @param key - The key of the cache entry to delete
		 * @returns An Effect that performs the deletion when executed
		 */
		const deleteKey = (key: string) =>
			Effect.sync(() => {
				const entry = store.get(key);
				if (entry) {
					for (const tag of entry.tags) {
						const keys = tagIndex.get(tag);
						if (keys) {
							keys.delete(key);
							if (keys.size === 0) {
								tagIndex.delete(tag);
							}
						}
					}
					store.delete(key);
				}
			});

		/**
		 * Invalidates cache entries based on specified tags, removing all entries associated with those tags from the cache.
		 *
		 * This function takes an array of tags and iterates through each tag to find all associated cache keys from the tag index. It then deletes each of those keys from the cache using the `deleteKey` function. This allows for efficient batch invalidation of cache entries that are grouped by common tags.
		 *
		 * @param tags - An array of tags for which to invalidate associated cache entries
		 * @returns An Effect that performs the invalidation when executed
		 */
		const invalidateTags = (tags: string[]) =>
			Effect.gen(function* () {
				for (const tag of tags) {
					const keys = tagIndex.get(tag);
					if (keys) {
						// Copy keys to array to avoid mutation during iteration
						for (const key of [...keys]) {
							yield* deleteKey(key);
						}
					}
				}
			});

		/**
		 * Clears the entire cache, removing all entries and resetting the tag index.
		 *
		 * This function completely empties the cache store and the tag index, effectively resetting the cache to an empty state. It is useful for scenarios where a full cache reset is needed, such as during development or when significant changes occur that invalidate all cached data.
		 *
		 * @returns An Effect that performs the cache clearing when executed
		 */
		const clear = () =>
			Effect.sync(() => {
				store.clear();
				tagIndex.clear();
			});

		return {
			get,
			set,
			delete: deleteKey,
			invalidateTags,
			clear,
		};
	}),
}) {}
