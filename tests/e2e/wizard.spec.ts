import { expect, test, type Page } from '@playwright/test';

const steps = (page: Page) => page.getByRole('navigation', { name: 'Steps' });

/** Opens the tool once it is interactive (hydrated). */
async function open(page: Page) {
	await page.goto('/app');
	await page.waitForLoadState('networkidle');
}

async function loadExample(page: Page) {
	await open(page);
	await page.getByRole('button', { name: 'Load example' }).click();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Career crossroads');
}

test.beforeEach(async ({ page }) => {
	page.on('dialog', (dialog) => dialog.accept());
});

test('the example template gives the expected ranking', async ({ page }) => {
	await loadExample(page);
	await page.getByRole('button', { name: 'See results' }).click();

	const verdict = page.getByRole('region', { name: 'Verdict' });
	await expect(verdict).toContainText(
		'Stay and look for a new job has the highest expected utility.'
	);
	await expect(verdict).toContainText('Moderate decision');

	const ranking = page.getByRole('region', { name: 'Ranking' }).getByRole('listitem');
	await expect(ranking).toHaveText([
		/Stay and look for a new job/,
		/Sabbatical year for personal projects\s*5\.20/,
		/Leave of absence for a master's degree\s*3\.95/
	]);

	const risk = page.getByRole('region', { name: 'Risk profile' });
	await expect(risk.getByRole('row', { name: /Leave of absence/ })).toContainText('55%');
	await risk.getByRole('spinbutton', { name: 'Threshold τ for a bad outcome' }).fill('3');
	await expect(risk.getByRole('row', { name: /Leave of absence/ })).toContainText('55%');
	await expect(risk.getByRole('row', { name: /Stay and look/ })).toContainText('0%');
});

test('a model built from scratch reaches the results', async ({ page }) => {
	await open(page);
	await page.getByLabel('Title').fill('Which city?');

	await page.getByRole('button', { name: 'Next' }).click();
	await page.getByRole('button', { name: '+ Money' }).click();
	await page.getByRole('button', { name: '+ Health' }).click();
	await page.getByRole('spinbutton', { name: 'Weight of “Money” (%)' }).fill('60');
	await page.getByRole('spinbutton', { name: 'Weight of “Health” (%)' }).fill('40');
	await expect(page.getByRole('status').filter({ hasText: 'Sum' })).toContainText('Sum: 100%');

	await page.getByRole('button', { name: 'Next' }).click();
	await page.getByLabel('Name of alternative 1').fill('Madrid');
	await page.getByLabel('Name of alternative 2').fill('Lisbon');

	await page.getByRole('button', { name: 'Next' }).click();
	for (const city of ['Madrid', 'Lisbon']) {
		const group = page.locator('details', { hasText: city });
		await group.getByRole('button', { name: 'Add state' }).click();
		await group.getByRole('button', { name: 'Add state' }).click();
		await group.getByLabel(`Outcome 1 of “${city}”`).fill('Good');
		await group.getByLabel(`Outcome 2 of “${city}”`).fill('Bad');
		await group.getByRole('spinbutton', { name: 'Probability of “Good” (%)' }).fill('50');
		await group.getByRole('spinbutton', { name: 'Probability of “Bad” (%)' }).fill('50');
	}

	await page.getByRole('button', { name: 'Next' }).click();
	const madrid = page.getByRole('region', { name: '“Madrid”' });
	await madrid.getByRole('spinbutton', { name: 'Score of “Good” on “Money”' }).fill('9');
	await expect(madrid.getByRole('row', { name: /Good/ }).locator('output')).toHaveText('7.40');

	await page.getByRole('button', { name: 'See results' }).click();
	await expect(page.getByRole('region', { name: 'Verdict' })).toContainText(
		'Madrid has the highest expected utility.'
	);
	await expect(page.getByText('Saved in this browser.')).toBeVisible();
});

test('the model survives a reload', async ({ page }) => {
	await loadExample(page);
	await expect(page.getByText('Saved in this browser.')).toBeVisible();
	await page.waitForTimeout(600); // debounce
	await page.reload();
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Career crossroads');
});

test('errors flag their step and block the results, but not navigation', async ({ page }) => {
	await loadExample(page);
	await steps(page)
		.getByRole('button', { name: /Dimensions/ })
		.click();
	await page.getByRole('spinbutton', { name: 'Weight of “Financial health” (%)' }).fill('');

	await expect(
		page.getByText('Weight of “Financial health” must be a number of at least 0.')
	).toBeVisible();
	await expect(steps(page).getByRole('button', { name: 'Dimensions (has errors)' })).toBeVisible();
	await expect(page.getByRole('button', { name: 'See results' })).toHaveCount(0);
	await expect(page.getByText(/Not saved yet: 1 problem needs fixing/)).toBeVisible();

	await steps(page)
		.getByRole('button', { name: /Results/ })
		.click();
	await expect(page.getByText('Fix the errors in the steps marked above')).toBeVisible();
	await page.getByRole('button', { name: 'Dimensions', exact: true }).click();
	await expect(page.getByRole('heading', { level: 2 })).toHaveText('Dimensions');
	await expect(page.getByRole('heading', { level: 2 })).toBeFocused();
});

// SPEC.md §7 asks for 360 px; 320 px leaves room for wider system fonts.
test.describe('at 320 px', () => {
	test.use({ viewport: { width: 320, height: 740 } });

	test('no step scrolls horizontally', async ({ page }) => {
		await loadExample(page);
		for (const step of [
			'The decision',
			'Dimensions',
			'Alternatives',
			'States and probabilities',
			'Scores',
			'Results'
		]) {
			await steps(page)
				.getByRole('button', { name: new RegExp(step) })
				.click();
			await expect(page.getByRole('heading', { level: 2 })).toHaveText(step);
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth
			);
			expect(overflow, `horizontal overflow on "${step}"`).toBeLessThanOrEqual(0);
		}
	});
});

test('the whole flow works with the keyboard only', async ({ page }) => {
	await open(page);

	async function tabTo(name: string | RegExp) {
		for (let i = 0; i < 80; i++) {
			await page.keyboard.press('Tab');
			const label = await page.evaluate(() => {
				const el = document.activeElement as HTMLElement | null;
				return el?.getAttribute('aria-label') ?? el?.innerText ?? '';
			});
			if (typeof name === 'string' ? label.trim() === name : name.test(label)) return;
		}
		throw new Error(`could not reach ${name} with Tab`);
	}

	await tabTo('Load example');
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Career crossroads');

	await tabTo('See results');
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { level: 2 })).toBeFocused();
	await expect(page.getByRole('region', { name: 'Verdict' })).toBeVisible();

	await tabTo(/^\s*2\s*Dimensions/);
	await page.keyboard.press('Enter');
	await expect(page.getByRole('heading', { level: 2 })).toHaveText('Dimensions');
});
