import { expect, test, type Page } from '@playwright/test';

async function exampleResults(page: Page) {
	page.on('dialog', (dialog) => dialog.accept());
	await page.goto('/app');
	await page.waitForLoadState('networkidle');
	await page.getByText('Load template').click();
	await page.getByRole('button', { name: 'Career crossroads' }).click();
	await page.getByRole('button', { name: 'See results' }).click();
}

test('expected profile per alternative and dimension', async ({ page }) => {
	await exampleResults(page);
	const profile = page.getByRole('region', { name: 'Expected profile' });
	await expect(profile.getByRole('row', { name: /Stay and look/ })).toContainText('7.45');
	await expect(profile.getByText(/whatever the weights/)).toHaveCount(0);
});

test('dominance is announced when it exists', async ({ page }) => {
	const model = {
		schemaVersion: 1,
		title: 'Dominance',
		dimensions: [
			{ id: 'd1', name: 'Money', weight: 0.5 },
			{ id: 'd2', name: 'Fun', weight: 0.5 }
		],
		alternatives: [
			{
				id: 'a1',
				name: 'A',
				states: [{ id: 's1', name: 'S', probability: 1, scores: { d1: 8, d2: 6 } }]
			},
			{
				id: 'a2',
				name: 'B',
				states: [{ id: 's1', name: 'S', probability: 1, scores: { d1: 5, d2: 6 } }]
			}
		]
	};
	await page.addInitScript(
		(text) => localStorage.setItem('argmax:v1:current', text),
		JSON.stringify(model)
	);
	await page.goto('/app');
	await page.waitForLoadState('networkidle');
	await page.getByRole('button', { name: 'See results' }).click();
	await expect(page.getByText('A beats B whatever the weights.')).toBeVisible();
});

test('what-if sliders change the ranking without touching the model, and reset', async ({
	page
}) => {
	await exampleResults(page);
	const whatIf = page.getByRole('region', { name: 'What if…' });
	await expect(whatIf.getByRole('button', { name: 'Reset' })).toBeDisabled();

	await whatIf.getByRole('spinbutton', { name: 'Weight of Intellectual fulfillment' }).fill('80');
	await expect(whatIf.getByRole('status')).toHaveText(
		'With these values, Sabbatical year for personal projects comes first.'
	);
	// The other weights were rescaled proportionally: 15% · 0.2 / 0.75 = 4%.
	await expect(
		whatIf.getByRole('spinbutton', { name: 'Weight of Career progression' })
	).toHaveValue('4');
	// The real results are unchanged.
	await expect(page.getByRole('region', { name: 'Verdict' })).toContainText(
		'Stay and look for a new job'
	);

	await whatIf.getByRole('button', { name: 'Reset' }).click();
	await expect(whatIf.getByRole('status')).toHaveText('The first alternative does not change.');
	await expect(
		whatIf.getByRole('spinbutton', { name: 'Weight of Intellectual fulfillment' })
	).toHaveValue('25');

	await page
		.getByRole('navigation', { name: 'Steps' })
		.getByRole('button', { name: /Dimensions/ })
		.click();
	await expect(
		page.getByRole('spinbutton', { name: 'Weight of “Intellectual fulfillment” (%)' })
	).toHaveValue('25');
});

test('tipping points match the oracle, with one decimal', async ({ page }) => {
	await exampleResults(page);
	const tipping = page.getByRole('region', { name: 'Tipping points' });
	await expect(tipping.getByRole('row', { name: /Intellectual fulfillment/ })).toContainText(
		'above 72.2%'
	);
	await expect(tipping.getByRole('row', { name: /Career progression/ })).toContainText(
		'No weight changes the order'
	);
	await expect(tipping.getByRole('row', { name: /Financial health/ })).toContainText('below 5.5%');
	await expect(tipping.getByRole('row', { name: /Freedom/ })).toContainText('above 32.3%');
	await expect(
		tipping.getByRole('row', { name: /Clarity and a project that makes money/ })
	).toContainText('above 35.4%');
});

test('tornado with adjustable h and an equivalent table', async ({ page }) => {
	await exampleResults(page);
	const tornado = page.getByRole('region', { name: 'Tornado' });
	const row = tornado.getByRole('row', { name: /^Weight of Intellectual fulfillment/ });
	await expect(row).toContainText('15%–35%');

	await tornado.getByRole('radio', { name: '±20%' }).check();
	await expect(row).toContainText('5%–45%');
	await expect(tornado.getByRole('row', { name: /^Weight of Financial health/ })).toContainText(
		'Yes: Sabbatical year'
	);
});

test('every chart has a text alternative pointing to its table', async ({ page }) => {
	await exampleResults(page);
	const charts = page.getByRole('img');
	const count = await charts.count();
	expect(count).toBeGreaterThan(0);
	for (let i = 0; i < count; i++) {
		await expect(charts.nth(i)).toHaveAttribute(
			'aria-label',
			/The same values are in the table\.$/
		);
	}
});
