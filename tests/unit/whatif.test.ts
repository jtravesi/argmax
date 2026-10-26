import { describe, expect, it } from 'vitest';
import {
	expectedUtility,
	normalize,
	withDimensionWeight,
	type DecisionModel,
	type NormalizedModel
} from '../../src/lib/core';
import { moveProbability, moveWeight, sideOf } from '../../src/lib/model/whatif';
import { career, tiny } from '../core/helpers';

const norm = (m: DecisionModel) => normalize(m) as NormalizedModel;

describe('what-if moves (MODEL.md §5.1, §5.2)', () => {
	const base = norm(career());

	it('moves one weight and rescales the others proportionally', () => {
		const moved = moveWeight(base, base, 'd1', 0.5) as NormalizedModel;
		expect(moved).toEqual(withDimensionWeight(base, 'd1', 0.5));
		const total = [...moved.weights.values()].reduce((a, b) => a + b, 0);
		expect(total).toBeCloseTo(1, 12);
	});

	it('chains moves on the current what-if model', () => {
		const once = moveWeight(base, base, 'd1', 0.5) as NormalizedModel;
		// After the first move w_d2 = 0.15 · 0.5 / 0.75 = 0.1.
		const twice = moveWeight(once, base, 'd2', 0.2) as NormalizedModel;
		expect(twice.weights.get('d2')).toBe(0.2);
		expect(twice.weights.get('d1')).toBeCloseTo((0.5 * 0.8) / 0.9, 12);
	});

	it('when a weight sits at 100%, moving it back uses the baseline proportions', () => {
		const all = moveWeight(base, base, 'd1', 1) as NormalizedModel;
		expect(all.weights.get('d2')).toBe(0);
		const back = moveWeight(all, base, 'd1', 0.25) as NormalizedModel;
		[...base.weights.values()].forEach((w, i) =>
			expect([...back.weights.values()][i]).toBeCloseTo(w, 12)
		);
	});

	it('returns null when no rescaling is defined, even from the baseline', () => {
		const m = tiny();
		m.dimensions = [m.dimensions[0]];
		m.alternatives.forEach((a) => a.states.forEach((s) => (s.scores = { d1: s.scores.d1 })));
		const single = norm(m);
		expect(moveWeight(single, single, 'd1', 0.5)).toBeNull();
	});

	it('moves a probability within one alternative only', () => {
		const moved = moveProbability(base, base, 'a3', 's1', 0.5) as NormalizedModel;
		expect(moved.alternatives[2].states[0].probability).toBe(0.5);
		expect(expectedUtility(moved, 'a1')).toBe(expectedUtility(base, 'a1'));
		const all = moveProbability(base, base, 'a3', 's1', 1) as NormalizedModel;
		const back = moveProbability(all, base, 'a3', 's1', 0.2) as NormalizedModel;
		base.alternatives[2].states.forEach((s, j) =>
			expect(back.alternatives[2].states[j].probability).toBeCloseTo(s.probability, 12)
		);
	});

	it('returns null for a single-state alternative', () => {
		const m = tiny();
		m.alternatives[0].states = [m.alternatives[0].states[0]];
		const single = norm(m);
		expect(moveProbability(single, single, 'a1', 's1', 0.5)).toBeNull();
	});
});

describe('sideOf', () => {
	it('says on which side of the current value the change happens', () => {
		expect(sideOf(0.25, 0.72)).toBe('above');
		expect(sideOf(0.15, 0.05)).toBe('below');
		expect(sideOf(0.3, 0.3)).toBe('at');
	});
});
