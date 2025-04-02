import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cachedFetch, cachedData } from '../dist/wrappers'; // Update with the actual module path

describe('cachedFetch', () => {
	const mockUrl = 'https://api.example.com/data';
	const mockResponse = { ok: true } as Response;

	const mockFetch = vi.fn();
	vi.stubGlobal('fetch', mockFetch);

	beforeEach(() => {
		vi.clearAllMocks();
		cachedData.clear();
	});

	it('fetches new data if not cached', async () => {
		mockFetch.mockResolvedValue(mockResponse);

		const result = await cachedFetch(mockUrl, {});

		expect(fetch).toHaveBeenCalledWith(mockUrl, {});
		expect(result).toEqual(mockResponse);
		expect(cachedData.get(mockUrl)).toBeDefined();
	});

	it('returns cached data if valid', async () => {
		const cachedObject = { lastCheck: new Date(), data: mockResponse };
		cachedData.set(mockUrl, cachedObject);

		const result = await cachedFetch(mockUrl, {});

		expect(fetch).not.toHaveBeenCalled();
		expect(result).toBe(cachedObject.data);
	});

	it('fetches new data if cache is expired', async () => {
		mockFetch.mockResolvedValue(mockResponse);
		const oldDate = new Date();
		oldDate.setMinutes(oldDate.getMinutes() - 100); // Assuming lifetime < 30 mins
		cachedData.set(mockUrl, { lastCheck: oldDate, data: { ok: true } as Response });

		const result = await cachedFetch(mockUrl, {});

		expect(fetch).toHaveBeenCalledWith(mockUrl, {});
		expect(result).toEqual(mockResponse);
	});

	it('returns metadata when requested', async () => {
		const cachedObject = { lastCheck: new Date(), data: mockResponse };
		cachedData.set(mockUrl, cachedObject);

		const result = await cachedFetch(mockUrl, {}, {}, true);

		expect(result).toEqual(cachedObject);
	});

	it('throws an error if fetching fails and no cache exists', async () => {
		mockFetch.mockResolvedValue({ ok: false });

		await expect(cachedFetch(mockUrl, {})).rejects.toThrow(
			'Failed to retrieve cached data, and failed to fetch new data'
		);
	});

	it('returns cached data if fetching fails but cache exists even if expired', async () => {
		const oldDate = new Date();
		oldDate.setMinutes(oldDate.getMinutes() - 100);
		const cachedObject = { lastCheck: oldDate, data: mockResponse };
		cachedData.set(mockUrl, cachedObject);
		mockFetch.mockResolvedValue({ ok: false });

		const result = await cachedFetch(mockUrl, {});

		expect(fetch).toHaveBeenCalled();
		expect(result).toBe(cachedObject.data);
	});
});
