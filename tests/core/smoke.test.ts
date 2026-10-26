import { describe, expect, it } from 'vitest';
import { en } from '../../src/lib/i18n/en';

// Placeholder until the core lands in M1.
describe('i18n', () => {
	it('has a label for every navigation entry', () => {
		expect(Object.values(en.nav).every((label) => label.length > 0)).toBe(true);
	});
});
