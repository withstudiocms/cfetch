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
		const config = yield* Effect.tryPromise({
			try: () => getConfig(),
			catch: () => new ConfigFetchError(),
		}).pipe(Effect.catchTag('ConfigFetchError', () => Effect.succeed(defaultConfigLive)));

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
