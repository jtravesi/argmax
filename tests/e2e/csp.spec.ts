import { expect, test, type Page } from '@playwright/test';

/** Records CSP violations and console errors from the first script on. */
async function watch(page: Page) {
	const errors: string[] = [];
	page.on('console', (m) => {
		if (m.type() === 'error') errors.push(m.text());
	});
	page.on('pageerror', (e) => errors.push(e.message));
	await page.addInitScript(() => {
		document.addEventListener('securitypolicyviolation', (e) => {
			console.error(`CSP violation: ${e.violatedDirective} ${e.blockedURI}`);
		});
	});
	return errors;
}

test('every page carries the CSP meta tag', async ({ page }) => {
	for (const path of ['/', '/app', '/model', '/about']) {
		await page.goto(path);
		const csp = await page
			.locator('meta[http-equiv="content-security-policy"]')
			.getAttribute('content');
		expect(csp, path).toContain("default-src 'self'");
		expect(csp, path).toContain("connect-src 'none'");
		expect(csp, path).toContain("form-action 'none'");
		expect(csp, path).toMatch(/script-src 'self'/);
	}
});

test('no CSP violations or console errors anywhere', async ({ page }) => {
	const errors = await watch(page);
	page.on('dialog', (d) => d.accept());
	for (const path of ['/', '/model', '/about']) {
		await page.goto(path);
		await page.waitForLoadState('networkidle');
	}
	// Client-side navigation between pages, including to the no-JS ones.
	await page.goto('/');
	await page.waitForLoadState('networkidle');
	await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Tool' }).click();
	await page
		.getByRole('navigation', { name: 'Main' })
		.getByRole('link', { name: 'The model' })
		.click();
	await page.waitForLoadState('networkidle');

	await page.goto('/app');
	await page.waitForLoadState('networkidle');
	await page.getByText('Load template').click();
	await page.getByRole('button', { name: 'Career crossroads' }).click();
	await page.getByRole('button', { name: 'See results' }).click();
	await page
		.getByRole('region', { name: 'What if…' })
		.getByRole('spinbutton', { name: 'Weight of Intellectual fulfillment' })
		.fill('80');
	await page.getByRole('radio', { name: '±20%' }).check();
	await page.getByRole('button', { name: 'Share link' }).click();
	await Promise.all([
		page.waitForEvent('download'),
		page.getByRole('button', { name: 'Export JSON' }).click()
	]);
	await page.waitForTimeout(300);
	expect(errors).toEqual([]);
});
