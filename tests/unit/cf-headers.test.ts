import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { cloudflareHeaders, parseNginxHeaders } from '../../scripts/cf-headers';

const conf = readFileSync(new URL('../../docker/security-headers.conf', import.meta.url), 'utf8');

describe('Cloudflare _headers from docker/security-headers.conf', () => {
	it('carries every security header of the Docker image', () => {
		const headers = parseNginxHeaders(conf);
		expect(headers.map(([name]) => name)).toEqual([
			'Content-Security-Policy',
			'X-Frame-Options',
			'X-Content-Type-Options',
			'Referrer-Policy',
			'Permissions-Policy',
			'Cross-Origin-Opener-Policy',
			'Cross-Origin-Resource-Policy'
		]);
		const out = cloudflareHeaders(conf);
		for (const [name, value] of headers) expect(out).toContain(`  ${name}: ${value}\n`);
	});

	it('applies them to every path and caches immutable assets', () => {
		const out = cloudflareHeaders(conf);
		expect(out.startsWith('/*\n')).toBe(true);
		expect(out).toContain(
			'/_app/immutable/*\n  Cache-Control: public, max-age=31536000, immutable'
		);
		expect(out).toContain("frame-ancestors 'none'");
	});

	it('refuses a config without headers', () => {
		expect(() => cloudflareHeaders('# nothing')).toThrow();
	});
});
