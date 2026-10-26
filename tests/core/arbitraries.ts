// fast-check generators of random valid models (ARCHITECTURE.md §6).
import fc from 'fast-check';
import type { DecisionModel } from '../../src/lib/core/types';

export interface Sizes {
	maxDimensions?: number;
	maxAlternatives?: number;
	maxStates?: number;
}

/** A finite number in [min, max]; never -0, which JSON cannot round-trip. */
const num = (min: number, max: number) =>
	fc.double({ min, max, noNaN: true, noDefaultInfinity: true }).map((x) => x + 0);

/** Raw non-negative values with a sum comfortably above zero. */
const rawSimplex = (n: number) =>
	fc
		.array(num(0, 100), { minLength: n, maxLength: n })
		.filter((xs) => xs.reduce((a, b) => a + b, 0) > 1e-3);

export function modelArb(sizes: Sizes = {}): fc.Arbitrary<DecisionModel> {
	const { maxDimensions = 5, maxAlternatives = 4, maxStates = 4 } = sizes;
	return fc
		.record({
			nDims: fc.integer({ min: 1, max: maxDimensions }),
			stateCounts: fc.array(fc.integer({ min: 1, max: maxStates }), {
				minLength: 2,
				maxLength: maxAlternatives
			})
		})
		.chain(({ nDims, stateCounts }) => {
			const dimIds = Array.from({ length: nDims }, (_, i) => `d${i + 1}`);
			return fc
				.record({
					title: fc.string({ minLength: 1, maxLength: 120 }),
					weights: rawSimplex(nDims),
					alternatives: fc.tuple(
						...stateCounts.map((n) =>
							fc.record({
								name: fc.string({ minLength: 1, maxLength: 80 }),
								probabilities: rawSimplex(n),
								scores: fc.array(fc.array(num(0, 10), { minLength: nDims, maxLength: nDims }), {
									minLength: n,
									maxLength: n
								})
							})
						)
					)
				})
				.map((r): DecisionModel => ({
					schemaVersion: 1,
					title: r.title,
					dimensions: dimIds.map((id, i) => ({ id, name: `Dim ${i + 1}`, weight: r.weights[i] })),
					alternatives: r.alternatives.map((a, k) => ({
						id: `a${k + 1}`,
						name: a.name,
						states: a.probabilities.map((p, j) => ({
							id: `s${j + 1}`,
							name: `State ${j + 1}`,
							probability: p,
							scores: Object.fromEntries(dimIds.map((d, i) => [d, a.scores[j][i]]))
						}))
					}))
				}));
		});
}
