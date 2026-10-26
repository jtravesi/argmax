import { alternativeOf, stateOf } from './normalize';
import { EPS, type Id, type NormalizedModel, type NormalizedState } from './types';

/** u(a, s) = Σ_d w_d x_{a,s,d} (MODEL.md §2). */
function utilityOf(nm: NormalizedModel, state: NormalizedState): number {
	let u = 0;
	for (const [d, w] of nm.weights) u += w * (state.scores.get(d) as number);
	return u;
}

export function stateUtility(nm: NormalizedModel, altId: Id, stateId: Id): number {
	return utilityOf(nm, stateOf(alternativeOf(nm, altId), stateId));
}

/** u(a, s) for every state of a, in input order. */
export function stateUtilities(nm: NormalizedModel, altId: Id): Map<Id, number> {
	return new Map(alternativeOf(nm, altId).states.map((s) => [s.id, utilityOf(nm, s)]));
}

/** Expected profile x̄_{a,d} = Σ_s p_a(s) x_{a,s,d} (MODEL.md §3). */
export function expectedProfile(nm: NormalizedModel, altId: Id): Map<Id, number> {
	const states = alternativeOf(nm, altId).states;
	return new Map(
		nm.dimensionIds.map((d) => [
			d,
			states.reduce((acc, s) => acc + s.probability * (s.scores.get(d) as number), 0)
		])
	);
}

/** EU(a) = Σ_s p_a(s) u(a, s) (MODEL.md §3). */
export function expectedUtility(nm: NormalizedModel, altId: Id): number {
	return alternativeOf(nm, altId).states.reduce(
		(acc, s) => acc + s.probability * utilityOf(nm, s),
		0
	);
}

/** Contribution of each state, c(a, s) = p_a(s) u(a, s); they add up to EU(a) (MODEL.md §3). */
export function contributions(nm: NormalizedModel, altId: Id): Map<Id, number> {
	return new Map(
		alternativeOf(nm, altId).states.map((s) => [s.id, s.probability * utilityOf(nm, s)])
	);
}

export interface RankEntry {
	altId: Id;
	eu: number;
}

/**
 * Alternatives by descending EU. Two alternatives within EPS are tied (MODEL.md §3)
 * and keep their input order.
 */
export function rank(nm: NormalizedModel): RankEntry[] {
	return nm.alternatives
		.map((a) => ({ altId: a.id, eu: expectedUtility(nm, a.id) }))
		.sort((x, y) => (Math.abs(x.eu - y.eu) < EPS ? 0 : y.eu - x.eu));
}
