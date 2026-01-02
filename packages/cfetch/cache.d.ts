declare module 'virtual:cfetch/config' {
	type CacheConfig = import('./src/types.js').CacheConfig;

	const defaultConfig: CacheConfig;
	export default defaultConfig;
}

declare module 'c:fetch' {
	export type CacheConfig = import('./src/types.js').CacheConfig;
	export type CachedResponse<T> = import('./src/wrappers.js').CachedResponse<T>;

	export const Duration: typeof import('./src/wrappers.js').Duration;

	export const cFetchEffect: typeof import('./src/wrappers.js').cFetchEffect;
	export const cFetchEffectJson: typeof import('./src/wrappers.js').cFetchEffectJson;
	export const cFetchEffectText: typeof import('./src/wrappers.js').cFetchEffectText;
	export const cFetchEffectBlob: typeof import('./src/wrappers.js').cFetchEffectBlob;

	export const cFetch: typeof import('./src/wrappers.js').cFetch;
	export const cFetchJson: typeof import('./src/wrappers.js').cFetchJson;
	export const cFetchText: typeof import('./src/wrappers.js').cFetchText;
	export const cFetchBlob: typeof import('./src/wrappers.js').cFetchBlob;
}
