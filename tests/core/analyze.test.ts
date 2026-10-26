import { describe, expect, it } from 'vitest';
import {
	analyze,
	dominance,
	normalize,
	rank,
	riskProfile,
	robustness,
	stateUtility,
	type Analysis,
	type DecisionModel,
	type NormalizedModel
} from '../../src/lib/core';
import { career, readFixture, tiny } from './helpers';

const norm = (m: DecisionModel) => normalize(m) as NormalizedModel;

describe('normalize', () => {
	it('returns null when the model has errors', () => {
		const m = tiny();
		m.dimensions[0].weight = -1;
		expect(normalize(m)).toBeNull();
	});

	it('puts weights and probabilities on the simplex', () => {
		const m = tiny();
		m.dimensions.forEach((d) => (d.weight = 30));
		m.alternatives[1].states[0].probability = 1;
		m.alternatives[1].states[1].probability = 3;
		const nm = norm(m);
		expect([...nm.weights.values()]).toEqual([0.5, 0.5]);
		expect(nm.alternatives[1].states.map((s) => s.probability)).toEqual([0.25, 0.75]);
	});

	it('does not mutate its argument', () => {
		const m = tiny();
		m.dimensions.forEach((d) => (d.weight = 30));
		normalize(m);
		expect(m.dimensions[0].weight).toBe(30);
	});
});

describe('utility lookups', () => {
	it('throws on unknown ids', () => {
		const nm = norm(tiny());
		expect(() => stateUtility(nm, 'nope', 's1')).toThrow(/Unknown alternative/);
		expect(() => stateUtility(nm, 'a1', 'nope')).toThrow(/Unknown state/);
	});
});

describe('rank', () => {
	it('keeps input order for alternatives tied within EPS', () => {
		const m = tiny();
		m.alternatives[0].states = structuredClone(m.alternatives[1].states);
		// Same EU up to rounding, entered as a1 then a2.
		m.alternatives[1].states[0].scores.d1 += 1e-12;
		expect(rank(norm(m)).map((r) => r.altId)).toEqual(['a1', 'a2']);
		m.alternatives.reverse();
		expect(rank(norm(m)).map((r) => r.altId)).toEqual(['a2', 'a1']);
	});
});

describe('riskProfile', () => {
	it('counts only states strictly below τ', () => {
		// u(a1, s2) = 3, u(a1, s1) = 7.
		const nm = norm(tiny());
		expect(riskProfile(nm, 'a1', 3).pBelowTau).toBe(0);
		expect(riskProfile(nm, 'a1', 3.5).pBelowTau).toBe(0.5);
		expect(riskProfile(nm, 'a1', 7.5).pBelowTau).toBe(1);
	});
});

describe('dominance (MODEL.md §6)', () => {
	it('finds a dominates b', () => {
		expect(dominance(norm(tiny()))).toEqual([{ dominant: 'a1', dominated: 'a2' }]);
	});

	it('reports nothing for the oracle model', () => {
		expect(dominance(norm(career()))).toEqual([]);
	});

	it('requires a strict improvement on at least one dimension', () => {
		const m = tiny();
		m.alternatives[1].states = structuredClone(m.alternatives[0].states);
		expect(dominance(norm(m))).toEqual([]);
	});
});

describe('robustness (SPEC.md §3.2)', () => {
	it.each([
		[1.01, 'clear'],
		[1, 'moderate'],
		[0.31, 'moderate'],
		[0.3, 'close'],
		[0, 'close']
	] as const)('gap %s is %s', (gap, label) => {
		expect(robustness(gap)).toBe(label);
	});
});

describe('analyze', () => {
	it('returns the validation issues when the model has errors', () => {
		const m = tiny();
		m.alternatives.pop();
		const result = analyze(m);
		expect(result).toEqual({
			ok: false,
			errors: [{ code: 'too-few-alternatives', path: ['alternatives'] }],
			warnings: []
		});
	});

	describe('on the oracle model', () => {
		const result = analyze(career()) as Analysis;
		const expected = readFixture<{
			tippingWeights: { dimension: string; weight: number | null }[];
			tippingProbabilities: { alternative: string; state: string; probability: number | null }[];
		}>('career-decision.expected.json');

		it('gives the verdict', () => {
			expect(result.ok).toBe(true);
			expect(result.verdict.winner).toBe('a1');
			expect(result.verdict.runnerUp).toBe('a3');
			expect(result.verdict.eu).toBeCloseTo(5.705, 9);
			expect(result.verdict.gap).toBeCloseTo(0.51, 9);
			expect(result.verdict.robustness).toBe('moderate');
			expect(result.warnings).toEqual([]);
		});

		it('breaks down each alternative in input order', () => {
			expect(result.alternatives.map((a) => a.id)).toEqual(['a1', 'a2', 'a3']);
			const a1 = result.alternatives[0];
			expect(a1.eu).toBeCloseTo(5.705, 9);
			expect(a1.states[0].id).toBe('s1');
			expect(a1.states[0].probability).toBeCloseTo(0.35, 9);
			expect(a1.states[0].utility).toBeCloseTo(6.9, 9);
			expect(a1.states[0].contribution).toBeCloseTo(0.35 * 6.9, 9);
			expect(a1.risk.worst).toBeCloseTo(4.05, 9);
			expect(a1.profile.get('d3')).toBeCloseTo(7.45, 9);
		});

		it('computes tipping weights of the runner-up against the winner', () => {
			expect(result.tippingWeights.map((t) => t.dimId)).toEqual(['d1', 'd2', 'd3', 'd4', 'd5']);
			expected.tippingWeights.forEach((tp, i) => {
				if (tp.weight === null) expect(result.tippingWeights[i].weight).toBeNull();
				else expect(result.tippingWeights[i].weight).toBeCloseTo(tp.weight, 9);
			});
		});

		it('computes tipping probabilities for the states of the top two', () => {
			expect(result.tippingProbabilities).toHaveLength(8);
			for (const tp of expected.tippingProbabilities) {
				const got = result.tippingProbabilities.find(
					(x) => x.altId === tp.alternative && x.stateId === tp.state
				);
				expect(got?.against).toBe('a1');
				expect(got?.probability).toBeCloseTo(tp.probability as number, 9);
			}
		});

		it('includes dominance and the tornado', () => {
			expect(result.dominance).toEqual([]);
			expect(result.tornado.length).toBeGreaterThan(0);
		});
	});

	it('passes τ and h through', () => {
		const result = analyze(career(), { tau: 7, h: 0.2 }) as Analysis;
		expect(result.alternatives[0].risk.pBelowTau).toBeCloseTo(0.9, 9);
		const bar = result.tornado.find(
			(b) => b.parameter.kind === 'weight' && b.parameter.dimId === 'd1'
		) as Analysis['tornado'][0];
		expect(bar.high - bar.low).toBeCloseTo(0.4, 9);
	});

	it('reports warnings alongside the results', () => {
		const m = tiny();
		m.dimensions.forEach((d) => (d.weight = 50));
		const result = analyze(m) as Analysis;
		expect(result.ok).toBe(true);
		expect(result.warnings.map((w) => w.code)).toEqual(['weights-not-normalized']);
		expect(result.verdict.robustness).toBe('moderate');
	});
});
