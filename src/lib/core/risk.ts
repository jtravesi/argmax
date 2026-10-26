import { alternativeOf } from './normalize';
import { EPS, type Id, type NormalizedModel } from './types';
import { expectedUtility, stateUtilities } from './utility';

export interface RiskProfile {
	/** Worst case, min_s u(a, s). */
	worst: number;
	/** Best case, max_s u(a, s). */
	best: number;
	/** σ²(a) = Σ_s p_a(s) (u(a, s) − EU(a))². */
	variance: number;
	stdDev: number;
	/** P_τ(a) = Σ_{s : u(a,s) < τ} p_a(s). */
	pBelowTau: number;
}

/** Risk indicators, MODEL.md §4. They do not change the recommendation. */
export function riskProfile(nm: NormalizedModel, altId: Id, tau = 5): RiskProfile {
	const states = alternativeOf(nm, altId).states;
	const u = stateUtilities(nm, altId);
	const eu = expectedUtility(nm, altId);
	const values = [...u.values()];

	let variance = 0;
	let pBelowTau = 0;
	for (const s of states) {
		const us = u.get(s.id) as number;
		variance += s.probability * (us - eu) ** 2;
		// A utility within EPS of τ is not below it.
		if (us < tau - EPS) pBelowTau += s.probability;
	}

	return {
		worst: Math.min(...values),
		best: Math.max(...values),
		variance,
		stdDev: Math.sqrt(variance),
		pBelowTau
	};
}
