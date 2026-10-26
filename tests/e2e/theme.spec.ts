import { expect, test } from '@playwright/test';

const toggle = (page: import('@playwright/test').Page) =>
	page.getByRole('button', { name: /^Theme:/ });
const bg = (page: import('@playwright/test').Page) =>
	page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test.describe('follows the system by default', () => {
	test.use({ colorScheme: 'dark' });

	test('dark system, automatic theme', async ({ page }) => {
		await page.goto('/');
		await expect(toggle(page)).toHaveAccessibleName('Theme: automatic');
		expect(await bg(page)).toBe('rgb(21, 23, 27)');
	});
});

test('the toggle cycles automatic → light → dark and is remembered, also on pages without JS', async ({
	page
}) => {
	await page.goto('/');
	const light = await bg(page);
	await toggle(page).click();
	await expect(toggle(page)).toHaveAccessibleName('Theme: light');
	await toggle(page).click();
	await expect(toggle(page)).toHaveAccessibleName('Theme: dark');
	expect(await bg(page)).not.toBe(light);

	// /model ships no app JavaScript; the theme still applies and the toggle still works.
	await page.goto('/model');
	await expect(toggle(page)).toHaveAccessibleName('Theme: dark');
	expect(await bg(page)).toBe('rgb(21, 23, 27)');
	await toggle(page).click();
	await expect(toggle(page)).toHaveAccessibleName('Theme: automatic');
	await page.goto('/app');
	await expect(toggle(page)).toHaveAccessibleName('Theme: automatic');
});

test.describe('without JavaScript', () => {
	test.use({ javaScriptEnabled: false });

	test('the toggle is hidden, since it could not work', async ({ page }) => {
		await page.goto('/about');
		await expect(toggle(page)).toBeHidden();
	});
});
