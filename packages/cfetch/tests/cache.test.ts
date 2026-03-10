import { Effect, Layer } from 'effect';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type CacheEntry, CacheMaps, CacheService } from '../src/cache';

vi.mock('virtual:cfetch/config', () => ({
	default: {
		defaultTTL: 1000, // 1 second TTL for testing
	},
}));

describe('CacheService', () => {
	let CacheMapLayer: Layer.Layer<CacheMaps, never, never>;
	let CacheLive: Layer.Layer<CacheService, never, never>;

	beforeEach(() => {
		const store = new Map<string, CacheEntry<unknown>>();
		const tagIndex = new Map<string, Set<string>>();
		CacheMapLayer = Layer.succeed(CacheMaps, { store, tagIndex });
		CacheLive = CacheService.Default.pipe(Layer.provide(CacheMapLayer));
	});

	it('should set and get a value', async () => {
		const effect = Effect.gen(function* () {
			const cache = yield* CacheService;
			yield* cache.set('key1', 'value1');
			const result = yield* cache.get<string>('key1');
			return result;
		}).pipe(Effect.provide(CacheLive));

		const result = await Effect.runPromise(effect);
		expect(result).toBe('value1');
	});

	it('should return null for non-existent key', async () => {
		const effect = Effect.gen(function* () {
			const cache = yield* CacheService;
			const result = yield* cache.get<string>('nonexistent');
			return result;
		}).pipe(Effect.provide(CacheLive));

		const result = await Effect.runPromise(effect);
		expect(result).toBeNull();
	});

	it('should delete a cache entry', async () => {
		const effect = Effect.gen(function* () {
			const cache = yield* CacheService;
			yield* cache.set('key1', 'value1');
			yield* cache.delete('key1');
			const result = yield* cache.get<string>('key1');
			return result;
		}).pipe(Effect.provide(CacheLive));

		const result = await Effect.runPromise(effect);
		expect(result).toBeNull();
	});

	it('should invalidate entries by tags', async () => {
		const effect = Effect.gen(function* () {
			const cache = yield* CacheService;
			yield* cache.set('user:1', { id: 1 }, { tags: ['user', 'profile'] });
			yield* cache.set('user:2', { id: 2 }, { tags: ['user'] });
			yield* cache.invalidateTags(['user']);

			const result1 = yield* cache.get('user:1');
			const result2 = yield* cache.get('user:2');
			return { result1, result2 };
		}).pipe(Effect.provide(CacheLive));

		const { result1, result2 } = await Effect.runPromise(effect);
		expect(result1).toBeNull();
		expect(result2).toBeNull();
	});

	it('should clear all cache entries', async () => {
		const effect = Effect.gen(function* () {
			const cache = yield* CacheService;
			yield* cache.set('key1', 'value1');
			yield* cache.set('key2', 'value2', { tags: ['tag1'] });
			yield* cache.clear();

			const result1 = yield* cache.get<string>('key1');
			const result2 = yield* cache.get<string>('key2');
			return { result1, result2 };
		}).pipe(Effect.provide(CacheLive));

		const { result1, result2 } = await Effect.runPromise(effect);
		expect(result1).toBeNull();
		expect(result2).toBeNull();
	});

	it('should support multiple tags per entry', async () => {
		const effect = Effect.gen(function* () {
			const cache = yield* CacheService;
			yield* cache.set('data', { id: 1 }, { tags: ['tag1', 'tag2', 'tag3'] });
			yield* cache.invalidateTags(['tag2']);

			const result = yield* cache.get('data');
			return result;
		}).pipe(Effect.provide(CacheLive));

		const result = await Effect.runPromise(effect);
		expect(result).toBeNull();
	});

	it('should handle complex object values', async () => {
		const effect = Effect.gen(function* () {
			const cache = yield* CacheService;
			const userData = { name: 'John', age: 30, email: 'john@example.com' };
			yield* cache.set('user', userData);
			const result = yield* cache.get<typeof userData>('user');
			return result;
		}).pipe(Effect.provide(CacheLive));

		const result = await Effect.runPromise(effect);
		expect(result).toEqual({ name: 'John', age: 30, email: 'john@example.com' });
	});
});
