type FetchType = typeof fetch;

type Input = Parameters<FetchType>[0];
type Init = Parameters<FetchType>[1];

const cachedData = new Map<string, { lastCheck: Date; data: Response }>();

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

/**
 * Fetches a resource using the Fetch API with caching capabilities.
 *
 * This function checks if the requested resource is already cached and if the cache is still valid
 * based on the provided or default cache configuration. If the cache is valid, it returns the cached
 * response. Otherwise, it fetches the resource from the network, updates the cache, and returns the
 * new response.
 *
 * @param input - The input to the fetch request, which can be a URL string or a Request object.
 * @param init - An optional configuration object for the fetch request, such as headers or method.
 * @param cacheConfig - An optional partial configuration object for cache settings, such as lifetime.
 *
 * @returns A promise that resolves to the response of the fetch request, either from the cache or the network.
 */
export async function cachedFetch(
	input: Input,
	init: Init,
	cacheConfig?: Partial<CacheConfig>
): Promise<Response> {
	const config: CacheConfig = {
		...defaultConfig,
		...cacheConfig,
	};

	const cachedFetch = cachedData.get(input.toString());

	if (!cachedFetch || isOlderThan(cachedFetch.lastCheck, config?.lifetime)) {
		const fetchData = await fetch(input, init);
		cachedData.set(input.toString(), { lastCheck: new Date(), data: fetchData });
		return fetchData;
	}
	return cachedFetch.data;
}
