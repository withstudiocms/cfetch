import { type DevServer, type TestApp, loadFixture } from '@inox-tools/astro-tests/astroFixture';
import testAdapter from '@inox-tools/astro-tests/testAdapter';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const fixture = await loadFixture({
	root: './fixtures/astro',
	adapter: testAdapter(),
});

describe('Test integration', () => {
	describe('dev server', () => {
		let devServer: DevServer;

		beforeAll(async () => {
			devServer = await fixture.startDevServer({});
		});

		afterAll(async () => {
			devServer?.stop();
		});

		test('is dev server online?', async () => {
			const res = await fixture.fetch('/');
			const content = await res.text();

			expect(content).toEqual(
				'<!DOCTYPE html><script type="module" src="/@vite/client"></script><h1>Hello world</h1>'
			);
		});

		// This can only be tested in dev, assuming its because of
		// 		the SSR adapter implemented in inox.
		test('Is cache module functioning?', async () => {
			const res = await fixture.fetch('/test');
			const content = await res.text();

			expect(content).toEqual('bar');
		});
	});

	describe('build output', () => {
		let app: TestApp;

		beforeAll(async () => {
			await fixture.build({});
			app = await fixture.loadTestAdapterApp();
		});

		test('did the build successfully output?', async () => {
			const res = await app.render(new Request('http://example.com/'));
			const content = await res.text();

			expect(content).toEqual('<!DOCTYPE html><h1>Hello world</h1>');
		});
	});
});
