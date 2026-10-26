import { expect, test } from '@playwright/test';

test.describe('/model', () => {
	test('renders MODEL.md with typeset formulas and a table of contents', async ({ page }) => {
		await page.goto('/model');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('The model');
		expect(await page.locator('.katex').count()).toBeGreaterThan(100);
		await expect(page.locator('.katex-error')).toHaveCount(0);

		const toc = page.getByRole('navigation', { name: 'Contents' });
		await toc.getByRole('link', { name: '5.1 Weight of a dimension' }).click();
		await expect(page).toHaveURL(/#51-weight-of-a-dimension$/);
		await expect(page.getByRole('heading', { name: '5.1 Weight of a dimension' })).toBeInViewport();
	});

	test('KaTeX fonts are self-hosted', async ({ page }) => {
		const fonts: string[] = [];
		page.on('request', (r) => {
			if (r.resourceType() === 'font') fonts.push(r.url());
		});
		await page.goto('/model');
		await page.waitForLoadState('networkidle');
		expect(fonts.length).toBeGreaterThan(0);
		for (const url of fonts) expect(new URL(url).origin).toBe(new URL(page.url()).origin);
	});
});

test.describe('without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('/model and /about are plain HTML', async ({ page }) => {
		await page.goto('/model');
		expect(await page.locator('.katex').count()).toBeGreaterThan(100);
		await page.goto('/about');
		await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
	});
});

test('/about has the author, links, privacy, disclaimer, Docker and contributing', async ({
	page
}) => {
	await page.goto('/about');
	await expect(page.getByText('Made by José Carlos Travesí.')).toBeVisible();
	await expect(page.getByRole('link', { name: 'GitHub profile' })).toHaveAttribute(
		'href',
		'https://github.com/jtravesi'
	);
	await expect(page.getByRole('link', { name: 'Source code on GitHub' })).toHaveAttribute(
		'rel',
		/noopener noreferrer/
	);
	for (const heading of ['Privacy', 'Disclaimer', 'Run it yourself', 'Contribute']) {
		await expect(page.getByRole('heading', { name: heading })).toBeVisible();
	}
	await expect(page.getByText('docker run --rm -p 8080:8080')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Open an issue on GitHub' })).toBeVisible();
});

test.describe('home', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
	});

	test('explains the tool and gets started', async ({ page }) => {
		await expect(page.getByRole('heading', { name: 'How it works' })).toBeVisible();
		await expect(page.getByText('Private by design')).toBeVisible();
		await page.getByRole('link', { name: 'Get started' }).click();
		await expect(page).toHaveURL(/\/app$/);
	});

	test('a template card opens the tool with that template', async ({ page }) => {
		await page.getByRole('link', { name: 'Use this template: Career crossroads' }).click();
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Career crossroads');
		await expect(page).toHaveURL(/\/app$/);
	});

	test('a template never replaces a saved model without asking', async ({ page }) => {
		await page.getByRole('link', { name: 'Use this template: Career crossroads' }).click();
		await expect(page.getByText('Saved in this browser.')).toBeVisible();
		await page.getByLabel('Title').fill('My own decision');
		await page.waitForTimeout(600); // autosave debounce

		await page.goto('/');
		page.once('dialog', (dialog) => dialog.dismiss());
		await page.getByRole('link', { name: 'Use this template: Career crossroads' }).click();
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('My own decision');
	});
});

test.describe('at 320 px', () => {
	test.use({ viewport: { width: 320, height: 740 } });

	for (const path of ['/', '/model', '/about']) {
		test(`${path} does not scroll horizontally`, async ({ page }) => {
			await page.goto(path);
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth
			);
			expect(overflow).toBeLessThanOrEqual(0);
		});
	}
});
