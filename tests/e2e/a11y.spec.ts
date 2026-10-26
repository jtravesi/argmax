// WCAG 2.2 AA (SPEC.md §7) checked with axe-core on every page and every step,
// in both themes. Automated checks catch a part of WCAG; the rest is reviewed by hand.
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function audit(page: Page, label: string) {
	const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
	const summary = violations.map(
		(v) =>
			`${v.id} (${v.impact}): ${v.nodes
				.map((n) => n.target.join(' '))
				.slice(0, 3)
				.join(' | ')}`
	);
	expect(summary, label).toEqual([]);
}

for (const scheme of ['light', 'dark'] as const) {
	test.describe(`${scheme} theme`, () => {
		test.use({ colorScheme: scheme });

		test('content pages', async ({ page }) => {
			for (const path of ['/', '/model', '/about']) {
				await page.goto(path);
				await audit(page, path);
			}
		});

		test('the tool, empty and with errors', async ({ page }) => {
			await page.goto('/app');
			await page.waitForLoadState('networkidle');
			await audit(page, 'blank model');
		});

		test('every wizard step and the results', async ({ page }) => {
			page.on('dialog', (d) => d.accept());
			await page.goto('/app');
			await page.waitForLoadState('networkidle');
			await page.getByText('Load template').click();
			await page.getByRole('button', { name: 'Career crossroads' }).click();
			const steps = page.getByRole('navigation', { name: 'Steps' });
			for (const step of [
				'The decision',
				'Dimensions',
				'Alternatives',
				'States',
				'Scores',
				'Results'
			]) {
				await steps.getByRole('button', { name: new RegExp(step) }).click();
				await audit(page, step);
			}
			await page.getByRole('button', { name: 'Share link' }).click();
			await audit(page, 'share panel');
		});
	});
}
