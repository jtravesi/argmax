// The HTTP headers that a meta tag cannot set (ARCHITECTURE.md §8.1). Only meaningful
// against a server that sends them: the Docker image or the deployed site.
import { expect, test } from '@playwright/test';

test.skip(
	!process.env.BASE_URL,
	'needs BASE_URL pointing to the Docker image or the deployed site'
);

for (const path of ['/', '/app', '/model', '/about', '/does-not-exist']) {
	test(`security headers on ${path}`, async ({ request }) => {
		const response = await request.get(path);
		const h = response.headers();
		expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
		expect(h['content-security-policy']).not.toMatch(/default-src|script-src/);
		expect(h['x-frame-options']).toBe('DENY');
		expect(h['x-content-type-options']).toBe('nosniff');
		expect(h['referrer-policy']).toBe('no-referrer');
		expect(h['cross-origin-opener-policy']).toBe('same-origin');
	});
}
