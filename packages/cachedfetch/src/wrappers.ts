type FetchType = typeof fetch;

type Input = Parameters<FetchType>[0];
type Init = Parameters<FetchType>[1];

type CacheDataValue = { lastCheck: Date; data: Response };

const cachedData = new Map<string, CacheDataValue>();

/**
 * Represents the configuration for caching.
 *
 * @property lifetime - Specifies the duration for which the cache is valid.
 *                       The format should be a template literal string representing
 *                       either minutes (`<number>m`) or hours (`<number>h`).
 *                       For example: "5m" for 5 minutes or "2h" for 2 hours.
 */
export interface CacheConfig {
	/**
	 * Specifies the duration for which the cache is valid.
	 *     The format should be a template literal string representing
	 *     either minutes (`<number>m`) or hours (`<number>h`).
	 *     For example: "5m" for 5 minutes or "2h" for 2 hours.
	 */
	lifetime: `${number}m` | `${number}h`;
}

const defaultConfig: CacheConfig = {
	lifetime: '1h',
};

function isOlderThan(date: Date, lifetime: `${number}m` | `${number}h`): boolean {
	const now = new Date();
	let milliseconds = 0;

	if (lifetime.endsWith('m')) {
		milliseconds = Number.parseInt(lifetime) * 60 * 1000; // Convert minutes to ms
	} else if (lifetime.endsWith('h')) {
		milliseconds = Number.parseInt(lifetime) * 60 * 60 * 1000; // Convert hours to ms
	}

	return date < new Date(now.getTime() - milliseconds);
}

export async function cachedFetch(
	input: Input,
	init: Init,
	cacheConfig?: Partial<CacheConfig>
): Promise<Response>;
export async function cachedFetch(
	input: Input,
	init: Init,
	cacheConfig?: Partial<CacheConfig>,
	metadata?: boolean
): Promise<CacheDataValue>;

/**
 * Fetches data with caching capabilities. If the data is not present in the cache
 * or the cached data is older than the specified lifetime, it fetches new data
 * and updates the cache. Otherwise, it returns the cached data.
 *
 * @param input - The input to the fetch function, typically a URL or Request object.
 * @param init - An optional configuration object for the fetch request.
 * @param cacheConfig - Partial configuration for the cache behavior. Defaults to `defaultConfig`.
 * @param metadata - A boolean indicating whether to return the full cached object (including metadata)
 *               or just the data. Defaults to `false`.
 * @returns The fetched or cached data. If `full` is `true`, returns an object containing
 *          both the data and metadata (e.g., `lastCheck`).
 * @throws An error if fetching new data fails and no cached data is available.
 */
export async function cachedFetch(
	input: Input,
	init: Init,
	cacheConfig: Partial<CacheConfig> = defaultConfig,
	metadata = false
) {
	const config: CacheConfig = {
		...defaultConfig,
		...cacheConfig,
	};

	const storedData = cachedData.get(input.toString());

	if (!storedData || isOlderThan(storedData.lastCheck, config?.lifetime)) {
		const newData = await fetch(input, init);
		if (!newData.ok) {
			if (!storedData)
				throw new Error('Failed to retrieve cached data, and failed to fetch new data');
			return metadata ? storedData : storedData.data;
		}
		const newCachedData = { lastCheck: new Date(), data: newData };
		cachedData.set(input.toString(), newCachedData);
		return metadata ? newCachedData : newData;
	}
	return metadata ? storedData : storedData.data;
}
