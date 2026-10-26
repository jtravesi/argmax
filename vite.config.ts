import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

// ARCHITECTURE.md §8: "" for Docker (served at the root), "/argmax" for GitHub Pages.
const basePath = process.env.BASE_PATH ?? '';
if (basePath !== '' && (!basePath.startsWith('/') || basePath.endsWith('/'))) {
	throw new Error(`BASE_PATH must be empty or start (but not end) with "/", got "${basePath}"`);
}

/**
 * KaTeX's CSS lists every font as woff2, woff and ttf. The supported browsers
 * (SPEC.md §7) only need woff2, so the other formats are not emitted.
 */
const katexWoff2Only: Plugin = {
	name: 'katex-woff2-only',
	enforce: 'pre',
	transform(code, id) {
		if (!id.split('?')[0].endsWith('katex/dist/katex.min.css')) return;
		return code.replace(/,url\([^)]+\.(?:woff|ttf)\) format\("(?:woff|truetype)"\)/g, '');
	}
};

export default defineConfig({
	// Never inline assets as data: URIs; the CSP only allows fonts from 'self'.
	build: { assetsInlineLimit: 0 },
	plugins: [
		katexWoff2Only,
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Every page is prerendered; 404.html is the fallback for nginx and GitHub Pages.
			adapter: adapter({ fallback: '404.html' }),
			paths: { base: basePath as '' | `/${string}` },
			// ARCHITECTURE.md §7: a meta tag with hashes on every prerendered page. It is what
			// protects static hosting without custom headers; nginx and _headers add the rest.
			csp: {
				mode: 'hash',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					// KaTeX and the charts use style attributes.
					'style-src': ['self', 'unsafe-inline'],
					'img-src': ['self', 'data:'],
					'font-src': ['self'],
					'connect-src': ['none'],
					'object-src': ['none'],
					'base-uri': ['self'],
					'form-action': ['none']
				}
			}
		})
	],
	test: {
		expect: { requireAssertions: true },
		coverage: {
			provider: 'v8',
			include: ['src/lib/core/**'],
			// ROADMAP.md M1: core branch coverage ≥ 95%.
			thresholds: { branches: 95, functions: 95, lines: 95, statements: 95 }
		},
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'core',
					environment: 'node',
					include: ['tests/core/**/*.test.ts', 'tests/unit/**/*.test.ts']
				}
			}
		]
	}
});
