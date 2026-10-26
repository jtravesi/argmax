import { describe, expect, it } from 'vitest';
import { formatPercent, formatUtility, toPercentInput } from '../../src/lib/format';
import {
	clearSaved,
	loadSaved,
	MAX_STORED_BYTES,
	save,
	STORAGE_KEY
} from '../../src/lib/persistence/local';
import { careerTemplate } from '../../src/lib/templates';
import { career, tiny } from '../core/helpers';

function memoryStorage(initial: Record<string, string> = {}) {
	const data = new Map(Object.entries(initial));
	return {
		data,
		getItem: (k: string) => data.get(k) ?? null,
		setItem: (k: string, v: string) => void data.set(k, v),
		removeItem: (k: string) => void data.delete(k)
	};
}

const throwing = {
	getItem: () => {
		throw new Error('SecurityError');
	},
	setItem: () => {
		throw new Error('QuotaExceededError');
	},
	removeItem: () => {
		throw new Error('SecurityError');
	}
};

describe('local persistence', () => {
	it('saves and loads a model', () => {
		const store = memoryStorage();
		expect(save(tiny(), store)).toBe(true);
		expect(store.data.has(STORAGE_KEY)).toBe(true);
		expect(loadSaved(store)).toEqual({ status: 'ok', model: tiny() });
	});

	it('clears the saved model', () => {
		const store = memoryStorage();
		save(tiny(), store);
		expect(clearSaved(store)).toBe(true);
		expect(loadSaved(store)).toEqual({ status: 'empty' });
		expect(clearSaved(throwing)).toBe(false);
		expect(clearSaved(null)).toBe(false);
	});

	it('reports an empty storage', () => {
		expect(loadSaved(memoryStorage())).toEqual({ status: 'empty' });
	});

	it('ignores saved data that does not pass parseModel', () => {
		const bad = memoryStorage({ [STORAGE_KEY]: '{"schemaVersion":1,"__proto__":{}}' });
		expect(loadSaved(bad)).toEqual({ status: 'invalid' });
		expect(loadSaved(memoryStorage({ [STORAGE_KEY]: 'not json' }))).toEqual({ status: 'invalid' });
	});

	it('refuses oversized data before parsing it', () => {
		const huge = memoryStorage({ [STORAGE_KEY]: ' '.repeat(MAX_STORED_BYTES + 1) });
		expect(loadSaved(huge)).toEqual({ status: 'invalid' });
	});

	it('survives a storage that throws or is missing', () => {
		expect(loadSaved(throwing)).toEqual({ status: 'unavailable' });
		expect(save(tiny(), throwing)).toBe(false);
		expect(loadSaved(null)).toEqual({ status: 'unavailable' });
		expect(save(tiny(), null)).toBe(false);
	});
});

describe('templates', () => {
	it('the career template is the oracle fixture, as a fresh copy', () => {
		const a = careerTemplate();
		expect(a).toEqual(career());
		a.title = 'changed';
		expect(careerTemplate().title).toBe('Career crossroads');
	});
});

describe('number formats (SPEC.md §3.2)', () => {
	it('utilities with 2 decimals, percentages as whole numbers', () => {
		expect(formatUtility(5.195)).toBe('5.20');
		expect(formatUtility(4)).toBe('4.00');
		expect(formatPercent(0.35)).toBe('35%');
		expect(formatPercent(0.125)).toBe('13%');
		expect(toPercentInput(0.07)).toBe(7);
		expect(toPercentInput(Number.NaN)).toBeNaN();
	});
});
