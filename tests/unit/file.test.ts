import { describe, expect, it } from 'vitest';
import { validate, type DecisionModel } from '../../src/lib/core';
import {
	exportFileName,
	exportText,
	MAX_IMPORT_BYTES,
	readModelFile
} from '../../src/lib/persistence/file';
import { TEMPLATES } from '../../src/lib/templates';
import { career } from '../core/helpers';

const fakeFile = (text: string, size = text.length) => ({ size, text: async () => text });

describe('import', () => {
	it('round-trips an exported model', async () => {
		expect(await readModelFile(fakeFile(exportText(career())))).toEqual({
			ok: true,
			value: career()
		});
	});

	it('refuses files over 256 KB without reading them', async () => {
		let read = false;
		const file = {
			size: MAX_IMPORT_BYTES + 1,
			text: async () => {
				read = true;
				return '';
			}
		};
		expect(await readModelFile(file)).toEqual({ ok: false, error: { reason: 'too-large' } });
		expect(read).toBe(false);
	});

	it('reports unreadable files and invalid content', async () => {
		const broken = {
			size: 10,
			text: async () => {
				throw new Error('NotReadableError');
			}
		};
		expect(await readModelFile(broken)).toEqual({ ok: false, error: { reason: 'unreadable' } });
		expect(await readModelFile(fakeFile('{nope'))).toEqual({
			ok: false,
			error: { reason: 'invalid', issues: [{ code: 'invalid-json', path: [] }] }
		});
		const malicious = await readModelFile(fakeFile('{"schemaVersion":1,"__proto__":{"x":1}}'));
		expect(malicious).toMatchObject({ ok: false, error: { reason: 'invalid' } });
		expect(({} as Record<string, unknown>).x).toBeUndefined();
	});
});

describe('export', () => {
	it('names the file after the title', () => {
		const named = (title: string) => exportFileName({ ...career(), title } as DecisionModel);
		expect(named('Career crossroads')).toBe('career-crossroads.json');
		expect(named('¿Me mudo a Lisboa?')).toBe('me-mudo-a-lisboa.json');
		expect(named('???')).toBe('decision.json');
		expect(named('x'.repeat(100)).length).toBe(65);
	});
});

describe('templates (SPEC.md §5)', () => {
	it('ships the four templates, all valid, normalized and without warnings', () => {
		expect(TEMPLATES.map((t) => t.id)).toEqual(['career', 'job-offers', 'flat', 'blank']);
		for (const t of TEMPLATES) {
			expect(validate(t.create()), t.id).toEqual({ errors: [], warnings: [] });
			expect(t.description.length, t.id).toBeGreaterThan(0);
		}
	});

	it('the guided blank template has 2 alternatives, 3 dimensions and 3 neutral states each', () => {
		const blank = TEMPLATES[3].create();
		expect(blank.alternatives).toHaveLength(2);
		expect(blank.dimensions).toHaveLength(3);
		for (const alt of blank.alternatives) {
			expect(alt.states).toHaveLength(3);
			for (const s of alt.states) expect(Object.values(s.scores).every((x) => x === 5)).toBe(true);
		}
	});
});
