import { Context, Duration, Clock, Effect } from "effect";
import { defaultConfig } from "./consts";

// Define the cache entry type
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

export class CacheMaps extends Context.Tag("@studiocms/cfetch/CacheMaps")<CacheMaps, {
    store: Map<string, CacheEntry<unknown>>,
    tagIndex: Map<string, Set<string>>
}>() { }

class ConfigFetchError {
    readonly _tag = "ConfigFetchError";
}

const getConfig = async () => {
    try {
        const config = await import("virtual:cfetch/config");
        return config.default;
    } catch (error) {
        console.warn("Could not load virtual:cfetch/config, using default config.");
        return defaultConfig;
    }
}

export class CacheServiceNew extends Effect.Service<CacheServiceNew>()(
    '@studiocms/cfetch/CacheService',
    {
        effect: Effect.gen(function* () {
            const { store, tagIndex } = yield* CacheMaps;
            const config = yield* Effect.tryPromise({
                try: () => getConfig(),
                catch: () => new ConfigFetchError(),
            }).pipe(
                Effect.catchTag("ConfigFetchError", () => Effect.succeed(defaultConfig))
            );

            const get = <A>(key: string) => Effect.gen(function* () {
                const now = yield* Clock.currentTimeMillis;
                const entry = store.get(key) as CacheEntry<A> | undefined;

                if (!entry) return null;
                if (entry.expiresAt < now) {
                    // Entry has expired
                    yield* deleteKey(key);
                    return null;
                }

                return entry.value;
            })

            const set = <A>(
                key: string,
                value: A,
                options?: { ttl?: Duration.Duration; tags?: string[] }
            ) => Effect.gen(function* () {
                const now = yield* Clock.currentTimeMillis;
                const ttl = options?.ttl ?? config.lifetime;
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

            const deleteKey = (key: string) => Effect.sync(() => {
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
                Effect.sync(() => {
                    for (const tag of tags) {
                        const keys = tagIndex.get(tag);
                        if (keys) {
                            for (const key of keys) {
                                store.delete(key);
                            }
                            tagIndex.delete(tag);
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
            }
        })
    }
) { }

// // Define the cache service interface
// export interface CacheService {
//     get: <T>(key: string) => Effect.Effect<T | null, never>;
//     set: <T>(key: string, value: T, ttl?: number) => Effect.Effect<void, never>;
//     has: (key: string) => Effect.Effect<boolean, never>;
//     delete: (key: string) => Effect.Effect<void, never>;
//     clear: () => Effect.Effect<void, never>;
// }

// // Create the service tag
// export class Cache extends Context.Tag("Cache")<Cache, CacheService>() { }

// // Implement the in-memory cache
// export const makeCacheService = (map: Map<string, CacheEntry<any>>): CacheService => {
//     const cache = map;
//     const defaultTTL = 5 * 60 * 1000; // 5 minutes

//     return {
//         get: <T>(key: string) =>
//             Effect.sync(() => {
//                 const entry = cache.get(key);
//                 if (!entry) return null;

//                 // Check if entry has expired
//                 const now = Date.now();
//                 if (entry.timestamp && now - entry.timestamp > defaultTTL) {
//                     cache.delete(key);
//                     return null;
//                 }

//                 return entry.data as T;
//             }),

//         set: <T>(key: string, value: T, ttl?: DurationInput) =>
//             Effect.sync(() => {
//                 cache.set(key, {
//                     data: value,
//                     timestamp: Date.now(),
//                 });
//             }),

//         has: (key: string) =>
//             Effect.sync(() => {
//                 const entry = cache.get(key);
//                 if (!entry) return false;

//                 // Check if expired
//                 const now = Date.now();
//                 if (entry.timestamp && now - entry.timestamp > defaultTTL) {
//                     cache.delete(key);
//                     return false;
//                 }

//                 return true;
//             }),

//         delete: (key: string) =>
//             Effect.sync(() => {
//                 cache.delete(key);
//             }),

//         clear: () =>
//             Effect.sync(() => {
//                 cache.clear();
//             }),
//     };
// };