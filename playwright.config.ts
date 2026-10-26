import { defineConfig, devices } from '@playwright/test';

// BASE_URL runs the suite against an already running site (e.g. the Docker image);
// otherwise Playwright builds and previews the app itself.
const baseURL = process.env.BASE_URL ?? 'http://localhost:4173';

export default defineConfig({
	testDir: 'tests/e2e',
	forbidOnly: !!process.env.CI,
	reporter: process.env.CI ? 'github' : 'list',
	use: { baseURL },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: process.env.BASE_URL
		? undefined
		: {
				command: 'npm run build && npm run preview',
				port: 4173,
				reuseExistingServer: !process.env.CI
			}
});
