/**
 * @module cfetch/consts
 *
 * Constant values used throughout the cfetch package.
 */

import { Duration } from 'effect';
import type { CacheConfig, CacheConfigLive } from './types.ts';

/**
 * Default cache configuration for cfetch.
 *
 * This configuration sets the default lifetime of cached entries to 1 hour.
 */
export const defaultConfig: CacheConfig = {
	lifetime: Duration.hours(1),
};

/**
 * Default cache configuration with live values for internal use.
 *
 * This configuration converts the lifetime to milliseconds for use in caching logic.
 */
export const defaultConfigLive: CacheConfigLive = {
	lifetime: Duration.toMillis(Duration.hours(1)),
};
