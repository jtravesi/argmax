import { EPS, type Id, type NormalizedModel } from './types';
import { expectedProfile } from './utility';

export interface Dominance {
	dominant: Id;
	dominated: Id;
}

/**
 * MODEL.md §6: a dominates b when x̄_{a,d} ≥ x̄_{b,d} for every d, strictly for at
 * least one. Then EU(a) ≥ EU(b) whatever the weights. Pairs in input order.
 */
export function dominance(nm: NormalizedModel): Dominance[] {
	const profiles = new Map(nm.alternatives.map((a) => [a.id, expectedProfile(nm, a.id)]));
	const result: Dominance[] = [];
	for (const a of nm.alternatives) {
		for (const b of nm.alternatives) {
			if (a === b) continue;
			const xa = profiles.get(a.id) as Map<Id, number>;
			const xb = profiles.get(b.id) as Map<Id, number>;
			let weaklyBetter = true;
			let strictlyBetter = false;
			for (const d of nm.dimensionIds) {
				const diff = (xa.get(d) as number) - (xb.get(d) as number);
				if (diff < -EPS) weaklyBetter = false;
				if (diff > EPS) strictlyBetter = true;
			}
			if (weaklyBetter && strictlyBetter) result.push({ dominant: a.id, dominated: b.id });
		}
	}
	return result;
}
