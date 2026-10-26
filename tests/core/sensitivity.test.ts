import { describe, expect, it } from 'vitest';
import {
	expectedUtility,
	normalize,
	rank,
	scoreThreshold,
	tippingProbability,
	tippingWeight,
	tornado,
	withDimensionWeight,
	withStateProbability,
	type DecisionModel,
	type NormalizedModel
} from '../../src/lib/core';
import { career, tiny } from './helpers';

const norm = (m: DecisionModel) => normalize(m) as NormalizedModel;

/** tiny(): EU(a1) = 5, EU(a2) = 4.25. */
const nm = norm(tiny());

describe('withDimensionWeight (MODEL.md §5.1)', () => {
	it('sets w_k = t and rescales the rest proportionally', () => {
		const m = norm({
			...tiny(),
			dimensions: [
				{ id: 'd1', name: 'A', weight: 0.5 },
				{ id: 'd2', name: 'B', weight: 0.5 }
			]
		});
		const moved = withDimensionWeight(m, 'd1', 0.8) as NormalizedModel;
		expect(moved.weights.get('d1')).toBe(0.8);
		expect(moved.weights.get('d2')).toBeCloseTo(0.2, 12);
	});

	it('does not mutate its argument', () => {
		withDimensionWeight(nm, 'd1', 0.9);
		expect(nm.weights.get('d1')).toBe(0.5);
	});

	it('returns null when w_k = 1', () => {
		const m = tiny();
		m.dimensions[0].weight = 1;
		m.dimensions[1].weight = 0;
		expect(withDimensionWeight(norm(m), 'd1', 0.5)).toBeNull();
		expect(tippingWeight(norm(m), 'd1', 'a1', 'a2')).toBeNull();
	});

	it('rejects t outside [0, 1] and unknown dimensions', () => {
		expect(() => withDimensionWeight(nm, 'd1', 1.1)).toThrow(RangeError);
		expect(() => withDimensionWeight(nm, 'd1', Number.NaN)).toThrow(RangeError);
		expect(() => withDimensionWeight(nm, 'nope', 0.5)).toThrow(/Unknown dimension/);
	});
});

describe('withStateProbability (MODEL.md §5.2)', () => {
	it('sets p_a(j) = q, rescales the other states of a only', () => {
		const moved = withStateProbability(nm, 'a2', 's1', 0.5) as NormalizedModel;
		expect(moved.alternatives[1].states.map((s) => s.probability)).toEqual([0.5, 0.5]);
		expect(moved.alternatives[0]).toBe(nm.alternatives[0]);
		expect(nm.alternatives[1].states[0].probability).toBe(0.25);
	});

	it('returns null when p_a(j) = 1', () => {
		const m = tiny();
		m.alternatives[0].states = [m.alternatives[0].states[0]];
		expect(withStateProbability(norm(m), 'a1', 's1', 0.5)).toBeNull();
		expect(tippingProbability(norm(m), 'a1', 's1', 'a2')).toBeNull();
	});

	it('rejects q outside [0, 1] and unknown ids', () => {
		expect(() => withStateProbability(nm, 'a1', 's1', -0.1)).toThrow(RangeError);
		expect(() => withStateProbability(nm, 'zz', 's1', 0.5)).toThrow(/Unknown alternative/);
		expect(() => withStateProbability(nm, 'a1', 'zz', 0.5)).toThrow(/Unknown state/);
	});
});

describe('tipping points', () => {
	it('tippingWeight returns null when the two lines are parallel', () => {
		// Identical alternatives: Δ(t) ≡ 0, zero denominator.
		const m = tiny();
		m.alternatives[1].states = structuredClone(m.alternatives[0].states);
		expect(tippingWeight(norm(m), 'd1', 'a1', 'a2')).toBeNull();
	});

	it('tippingWeight returns null when t* falls outside [0, 1]', () => {
		// a1 dominates a2 in tiny(): no weight reverses the order.
		expect(tippingWeight(nm, 'd1', 'a1', 'a2')).toBeNull();
		expect(tippingWeight(nm, 'd2', 'a1', 'a2')).toBeNull();
	});

	it('tippingProbability returns null when u(a, j) = M_{a,j}', () => {
		const m = tiny();
		m.alternatives[1].states[1].scores = { ...m.alternatives[1].states[0].scores };
		expect(tippingProbability(norm(m), 'a2', 's1', 'a1')).toBeNull();
	});

	it('tippingProbability returns null when q* falls outside [0, 1]', () => {
		// a2 can reach at most u(a2, s1) = 8 > 5, but its other state is 3 < 5:
		// q* = (5 − 3) / (8 − 3) = 0.4 is reachable; the reverse is not.
		expect(tippingProbability(nm, 'a2', 's1', 'a1')).toBeCloseTo(0.4, 12);
		// For a1: q* = (4.25 − 3) / (7 − 3).
		expect(tippingProbability(nm, 'a1', 's1', 'a2')).toBeCloseTo(0.3125, 12);
		const m = tiny();
		m.alternatives[1].states[0].scores = { d1: 4, d2: 4 };
		expect(tippingProbability(norm(m), 'a2', 's1', 'a1')).toBeNull();
	});

	it('rejects comparing an alternative with itself', () => {
		expect(() => tippingWeight(nm, 'd1', 'a1', 'a1')).toThrow();
		expect(() => tippingProbability(nm, 'a1', 's1', 'a1')).toThrow();
		expect(() => scoreThreshold(nm, 'a1', 's1', 'd1', 'a1')).toThrow();
	});
});

describe('scoreThreshold (MODEL.md §5.3)', () => {
	it('returns the score at which the two alternatives tie', () => {
		// δ = (5 − 4.25) / (0.75 · 0.5) = 2, so x goes from 3 to 5.
		const x = scoreThreshold(nm, 'a2', 's2', 'd1', 'a1') as number;
		expect(x).toBeCloseTo(5, 12);
		const m = tiny();
		m.alternatives[1].states[1].scores.d1 = x;
		expect(expectedUtility(norm(m), 'a2')).toBeCloseTo(expectedUtility(nm, 'a1'), 12);
	});

	it('returns null when the score would leave [0, 10]', () => {
		// δ = 0.75 / (0.25 · 0.5) = 6: 6 + 6 = 12.
		expect(scoreThreshold(nm, 'a2', 's1', 'd1', 'a1')).toBeNull();
		// Lowering a1 below a2 needs x_{a1,s2,d1} = 2 − 3 < 0.
		expect(scoreThreshold(nm, 'a1', 's2', 'd1', 'a2')).toBeNull();
	});

	it('returns null when p_a(s) w_d = 0', () => {
		const m = tiny();
		m.dimensions[0].weight = 0;
		expect(scoreThreshold(norm(m), 'a2', 's2', 'd1', 'a1')).toBeNull();
	});
});

describe('tornado (MODEL.md §5.4)', () => {
	const cm = norm(career());
	const bars = tornado(cm);

	it('has one bar per weight and per state probability', () => {
		expect(bars).toHaveLength(5 + 4 * 3);
	});

	it('explores [max(0, θ − h), min(1, θ + h)]', () => {
		for (const bar of bars) {
			expect(bar.low).toBeCloseTo(Math.max(0, bar.base - 0.1), 12);
			expect(bar.high).toBeCloseTo(Math.min(1, bar.base + 0.1), 12);
		}
		// w_d1 = 0.25, so [0.05, 0.45] is not clipped.
		const wide = tornado(cm, 0.2).find(
			(b) => b.parameter.kind === 'weight' && b.parameter.dimId === 'd1'
		) as (typeof bars)[0];
		expect(wide.high - wide.low).toBeCloseTo(0.4, 12);
	});

	it('is sorted by length, longest first', () => {
		const lengths = bars.map((b) => b.max - b.min);
		expect(lengths).toEqual([...lengths].sort((x, y) => y - x));
	});

	it('the baseline gap lies inside every bar (G is affine)', () => {
		const [first, second] = rank(cm);
		const g = first.eu - second.eu;
		for (const bar of bars) {
			expect(bar.min).toBeLessThanOrEqual(g + 1e-9);
			expect(bar.max).toBeGreaterThanOrEqual(g - 1e-9);
		}
	});

	it('bars for states of a third alternative have zero length', () => {
		const third = bars.filter(
			(b) => b.parameter.kind === 'probability' && b.parameter.altId === 'a2'
		);
		expect(third).toHaveLength(4);
		for (const bar of third) expect(bar.max - bar.min).toBe(0);
	});

	it('a bar that crosses 0 changes the winner at that end', () => {
		const crossing = tornado(cm, 0.2).filter((b) => b.min < 0);
		expect(crossing.length).toBeGreaterThan(0);
		for (const bar of crossing) {
			const end = bar.gapAtLow < 0 ? bar.winnerAtLow : bar.winnerAtHigh;
			expect(end).not.toBe('a1');
		}
	});

	it('detects a third alternative taking first place at an end', () => {
		// a3 is last, but wins outright when d3 dominates the weights.
		const m: DecisionModel = {
			schemaVersion: 1,
			title: 'Third',
			dimensions: [
				{ id: 'd1', name: 'A', weight: 0.6 },
				{ id: 'd2', name: 'B', weight: 0.4 }
			],
			alternatives: [
				{
					id: 'a1',
					name: 'One',
					states: [{ id: 's', name: 'S', probability: 1, scores: { d1: 6, d2: 4 } }]
				},
				{
					id: 'a2',
					name: 'Two',
					states: [{ id: 's', name: 'S', probability: 1, scores: { d1: 5, d2: 5 } }]
				},
				{
					id: 'a3',
					name: 'Three',
					states: [{ id: 's', name: 'S', probability: 1, scores: { d1: 0, d2: 10 } }]
				}
			]
		};
		const bar = tornado(norm(m), 0.4).find(
			(b) => b.parameter.kind === 'weight' && b.parameter.dimId === 'd1'
		) as (typeof bars)[0];
		expect(bar.winnerAtLow).toBe('a3');
		expect(bar.winnerAtHigh).toBe('a1');
	});

	it('leaves out parameters whose rescaling is undefined', () => {
		const m = tiny();
		m.dimensions[0].weight = 1;
		m.dimensions[1].weight = 0;
		m.alternatives[0].states = [m.alternatives[0].states[0]];
		const kinds = tornado(norm(m)).map((b) => b.parameter);
		expect(kinds).not.toContainEqual({ kind: 'weight', dimId: 'd1' });
		expect(kinds).not.toContainEqual({ kind: 'probability', altId: 'a1', stateId: 's1' });
		expect(kinds).toContainEqual({ kind: 'weight', dimId: 'd2' });
	});

	it('rejects h outside (0, 1]', () => {
		expect(() => tornado(cm, 0)).toThrow(RangeError);
		expect(() => tornado(cm, 1.5)).toThrow(RangeError);
	});
});
