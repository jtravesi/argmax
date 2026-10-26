// The oracle (ARCHITECTURE.md §6): every value in career-decision.expected.json, tolerance 1e-9.
import { describe, expect, it } from 'vitest';
import {
	expectedProfile,
	expectedUtility,
	normalize,
	rank,
	riskProfile,
	stateUtility,
	tippingProbability,
	tippingWeight,
	type NormalizedModel
} from '../../src/lib/core';
import { career, readFixture } from './helpers';

interface Expected {
	tolerance: number;
	normalizedWeights: Record<string, number>;
	alternatives: Record<
		string,
		{
			expectedUtility: number;
			variance: number;
			stdDev: number;
			worstCase: number;
			bestCase: number;
			pBelowTau: number;
			stateUtilities: Record<string, number>;
			expectedProfile: Record<string, number>;
		}
	>;
	ranking: string[];
	tippingWeights: { dimension: string; a: string; b: string; weight: number | null }[];
	tippingProbabilities: {
		alternative: string;
		state: string;
		against: string;
		probability: number | null;
	}[];
}

const expected = readFixture<Expected>('career-decision.expected.json');
const TOL = expected.tolerance;
const nm = normalize(career()) as NormalizedModel;

function expectClose(actual: number | null, wanted: number | null) {
	if (wanted === null) expect(actual).toBeNull();
	else expect(Math.abs((actual as number) - wanted)).toBeLessThanOrEqual(TOL);
}

describe('oracle: fixtures/career-decision.expected.json', () => {
	it('normalizes the model', () => {
		expect(nm).not.toBeNull();
	});

	it('normalized weights', () => {
		for (const [id, w] of Object.entries(expected.normalizedWeights)) {
			expectClose(nm.weights.get(id) as number, w);
		}
	});

	for (const [altId, exp] of Object.entries(expected.alternatives)) {
		describe(`alternative ${altId}`, () => {
			it('expected utility and risk profile', () => {
				expectClose(expectedUtility(nm, altId), exp.expectedUtility);
				const risk = riskProfile(nm, altId);
				expectClose(risk.variance, exp.variance);
				expectClose(risk.stdDev, exp.stdDev);
				expectClose(risk.worst, exp.worstCase);
				expectClose(risk.best, exp.bestCase);
				expectClose(risk.pBelowTau, exp.pBelowTau);
			});

			it('state utilities', () => {
				for (const [stateId, u] of Object.entries(exp.stateUtilities)) {
					expectClose(stateUtility(nm, altId, stateId), u);
				}
			});

			it('expected profile', () => {
				const profile = expectedProfile(nm, altId);
				for (const [dimId, x] of Object.entries(exp.expectedProfile)) {
					expectClose(profile.get(dimId) as number, x);
				}
			});
		});
	}

	it('ranking', () => {
		expect(rank(nm).map((r) => r.altId)).toEqual(expected.ranking);
	});

	it('tipping weights', () => {
		for (const tp of expected.tippingWeights) {
			expectClose(tippingWeight(nm, tp.dimension, tp.a, tp.b), tp.weight);
		}
	});

	it('tipping probabilities', () => {
		for (const tp of expected.tippingProbabilities) {
			expectClose(tippingProbability(nm, tp.alternative, tp.state, tp.against), tp.probability);
		}
	});
});
