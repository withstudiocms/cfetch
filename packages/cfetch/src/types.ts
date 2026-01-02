import type { Duration } from 'effect';

/**
 * Configuration options for caching behavior.
 * 
 * @remarks
 * This type defines how long cached data should be retained before being considered stale.
 * 
 * @example
 * ```ts
 * const config: CacheConfig = {
 *   lifetime: Duration.seconds(60)
 * };
 * ```
 */
export type CacheConfig = {
    lifetime: Duration.DurationInput;
}

/**
 * Configuration options for cache lifetime management.
 * 
 * @remarks
 * This type defines the configuration for controlling how long cached data remains valid
 * before it needs to be refreshed or invalidated.
 * 
 * @example
 * ```typescript
 * const cacheConfig: CacheConfigLive = {
 *   lifetime: 3600 // Cache valid for 1 hour (in seconds)
 * };
 * ```
 */
export type CacheConfigLive = {
    lifetime: number;
}