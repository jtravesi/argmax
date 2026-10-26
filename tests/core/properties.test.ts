// Mathematical properties (ARCHITECTURE.md §6), checked on random valid models.
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
	contributions,
	deserialize,
	dominance,
	expectedProfile,
	expectedUtility,
	normalize,
	parseModel,
	rank,
	riskProfile,
	serialize,
	stateUtilities,
	tippingProbability,
	tippingWeight,
	withDimensionWeight,
	withStateProbability,
	type DecisionModel,
	type Id,
	type NormalizedModel
} from '../../src/lib/core';
import { modelArb } from './arbitraries';

const TOL = 1e-9;

function norm(model: DecisionModel): NormalizedModel {
	const nm = normalize(model);
	if (!nm) throw new Error('generator produced an invalid model');
	return nm;
}

/** A model together with a dimension and two different alternatives picked from it. */
const pickArb = modelArb().chain((model) =>
	fc.record({
		model: fc.constant(model),
		k: fc.integer({ min: 0, max: model.dimensions.length - 1 }),
		pair: fc
			.uniqueArray(fc.integer({ min: 0, max: model.alternatives.length - 1 }), {
				minLength: 2,
				maxLength: 2
			})
			.map(([i, j]) => [model.alternatives[i].id, model.alternatives[j].id] as const),
		j: fc.nat()
	})
);

/** Gaps between consecutive EUs of the ranking. */
const gaps = (nm: NormalizedModel) => {
	const r = rank(nm);
	return r.slice(1).map((x, i) => r[i].eu - x.eu);
};

describe('properties (fast-check)', () => {
	it('EU(a) lies in [worst, best] ⊆ [0, 10]', () => {
		fc.assert(
			fc.property(modelArb(), (model) => {
				const nm = norm(model);
				for (const alt of nm.alternatives) {
					const eu = expectedUtility(nm, alt.id);
					const { worst, best } = riskProfile(nm, alt.id);
					expect(worst).toBeGreaterThanOrEqual(-TOL);
					expect(best).toBeLessThanOrEqual(10 + TOL);
					expect(eu).toBeGreaterThanOrEqual(worst - TOL);
					expect(eu).toBeLessThanOrEqual(best + TOL);
				}
			})
		);
	});

	it('contributions add up to EU(a)', () => {
		fc.assert(
			fc.property(modelArb(), (model) => {
				const nm = norm(model);
				for (const alt of nm.alternatives) {
					const total = [...contributions(nm, alt.id).values()].reduce((a, b) => a + b, 0);
					expect(total).toBeCloseTo(expectedUtility(nm, alt.id), 9);
				}
			})
		);
	});

	it('the two forms of EU agree (MODEL.md §3)', () => {
		fc.assert(
			fc.property(modelArb(), (model) => {
				const nm = norm(model);
				for (const alt of nm.alternatives) {
					const profile = expectedProfile(nm, alt.id);
					let viaProfile = 0;
					for (const [d, w] of nm.weights) viaProfile += w * (profile.get(d) as number);
					expect(Math.abs(viaProfile - expectedUtility(nm, alt.id))).toBeLessThanOrEqual(TOL);
				}
			})
		);
	});

	it('the ranking is invariant when all raw weights are multiplied by c > 0', () => {
		fc.assert(
			fc.property(modelArb(), fc.double({ min: 0.01, max: 100, noNaN: true }), (model, c) => {
				const nm = norm(model);
				fc.pre(gaps(nm).every((g) => g > 1e-6));
				const scaled = structuredClone(model);
				scaled.dimensions.forEach((d) => (d.weight *= c));
				expect(rank(norm(scaled)).map((r) => r.altId)).toEqual(rank(nm).map((r) => r.altId));
			})
		);
	});

	it('the ranking is invariant under the same positive affine map of all scores', () => {
		fc.assert(
			fc.property(
				modelArb(),
				fc.double({ min: 0.1, max: 1, noNaN: true }),
				fc.double({ min: 0, max: 1, noNaN: true }),
				(model, alpha, s) => {
					const nm = norm(model);
					fc.pre(gaps(nm).every((g) => g > 1e-6));
					const beta = s * 10 * (1 - alpha); // keeps αx + β within [0, 10]
					const mapped = structuredClone(model);
					for (const alt of mapped.alternatives) {
						for (const st of alt.states) {
							for (const d of Object.keys(st.scores)) {
								st.scores[d] = Math.min(10, alpha * st.scores[d] + beta);
							}
						}
					}
					expect(rank(norm(mapped)).map((r) => r.altId)).toEqual(rank(nm).map((r) => r.altId));
				}
			)
		);
	});

	it('withDimensionWeight(nm, k, w_k) and withStateProbability(nm, a, j, p_j) leave EU unchanged', () => {
		fc.assert(
			fc.property(pickArb, ({ model, k, pair: [a], j }) => {
				const nm = norm(model);
				const dimId = nm.dimensionIds[k];
				const alt = nm.alternatives.find((x) => x.id === a) as NormalizedModel['alternatives'][0];
				const state = alt.states[j % alt.states.length];

				const sameW = withDimensionWeight(nm, dimId, nm.weights.get(dimId) as number);
				const sameP = withStateProbability(nm, a, state.id, state.probability);
				for (const other of nm.alternatives) {
					const eu = expectedUtility(nm, other.id);
					if (sameW)
						expect(Math.abs(expectedUtility(sameW, other.id) - eu)).toBeLessThanOrEqual(TOL);
					if (sameP)
						expect(Math.abs(expectedUtility(sameP, other.id) - eu)).toBeLessThanOrEqual(TOL);
				}
			})
		);
	});

	describe('tipping weight (MODEL.md §5.1)', () => {
		const delta = (m: NormalizedModel, a: Id, b: Id) =>
			expectedUtility(m, a) - expectedUtility(m, b);

		it('ties the two alternatives at t*, and reverses their order on either side', () => {
			fc.assert(
				fc.property(pickArb, ({ model, k, pair: [a, b] }) => {
					const nm = norm(model);
					const dimId = nm.dimensionIds[k];
					const t = tippingWeight(nm, dimId, a, b);
					if (t === null) return;
					const at = (x: number) =>
						delta(withDimensionWeight(nm, dimId, x) as NormalizedModel, a, b);

					expect(Math.abs(at(t))).toBeLessThanOrEqual(TOL);
					const slope = at(1) - at(0);
					const h = 1e-6;
					if (Math.abs(slope) > 1e-3 && t - h >= 0 && t + h <= 1) {
						expect(Math.sign(at(t - h))).toBe(-Math.sign(at(t + h)));
					}
				})
			);
		});

		it('matches a fine numerical sweep', () => {
			const n = 1000;
			fc.assert(
				fc.property(pickArb, ({ model, k, pair: [a, b] }) => {
					const nm = norm(model);
					const dimId = nm.dimensionIds[k];
					const wk = nm.weights.get(dimId) as number;
					fc.pre(wk < 1 - 1e-6);
					const xa = expectedProfile(nm, a);
					const xb = expectedProfile(nm, b);
					// Rescale the weights by hand, independently of withDimensionWeight.
					const gap = (t: number) => {
						let g = 0;
						for (const [d, w] of nm.weights) {
							const wd = d === dimId ? t : ((1 - t) * w) / (1 - wk);
							g += wd * ((xa.get(d) as number) - (xb.get(d) as number));
						}
						return g;
					};
					fc.pre(Math.abs(gap(1) - gap(0)) > 1e-6);

					let crossing: number | null = null;
					for (let i = 0; i < n && crossing === null; i++) {
						if (gap(i / n) === 0 || gap(i / n) * gap((i + 1) / n) < 0) crossing = i / n;
					}
					const t = tippingWeight(nm, dimId, a, b);
					if (crossing !== null) {
						expect(t).not.toBeNull();
						expect(Math.abs((t as number) - crossing)).toBeLessThanOrEqual(1 / n + TOL);
					} else if (t !== null) {
						// No strict sign change on the grid: t* sits on (or within 1/n of) a grid end.
						expect(Math.min(t, 1 - t)).toBeLessThanOrEqual(1 / n + TOL);
					}
				})
			);
		});
	});

	it('tipping probability (MODEL.md §5.2): tie at q*, order reversed on either side', () => {
		fc.assert(
			fc.property(pickArb, ({ model, pair: [a, b], j }) => {
				const nm = norm(model);
				const alt = nm.alternatives.find((x) => x.id === a) as NormalizedModel['alternatives'][0];
				const stateId = alt.states[j % alt.states.length].id;
				const q = tippingProbability(nm, a, stateId, b);
				if (q === null) return;
				const euB = expectedUtility(nm, b);
				const at = (x: number) =>
					expectedUtility(withStateProbability(nm, a, stateId, x) as NormalizedModel, a) - euB;

				expect(Math.abs(at(q))).toBeLessThanOrEqual(TOL);
				const slope = at(1) - at(0);
				const h = 1e-6;
				if (Math.abs(slope) > 1e-3 && q - h >= 0 && q + h <= 1) {
					expect(Math.sign(at(q - h))).toBe(-Math.sign(at(q + h)));
				}
				// Only EU(a) moves (MODEL.md §5.2).
				const moved = withStateProbability(nm, a, stateId, q) as NormalizedModel;
				expect(expectedUtility(moved, b)).toBe(euB);
				expect(stateUtilities(moved, a)).toEqual(stateUtilities(nm, a));
			})
		);
	});

	it('if a dominates b, EU(a) ≥ EU(b) for random weights (MODEL.md §6)', () => {
		fc.assert(
			fc.property(
				modelArb({ maxDimensions: 3, maxStates: 2 }),
				fc.array(fc.double({ min: 0, max: 1, noNaN: true }), { minLength: 3, maxLength: 3 }),
				(model, raw) => {
					const pairs = dominance(norm(model));
					fc.pre(raw.slice(0, model.dimensions.length).some((w) => w > 1e-3));
					const reweighted = structuredClone(model);
					reweighted.dimensions.forEach((d, i) => (d.weight = raw[i]));
					const nm = norm(reweighted);
					for (const { dominant, dominated } of pairs) {
						expect(expectedUtility(nm, dominant)).toBeGreaterThanOrEqual(
							expectedUtility(nm, dominated) - TOL
						);
					}
				}
			)
		);
	});

	it('parseModel(serialize(m)) returns m', () => {
		fc.assert(
			fc.property(modelArb(), (model) => {
				expect(parseModel(JSON.parse(serialize(model)))).toEqual({ ok: true, value: model });
				expect(deserialize(serialize(model))).toEqual({ ok: true, value: model });
			})
		);
	});
});
