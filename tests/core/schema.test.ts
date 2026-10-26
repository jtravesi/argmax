import { describe, expect, it } from 'vitest';
import { deserialize, parseModel, serialize } from '../../src/lib/core';
import { migrate } from '../../src/lib/core/schema';
import type { Issue } from '../../src/lib/core/types';
import { career, tiny } from './helpers';

/** Issues of a rejected input, or a failure if it was accepted. */
function issuesOf(input: unknown): Issue[] {
	const result = parseModel(input);
	if (result.ok) throw new Error('expected the input to be rejected');
	return result.error;
}

const withJson = (text: string) => deserialize(text);

describe('parseModel (ARCHITECTURE.md §4 and §7)', () => {
	it('accepts the oracle model unchanged', () => {
		expect(parseModel(career())).toEqual({ ok: true, value: career() });
	});

	it('round-trips through serialize/deserialize', () => {
		expect(deserialize(serialize(tiny()))).toEqual({ ok: true, value: tiny() });
	});

	it('rejects text that is not JSON', () => {
		expect(withJson('{"schemaVersion": 1,')).toEqual({
			ok: false,
			error: [{ code: 'invalid-json', path: [] }]
		});
	});

	it.each([null, 42, 'model', [tiny()]])('rejects a non-object root: %j', (input) => {
		expect(issuesOf(input)).toEqual([
			{ code: 'invalid-type', path: [], params: { expected: 'object' } }
		]);
	});

	it.each([undefined, 0, 2, 1.5, '1'])('rejects schemaVersion %j', (version) => {
		expect(issuesOf({ ...tiny(), schemaVersion: version })).toEqual([
			{ code: 'unsupported-version', path: ['schemaVersion'] }
		]);
	});

	describe('prototype pollution', () => {
		it('rejects a __proto__ key in scores', () => {
			const text = serialize(tiny()).replace('"scores":{', '"scores":{"__proto__":{"x":1},');
			const result = withJson(text);
			expect(result.ok).toBe(false);
			expect(!result.ok && result.error[0]).toEqual({
				code: 'forbidden-key',
				path: ['alternatives', 0, 'states', 0, 'scores', '__proto__']
			});
			expect(({} as Record<string, unknown>).x).toBeUndefined();
		});

		it('rejects a constructor key at the root', () => {
			const text = serialize(tiny()).replace('{', '{"constructor":{"prototype":{}},');
			const result = withJson(text);
			expect(!result.ok && result.error).toEqual([
				{ code: 'forbidden-key', path: ['constructor'] }
			]);
		});

		it.each(['__proto__', 'constructor', 'prototype'])('rejects %s as an id', (id) => {
			const m = tiny();
			m.alternatives[1].id = id;
			expect(issuesOf(m)).toEqual([{ code: 'forbidden-key', path: ['alternatives', 1, 'id'] }]);
		});

		it('rejects a forbidden id used as a scores key', () => {
			const m = tiny();
			m.dimensions[0].id = 'constructor';
			m.alternatives.forEach((a) =>
				a.states.forEach((s) => (s.scores = { constructor: s.scores.d1, d2: s.scores.d2 }))
			);
			expect(issuesOf(m)).toContainEqual({
				code: 'forbidden-key',
				path: ['alternatives', 0, 'states', 0, 'scores', 'constructor']
			});
		});

		it('survives deeply nested input without overflowing the stack', () => {
			const deep = '['.repeat(100_000) + ']'.repeat(100_000);
			const result = withJson(`{"schemaVersion":1,"title":${deep}}`);
			expect(result.ok).toBe(false);
		});
	});

	it('rejects unknown keys', () => {
		expect(issuesOf({ ...tiny(), extra: true })).toEqual([
			{ code: 'unrecognized-key', path: ['extra'] }
		]);
		const m = tiny() as unknown as { dimensions: Record<string, unknown>[] };
		m.dimensions[0].color = 'red';
		expect(issuesOf(m)).toEqual([{ code: 'unrecognized-key', path: ['dimensions', 0, 'color'] }]);
	});

	it('rejects wrong types', () => {
		const m = tiny() as unknown as { title: unknown };
		m.title = 7;
		expect(issuesOf(m)).toEqual([
			{ code: 'invalid-type', path: ['title'], params: { expected: 'string' } }
		]);
	});

	it.each([
		['NaN', Number.NaN],
		['Infinity', Number.POSITIVE_INFINITY]
	])('rejects a %s weight', (_, weight) => {
		const m = tiny();
		m.dimensions[0].weight = weight;
		expect(issuesOf(m)[0].path).toEqual(['dimensions', 0, 'weight']);
	});

	it('rejects negative weights and probabilities, and scores outside [0, 10]', () => {
		const m = tiny();
		m.dimensions[0].weight = -1;
		m.alternatives[0].states[0].probability = -0.1;
		m.alternatives[1].states[0].scores.d2 = 11;
		expect(issuesOf(m)).toEqual([
			{ code: 'too-small', path: ['dimensions', 0, 'weight'], params: { minimum: 0 } },
			{
				code: 'too-small',
				path: ['alternatives', 0, 'states', 0, 'probability'],
				params: { minimum: 0 }
			},
			{
				code: 'too-big',
				path: ['alternatives', 1, 'states', 0, 'scores', 'd2'],
				params: { maximum: 10 }
			}
		]);
	});

	describe('limits', () => {
		it('title: 1..120 characters', () => {
			expect(parseModel({ ...tiny(), title: 'x'.repeat(120) }).ok).toBe(true);
			expect(issuesOf({ ...tiny(), title: 'x'.repeat(121) })[0].code).toBe('too-big');
			expect(issuesOf({ ...tiny(), title: '' })[0].code).toBe('too-small');
		});

		it('description ..1000 and horizon ..80 characters', () => {
			expect(
				parseModel({ ...tiny(), description: 'x'.repeat(1000), horizon: 'y'.repeat(80) }).ok
			).toBe(true);
			expect(issuesOf({ ...tiny(), description: 'x'.repeat(1001) })[0].path).toEqual([
				'description'
			]);
			expect(issuesOf({ ...tiny(), horizon: 'y'.repeat(81) })[0].path).toEqual(['horizon']);
		});

		it('names: 1..80 characters', () => {
			const m = tiny();
			m.alternatives[0].name = 'x'.repeat(81);
			expect(issuesOf(m)[0]).toEqual({
				code: 'too-big',
				path: ['alternatives', 0, 'name'],
				params: { maximum: 80 }
			});
		});

		it('ids: 1..64 characters', () => {
			const m = tiny();
			m.alternatives[0].id = '';
			expect(issuesOf(m)[0].path).toEqual(['alternatives', 0, 'id']);
		});

		it('alternatives: 2..8', () => {
			const m = tiny();
			expect(issuesOf({ ...m, alternatives: m.alternatives.slice(0, 1) })[0].code).toBe(
				'too-small'
			);
			const many = Array.from({ length: 9 }, (_, i) => ({ ...m.alternatives[0], id: `a${i}` }));
			expect(issuesOf({ ...m, alternatives: many })[0].code).toBe('too-big');
		});

		it('dimensions: 1..10', () => {
			const m = tiny();
			const many = Array.from({ length: 11 }, (_, i) => ({ id: `d${i}`, name: 'D', weight: 1 }));
			expect(issuesOf({ ...m, dimensions: many })[0]).toMatchObject({
				code: 'too-big',
				path: ['dimensions']
			});
			expect(issuesOf({ ...m, dimensions: [] })[0]).toMatchObject({
				code: 'too-small',
				path: ['dimensions']
			});
		});

		it('states per alternative: 1..8', () => {
			const m = tiny();
			const s = m.alternatives[0].states[0];
			m.alternatives[0].states = Array.from({ length: 9 }, (_, i) => ({ ...s, id: `s${i}` }));
			expect(issuesOf(m)[0]).toMatchObject({
				code: 'too-big',
				path: ['alternatives', 0, 'states']
			});
			m.alternatives[0].states = [];
			expect(issuesOf(m)[0]).toMatchObject({
				code: 'too-small',
				path: ['alternatives', 0, 'states']
			});
		});
	});

	it('rejects duplicate ids within each collection', () => {
		const m = tiny();
		m.dimensions[1].id = 'd1';
		m.alternatives[1].id = 'a1';
		m.alternatives[0].states[1].id = 's1';
		const issues = issuesOf(m).filter((i) => i.code === 'duplicate-id');
		expect(issues.map((i) => i.path)).toEqual([
			['dimensions', 1, 'id'],
			['alternatives', 1, 'id'],
			['alternatives', 0, 'states', 1, 'id']
		]);
	});

	it('accepts the same state id in different alternatives', () => {
		expect(parseModel(tiny()).ok).toBe(true);
	});

	it('rejects scores that do not have exactly the dimension ids as keys', () => {
		const m = tiny();
		m.alternatives[0].states[0].scores = { d1: 5 };
		m.alternatives[1].states[1].scores = { d1: 5, d2: 5, d3: 5 };
		expect(issuesOf(m)).toEqual([
			{ code: 'scores-mismatch', path: ['alternatives', 0, 'states', 0, 'scores'] },
			{ code: 'scores-mismatch', path: ['alternatives', 1, 'states', 1, 'scores'] }
		]);
	});

	it('reports a wrong type deep in the model', () => {
		const m = tiny() as unknown as { schemaVersion: unknown };
		// Passes the version check, then fails z.literal(1) after a hypothetical migration.
		const issues = issuesOf({ ...(m as object), title: 'ok', alternatives: 'nope' });
		expect(issues[0].code).toBe('invalid-type');
	});
});

describe('migrate', () => {
	it('is the identity for the current version', () => {
		const data = { schemaVersion: 1 };
		expect(migrate(data, 1)).toBe(data);
	});

	it('applies each migration from the given version upwards, in order', () => {
		const migrations = [
			(d: Record<string, unknown>) => ({ ...d, schemaVersion: 2, v2: true }),
			(d: Record<string, unknown>) => ({ ...d, schemaVersion: 3, v3: true })
		];
		expect(migrate({ schemaVersion: 1 }, 1, migrations)).toEqual({
			schemaVersion: 3,
			v2: true,
			v3: true
		});
		expect(migrate({ schemaVersion: 2 }, 2, migrations)).toEqual({ schemaVersion: 3, v3: true });
	});
});
