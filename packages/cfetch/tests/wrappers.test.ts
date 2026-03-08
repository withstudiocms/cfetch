import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    cFetch,
    cFetchJson,
    cFetchText,
    cFetchBlob,
    cFetchEffect,
    cFetchEffectJson,
    cFetchEffectText,
    cFetchEffectBlob,
    invalidateCache,
    invalidateCacheEffect,
    FetchError,
    noOpParser,
} from '../src/wrappers';

vi.mock('virtual:cfetch/config', () => ({
    default: {
        defaultTTL: 1000, // 1 second TTL for testing
    },
}));

describe('wrappers', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        // Clear the global fetch mock
        vi.unstubAllGlobals();
    });

    describe('FetchError', () => {
        it('should create a FetchError with message and cause', () => {
            const cause = new Error('Network error');
            const error = new FetchError({ message: 'Failed to fetch', cause });
            expect(error.message).toBe('Failed to fetch');
            expect(error.cause).toBe(cause);
        });
    });

    describe('noOpParser', () => {
        it('should return undefined for any input', async () => {
            const mockResponse = new Response('test');
            const result = await noOpParser(mockResponse);
            expect(result).toBeUndefined();
        });
    });

    describe('cFetch', () => {
        it('should fetch and parse JSON data', async () => {
            const mockData = { id: 1, name: 'Test' };
            global.fetch = vi.fn(() =>
                Promise.resolve(
                    new Response(JSON.stringify(mockData), {
                        status: 200,
                        statusText: 'OK',
                        headers: { 'content-type': 'application/json' },
                    })
                )
            );

            const result = await cFetch('https://api.example.com/data', (res) => res.json());

            expect(result.data).toEqual(mockData);
            expect(result.ok).toBe(true);
            expect(result.status).toBe(200);
        });

        it('should cache responses on subsequent calls', async () => {
            const mockData = { id: 1 };
            const fetchSpy = vi.fn(() =>
                Promise.resolve(
                    new Response(JSON.stringify(mockData), {
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                    })
                )
            );
            global.fetch = fetchSpy;

            const url = `https://api.example.com/data-${Date.now()}`;
            await cFetch(url, (res) => res.json());
            await cFetch(url, (res) => res.json());

            expect(fetchSpy).toHaveBeenCalledTimes(1);
        });

        it('should handle fetch errors', async () => {
            const fetchSpy = vi.fn(() => Promise.reject(new Error('Network failed')));
            global.fetch = fetchSpy;

            const url = `https://api.example.com/error-${Date.now()}`;
            await expect(cFetch(url, (res) => res.json())).rejects.toThrow();
        });

        it('should bypass cache for non-cacheable methods without forceCache', async () => {
            global.fetch = vi.fn(() =>
                Promise.resolve(
                    new Response('{"data":"test"}', {
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                    })
                )
            );

            await cFetch('https://api.example.com/data', (res) => res.json(), { method: 'POST' });
            await cFetch('https://api.example.com/data', (res) => res.json(), { method: 'POST' });

            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it('should cache non-cacheable methods with forceCache enabled', async () => {
            global.fetch = vi.fn(() =>
                Promise.resolve(
                    new Response('{"data":"test"}', {
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                    })
                )
            );

            await cFetch('https://api.example.com/data', (res) => res.json(), { method: 'POST' }, { forceCache: true });
            await cFetch('https://api.example.com/data', (res) => res.json(), { method: 'POST' }, { forceCache: true });

            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('should use custom cache key', async () => {
            global.fetch = vi.fn(() =>
                Promise.resolve(
                    new Response('{"data":"test"}', {
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                    })
                )
            );

            await cFetch('https://api.example.com/data', (res) => res.json(), {}, { key: 'custom-key' });
            await cFetch('https://api.example.com/data', (res) => res.json(), {}, { key: 'custom-key' });

            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('should not cache failed responses', async () => {
            const fetchSpy = vi.fn(() =>
                Promise.resolve(
                    new Response('Not found', {
                        status: 404,
                        statusText: 'Not Found',
                        headers: {},
                    })
                )
            );
            global.fetch = fetchSpy;

            const url = `https://api.example.com/data-${Date.now()}`;
            await cFetch(url, (res) => res.text());
            await cFetch(url, (res) => res.text());

            expect(fetchSpy).toHaveBeenCalledTimes(2);
        });
    });

    describe('cFetchJson', () => {
        it('should fetch and parse JSON', async () => {
            const mockData = { id: 1, name: 'Test' };
            global.fetch = vi.fn(() =>
                Promise.resolve(
                    new Response(JSON.stringify(mockData), {
                        status: 200,
                        statusText: 'OK',
                        headers: { 'content-type': 'application/json' },
                    })
                )
            );

            const result = await cFetchJson('https://api.example.com/data');

            expect(result.data).toEqual(mockData);
            expect(result.ok).toBe(true);
        });

        it('should cache JSON responses', async () => {
            const fetchSpy = vi.fn(() =>
                Promise.resolve(
                    new Response('{"id":1}', {
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                    })
                )
            );
            global.fetch = fetchSpy;

            const url = `https://api.example.com/data-${Date.now()}`;
            await cFetchJson(url);
            await cFetchJson(url);

            expect(fetchSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('cFetchText', () => {
        it('should fetch and return text', async () => {
            const mockText = 'Hello World';
            const fetchSpy = vi.fn(() =>
                Promise.resolve(
                    new Response(mockText, {
                        status: 200,
                        statusText: 'OK',
                        headers: { 'content-type': 'text/plain' },
                    })
                )
            );
            global.fetch = fetchSpy;

            const url = `https://api.example.com/text-${Date.now()}`;
            const result = await cFetchText(url);

            expect(result.data).toBe(mockText);
            expect(result.ok).toBe(true);
        });

        it('should cache text responses', async () => {
            const fetchSpy = vi.fn(() =>
                Promise.resolve(
                    new Response('test content', {
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                    })
                )
            );
            global.fetch = fetchSpy;

            const url = `https://api.example.com/text-data-${Date.now()}`;
            await cFetchText(url);
            await cFetchText(url);

            expect(fetchSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('cFetchBlob', () => {
        it('should fetch and return Blob', async () => {
            const mockBlob = new Blob(['test content'], { type: 'text/plain' });
            global.fetch = vi.fn(() =>
                Promise.resolve(
                    new Response(mockBlob, {
                        status: 200,
                        statusText: 'OK',
                        headers: { 'content-type': 'text/plain' },
                    })
                )
            );

            const result = await cFetchBlob('https://example.com/file.txt');

            expect(result.data).toBeInstanceOf(Blob);
            expect(result.ok).toBe(true);
        });

        it('should cache Blob responses', async () => {
            const mockBlob = new Blob(['test'], { type: 'text/plain' });
            const fetchSpy = vi.fn(() =>
                Promise.resolve(
                    new Response(mockBlob, {
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                    })
                )
            );
            global.fetch = fetchSpy;

            const url = `https://example.com/file-${Date.now()}.txt`;
            await cFetchBlob(url);
            await cFetchBlob(url);

            expect(fetchSpy).toHaveBeenCalledTimes(1);
        });
    });

    describe('cFetchEffect', () => {
        it('should return an Effect', async () => {
            global.fetch = vi.fn(() =>
                Promise.resolve(
                    new Response('{"data":"test"}', {
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                    })
                )
            );

            const effect = cFetchEffect('https://api.example.com/data', (res) => res.json());
            expect(effect).toBeDefined();
        });
    });

    describe('cFetchEffectJson', () => {
        it('should return an Effect for JSON parsing', async () => {
            global.fetch = vi.fn(() =>
                Promise.resolve(
                    new Response('{"id":1}', {
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                    })
                )
            );

            const effect = cFetchEffectJson('https://api.example.com/data');
            expect(effect).toBeDefined();
        });
    });

    describe('cFetchEffectText', () => {
        it('should return an Effect for text parsing', async () => {
            global.fetch = vi.fn(() =>
                Promise.resolve(
                    new Response('text content', {
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                    })
                )
            );

            const effect = cFetchEffectText('https://api.example.com/data');
            expect(effect).toBeDefined();
        });
    });

    describe('cFetchEffectBlob', () => {
        it('should return an Effect for Blob parsing', async () => {
            const mockBlob = new Blob(['content'], { type: 'text/plain' });
            global.fetch = vi.fn(() =>
                Promise.resolve(
                    new Response(mockBlob, {
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                    })
                )
            );

            const effect = cFetchEffectBlob('https://example.com/file.txt');
            expect(effect).toBeDefined();
        });
    });

    describe('invalidateCache', () => {
        it('should invalidate cache by keys', async () => {
            global.fetch = vi.fn(() =>
                Promise.resolve(
                    new Response('{"id":1}', {
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                    })
                )
            );

            await cFetchJson('https://api.example.com/data', {}, { key: 'test-key' });
            await invalidateCache({ keys: ['test-key'] });
            await cFetchJson('https://api.example.com/data', {}, { key: 'test-key' });

            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it('should invalidate cache by tags', async () => {
            global.fetch = vi.fn(() =>
                Promise.resolve(
                    new Response('{"id":1}', {
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                    })
                )
            );

            await cFetchJson('https://api.example.com/user', {}, { tags: ['user'] });
            await invalidateCache({ tags: ['user'] });
            await cFetchJson('https://api.example.com/user', {}, { tags: ['user'] });

            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('invalidateCacheEffect', () => {
        it('should return an Effect for cache invalidation', async () => {
            const effect = invalidateCacheEffect({ keys: ['test-key'] });
            expect(effect).toBeDefined();
        });
    });

    describe('CachedResponse', () => {
        it('should include all required properties', async () => {
            const headers = new Headers();
            headers.set('x-custom', 'header');
            headers.set('content-type', 'application/json');

            const fetchSpy = vi.fn(() =>
                Promise.resolve(
                    new Response('{"id":1}', {
                        status: 200,
                        statusText: 'OK',
                        headers: headers,
                    })
                )
            );
            global.fetch = fetchSpy;

            const url = `https://api.example.com/data-${Date.now()}`;
            const result = await cFetchJson(url);

            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('ok');
            expect(result).toHaveProperty('status');
            expect(result).toHaveProperty('statusText');
            expect(result).toHaveProperty('headers');
            expect(result.headers['x-custom']).toBe('header');
        });
    });

    describe('HEAD requests', () => {
        it('should use noOpParser for HEAD requests', async () => {
            global.fetch = vi.fn(() =>
                Promise.resolve(
                    new Response(null, {
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                    })
                )
            );

            const result = await cFetch('https://api.example.com/data', (res) => res.json(), {
                method: 'HEAD',
            });

            expect(result.data).toBeUndefined();
        });
    });

    describe('URL object support', () => {
        it('should accept URL objects', async () => {
            const fetchSpy = vi.fn(() =>
                Promise.resolve(
                    new Response('{"id":1}', {
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                    })
                )
            );
            global.fetch = fetchSpy;

            const url = new URL(`https://api.example.com/data-${Date.now()}`);
            const result = await cFetchJson(url);

            expect(result.data).toEqual({ id: 1 });
        });
    });

    describe('Headers handling', () => {
        it('should preserve custom headers in cache key', async () => {
            global.fetch = vi.fn(() =>
                Promise.resolve(
                    new Response('{"id":1}', {
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                    })
                )
            );

            await cFetchJson('https://api.example.com/data', {
                headers: { authorization: 'Bearer token' },
            });
            await cFetchJson('https://api.example.com/data', {
                headers: { authorization: 'Bearer token' },
            });

            expect(global.fetch).toHaveBeenCalledTimes(1);
        });

        it('should differentiate cache entries with different headers', async () => {
            global.fetch = vi.fn(() =>
                Promise.resolve(
                    new Response('{"id":1}', {
                        status: 200,
                        statusText: 'OK',
                        headers: {},
                    })
                )
            );

            await cFetchJson('https://api.example.com/data', {
                headers: { authorization: 'Bearer token1' },
            });
            await cFetchJson('https://api.example.com/data', {
                headers: { authorization: 'Bearer token2' },
            });

            expect(global.fetch).toHaveBeenCalledTimes(2);
        });
    });
});