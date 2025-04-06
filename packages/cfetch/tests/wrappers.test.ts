import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cFetch, cachedData } from '../dist/wrappers'; // Update with the actual module path

// Create a mock Response object
function createMockResponse(body: any, init: ResponseInit = {}) {
	const textData = JSON.stringify(body);

	const response = new Response(textData, init);

	// Override clone so each call returns a new Response
	const originalClone = response.clone.bind(response);
	response.clone = () => {
		return new Response(textData, init);
	};

	return response;
}

// Mock fetch

describe('cachedFetch', () => {
	const mockUrl = 'https://api.example.com/data';
	const mockResponseGood = { ok: true } as Response;
	const mockResponseBad = { ok: false } as Response;

	const mockFetch = vi.fn(() => Promise.resolve(createMockResponse(mockResponseGood)));

	beforeEach(() => {
		vi.clearAllMocks();
		cachedData.clear();
	});

	it('fetches new data if not cached', async () => {
		mockFetch.mockResolvedValue(mockResponseGood);

		const result = await cFetch(mockUrl, {});

		expect(fetch).toHaveBeenCalledWith(mockUrl, {});
		expect(result).toEqual(mockResponseGood);
		expect(cachedData.get(mockUrl)).toBeDefined();
	});

	it('returns cached data if valid', async () => {
		const cachedObject = { lastCheck: new Date(), data: mockResponseGood };
		cachedData.set(mockUrl, cachedObject);

		const result = await cFetch(mockUrl, {});

		expect(fetch).not.toHaveBeenCalled();
		expect(result).toBe(cachedObject.data);
	});

	it('fetches new data if cache is expired', async () => {
		mockFetch.mockResolvedValue(mockResponseGood);
		const oldDate = new Date();
		oldDate.setMinutes(oldDate.getMinutes() - 100); // Assuming lifetime < 30 mins
		cachedData.set(mockUrl, { lastCheck: oldDate, data: { ok: true } as Response });

		const result = await cFetch(mockUrl, {});

		expect(fetch).toHaveBeenCalledWith(mockUrl, {});
		expect(result).toEqual(mockResponseGood);
	});

	it('returns metadata when requested', async () => {
		const cachedObject = { lastCheck: new Date(), data: mockResponseGood };
		cachedData.set(mockUrl, cachedObject);

		const result = await cFetch(mockUrl, {}, {}, true);

		expect(result).toEqual(cachedObject);
	});

	it('throws an error if fetching fails and no cache exists', async () => {
		mockFetch.mockResolvedValue(mockResponseBad);

		await expect(cFetch(mockUrl, {})).rejects.toThrow(
			'Failed to retrieve cached data, and failed to fetch new data'
		);
	});

	it('returns cached data if fetching fails but cache exists even if expired', async () => {
		const oldDate = new Date();
		oldDate.setMinutes(oldDate.getMinutes() - 100);
		const cachedObject = { lastCheck: oldDate, data: mockResponseGood };
		cachedData.set(mockUrl, cachedObject);
		mockFetch.mockResolvedValue(mockResponseBad);

		const result = await cFetch(mockUrl, {});

		expect(fetch).toHaveBeenCalled();
		expect(result).toBe(cachedObject.data);
	});
});
