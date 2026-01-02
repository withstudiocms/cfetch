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
    lifetime: Duration.Duration;
}