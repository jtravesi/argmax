import { defineConfig } from 'vitest/config';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';

// ARCHITECTURE.md §8: "" for Docker (served at the root), "/argmax" for GitHub Pages.
const basePath = process.env.BASE_PATH ?? '';
if (basePath !== '' && (!basePath.startsWith('/') || basePath.endsWith('/'))) {
	throw new Error(`BASE_PATH must be empty or start (but not end) with "/", got "${basePath}"`);
}

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Every page is prerendered; 404.html is the fallback for nginx and GitHub Pages.
			adapter: adapter({ fallback: '404.html' }),
			paths: { base: basePath as '' | `/${string}` }
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
