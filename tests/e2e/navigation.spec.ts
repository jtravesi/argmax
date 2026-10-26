import { expect, test } from '@playwright/test';

const routes = [
	{ link: 'Home', path: '/', heading: 'Argmax' },
	{ link: 'Tool', path: '/app', heading: 'Tool' },
	{ link: 'The model', path: '/model', heading: 'The model' },
	{ link: 'About', path: '/about', heading: 'About' }
];

test('the main navigation reaches the four routes', async ({ page }) => {
	await page.goto('/');
	const nav = page.getByRole('navigation', { name: 'Main' });
	for (const route of routes) {
		await nav.getByRole('link', { name: route.link, exact: true }).click();
		await expect(page).toHaveURL(route.path);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(route.heading);
		await expect(nav.getByRole('link', { name: route.link, exact: true })).toHaveAttribute(
			'aria-current',
			'page'
		);
	}
});
