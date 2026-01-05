/**
 * @module cfetch/consts
 *
 * Constant values used throughout the cfetch package.
 */

import { Duration } from 'effect';
import type { CacheConfig, CacheConfigLive } from './types.js';

export const defaultConfig: CacheConfig = {
	lifetime: Duration.hours(1),
};

export const defaultConfigLive: CacheConfigLive = {
	lifetime: Duration.toMillis(Duration.hours(1)),
};
