// Cloudflare Pages reads HTTP headers from a `_headers` file. It is generated at
// deploy time from docker/security-headers.conf, so the demo and the Docker image
// always send the same security headers (ARCHITECTURE.md §8). Usage:
//   node scripts/cf-headers.ts > build/_headers
import { readFileSync } from 'node:fs';

/** `add_header Name "value" always;` lines → [name, value] pairs. */
export function parseNginxHeaders(conf: string): [string, string][] {
	const headers: [string, string][] = [];
	for (const line of conf.split('\n')) {
		const match = /^\s*add_header\s+([A-Za-z-]+)\s+"([^"]*)"\s+always;\s*$/.exec(line);
		if (match) headers.push([match[1], match[2]]);
	}
	return headers;
}

export function cloudflareHeaders(conf: string): string {
	const headers = parseNginxHeaders(conf);
	if (headers.length === 0) throw new Error('No add_header lines found');
	return [
		'/*',
		...headers.map(([name, value]) => `  ${name}: ${value}`),
		'',
		// Hashed build assets: cache forever, as in docker/nginx.conf.
		'/_app/immutable/*',
		'  Cache-Control: public, max-age=31536000, immutable',
		''
	].join('\n');
}

if (import.meta.main) {
	process.stdout.write(cloudflareHeaders(readFileSync('docker/security-headers.conf', 'utf8')));
}
