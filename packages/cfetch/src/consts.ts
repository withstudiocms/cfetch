/**
 * This module contains constants for cFetch
 * @module
 */

import type { CacheConfig } from './types.js';

/**
 * Default cache configuration object.
 *
 * @property {string} lifetime - The duration for which the cache is valid.
 *                               Accepts a string representation of time, e.g., '1h' for 1 hour.
 */
export const defaultConfig: CacheConfig = {
	lifetime: '1h',
};
