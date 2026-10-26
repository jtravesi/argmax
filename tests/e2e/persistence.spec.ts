import { readFileSync } from 'node:fs';
import LZString from 'lz-string';
import { expect, test, type Page } from '@playwright/test';

const career = JSON.parse(
	readFileSync(new URL('../../fixtures/career-decision.json', import.meta.url), 'utf8')
);
const h1 = (page: Page) => page.getByRole('heading', { level: 1 });

async function open(page: Page, url = '/app') {
	await page.goto(url);
	await page.waitForLoadState('networkidle');
}

async function loadTemplate(page: Page, title: string) {
	await page.getByText('Load template').click();
	await page.getByRole('button', { name: title }).click();
	await expect(h1(page)).toHaveText(title);
}

/** Saves a model in localStorage before the app loads, as a returning user would have. */
async function withSaved(page: Page, model: unknown) {
	await page.addInitScript((text) => {
		if (!sessionStorage.getItem('seeded')) {
			localStorage.setItem('argmax:v1:current', text);
			sessionStorage.setItem('seeded', '1');
		}
	}, JSON.stringify(model));
}

const shareLinkFor = (model: unknown) =>
	`/app#m=${LZString.compressToEncodedURIComponent(JSON.stringify(model))}`;

test.beforeEach(async ({ page }) => {
	page.on('dialog', (dialog) => dialog.accept());
});

test.describe('templates (SPEC.md §5)', () => {
	for (const title of ['Choosing between job offers', 'Choosing a flat', 'My decision']) {
		test(`"${title}" loads and gives results`, async ({ page }) => {
			await open(page);
			await loadTemplate(page, title);
			await page.getByRole('button', { name: 'See results' }).click();
			await expect(page.getByRole('region', { name: 'Verdict' })).toBeVisible();
		});
	}
});

test('export and import a JSON file', async ({ page }) => {
	await open(page);
	await loadTemplate(page, 'Career crossroads');

	const [download] = await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: 'Export JSON' }).click()
	]);
	expect(download.suggestedFilename()).toBe('career-crossroads.json');
	const exported = readFileSync(await download.path(), 'utf8');
	expect(JSON.parse(exported)).toEqual(career);

	await loadTemplate(page, 'Choosing a flat');
	await page.locator('input[type=file]').setInputFiles({
		name: 'career-crossroads.json',
		mimeType: 'application/json',
		buffer: Buffer.from(exported)
	});
	await expect(h1(page)).toHaveText('Career crossroads');
	await expect(page.getByText('Imported “Career crossroads”.')).toBeVisible();
});

test.describe('importing bad files never breaks or changes the model', () => {
	const cases = [
		{
			name: 'malicious.json',
			content:
				'{"schemaVersion":1,"title":"x","__proto__":{"polluted":true},"dimensions":[],"alternatives":[]}',
			message: '“malicious.json” is not a valid Argmax model. Nothing was loaded:'
		},
		{
			name: 'broken.json',
			content: '{"schemaVersion": 1, "title": ',
			message: '“broken.json” is not a valid Argmax model. Nothing was loaded:'
		},
		{
			name: 'wrong.json',
			content: JSON.stringify({
				...career,
				alternatives: career.alternatives.slice(0, 1),
				extra: 1
			}),
			message: '“wrong.json” is not a valid Argmax model. Nothing was loaded:'
		},
		{
			name: 'huge.json',
			content: ' '.repeat(256 * 1024 + 1),
			message: 'That file is larger than 256 KB, so it was not opened.'
		}
	];

	for (const c of cases) {
		test(c.name, async ({ page }) => {
			await open(page);
			await loadTemplate(page, 'Choosing a flat');
			await page.locator('input[type=file]').setInputFiles({
				name: c.name,
				mimeType: 'application/json',
				buffer: Buffer.from(c.content)
			});
			await expect(page.getByText(c.message)).toBeVisible();
			await expect(h1(page)).toHaveText('Choosing a flat');
			expect(await page.evaluate(() => ({}) as Record<string, unknown>)).not.toHaveProperty(
				'polluted'
			);
			// The app still works.
			await page.getByRole('button', { name: 'See results' }).click();
			await expect(page.getByRole('region', { name: 'Verdict' })).toBeVisible();
		});
	}
});

test('share a link and open it elsewhere', async ({ page, browser }) => {
	await open(page);
	await loadTemplate(page, 'Career crossroads');
	await page.getByRole('button', { name: 'Share link' }).click();
	await expect(page.getByText('Anyone with this link will see your whole model.')).toBeVisible();
	const url = await page.getByLabel('Link to this model').inputValue();
	expect(url).toMatch(/\/app#m=[A-Za-z0-9+\-$]+$/);

	// A fresh browser with nothing saved: the shared model opens, editable, at the results.
	const other = await browser.newPage();
	await other.goto(url);
	await expect(other.getByRole('heading', { level: 1 })).toHaveText('Career crossroads');
	await expect(other.getByRole('region', { name: 'Verdict' })).toBeVisible();
	await expect(other).toHaveURL(/\/app$/);
	await other.close();
});

test.describe('a shared link while a model is saved (SPEC.md §4)', () => {
	const mine = { ...career, title: 'My own decision' };

	test('view it read-only, then go back to mine', async ({ page }) => {
		await withSaved(page, mine);
		await open(page, shareLinkFor(career));
		await expect(page.getByRole('heading', { name: 'A model was shared with you' })).toBeFocused();
		await page.getByRole('button', { name: 'Just view it (read-only)' }).click();

		await expect(h1(page)).toHaveText('Career crossroads');
		await expect(page.getByText(/It is read-only/)).toBeVisible();
		await expect(page.getByRole('region', { name: 'Verdict' })).toBeVisible();
		await page
			.getByRole('navigation', { name: 'Steps' })
			.getByRole('button', { name: /The decision/ })
			.click();
		await expect(page.getByLabel('Title')).toBeDisabled();

		// The saved model is untouched.
		await page.waitForTimeout(600);
		expect(await page.evaluate(() => localStorage.getItem('argmax:v1:current'))).toContain(
			'My own decision'
		);
		await page.getByRole('button', { name: 'Back to my model' }).click();
		await expect(h1(page)).toHaveText('My own decision');
	});

	test('replace mine with it', async ({ page }) => {
		await withSaved(page, mine);
		await open(page, shareLinkFor(career));
		await page.getByRole('button', { name: 'Replace my model with it' }).click();
		await expect(h1(page)).toHaveText('Career crossroads');
		await page.waitForTimeout(600);
		await page.reload();
		await expect(h1(page)).toHaveText('Career crossroads');
	});

	test('no prompt when the link holds the same model', async ({ page }) => {
		await withSaved(page, career);
		await open(page, shareLinkFor(career));
		await expect(page.getByRole('heading', { name: 'A model was shared with you' })).toHaveCount(0);
		await expect(page.getByRole('region', { name: 'Verdict' })).toBeVisible();
	});
});

test.describe('bad shared links are ignored safely', () => {
	const cases = [
		{ name: 'damaged', hash: '#m=%%%garbage', message: 'damaged or incomplete' },
		{
			name: 'not a model',
			hash: `#m=${LZString.compressToEncodedURIComponent('{"schemaVersion":1,"__proto__":{"x":1}}')}`,
			message: 'does not contain a valid Argmax model'
		},
		{
			name: 'compression bomb',
			hash: `#m=${LZString.compressToEncodedURIComponent('a'.repeat(300_000))}`,
			message: 'too large to open safely'
		},
		{ name: 'oversized', hash: `#m=${'A'.repeat(33 * 1024)}`, message: 'too large to open safely' }
	];

	for (const c of cases) {
		test(c.name, async ({ page }) => {
			await withSaved(page, career);
			await open(page, `/app${c.hash}`);
			await expect(page.getByText(new RegExp(c.message))).toBeVisible();
			await expect(h1(page)).toHaveText('Career crossroads');
		});
	}
});

test('no request ever leaves the origin', async ({ page, baseURL }) => {
	const foreign: string[] = [];
	page.on('request', (r) => {
		const url = new URL(r.url());
		if (
			url.protocol !== 'data:' &&
			url.protocol !== 'blob:' &&
			url.origin !== new URL(baseURL as string).origin
		) {
			foreign.push(r.url());
		}
	});
	for (const path of ['/', '/model', '/about']) await open(page, path);
	await open(page);
	await loadTemplate(page, 'Career crossroads');
	await page.getByRole('button', { name: 'See results' }).click();
	await page.getByRole('radio', { name: '±20%' }).check();
	await page.getByRole('button', { name: 'Share link' }).click();
	await page.waitForLoadState('networkidle');
	expect(foreign).toEqual([]);
});

test('the share link always follows the current model', async ({ page }) => {
	await open(page);
	await loadTemplate(page, 'Career crossroads');
	await page.getByRole('button', { name: 'Share link' }).click();
	const link = page.getByLabel('Link to this model');
	const first = await link.inputValue();
	await page.getByLabel('Title').fill('Renamed');
	await expect(link).not.toHaveValue(first);
	await page.getByLabel('Title').fill('');
	await expect(page.getByText('Fix the errors in the model before sharing it.')).toBeVisible();
	await expect(link).toHaveCount(0);
});
