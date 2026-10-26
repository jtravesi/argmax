import type {
	DecisionModel,
	Id,
	NormalizedAlternative,
	NormalizedModel,
	NormalizedState
} from './types';
import { validate } from './validate';

const sum = (xs: number[]) => xs.reduce((acc, x) => acc + x, 0);

/**
 * Weights and probabilities on the simplex (MODEL.md §1):
 * w_d = w̃_d / Σ_e w̃_e and p_a(s) = p̃_a(s) / Σ_t p̃_a(t).
 * Returns null when the model has validation errors (MODEL.md §7).
 */
export function normalize(model: DecisionModel): NormalizedModel | null {
	if (validate(model).errors.length > 0) return null;

	const dimensionIds = model.dimensions.map((d) => d.id);
	const totalWeight = sum(model.dimensions.map((d) => d.weight));
	const weights = new Map(model.dimensions.map((d) => [d.id, d.weight / totalWeight]));

	const alternatives = model.alternatives.map((alt): NormalizedAlternative => {
		const totalProbability = sum(alt.states.map((s) => s.probability));
		return {
			id: alt.id,
			name: alt.name,
			states: alt.states.map((s): NormalizedState => ({
				id: s.id,
				name: s.name,
				probability: s.probability / totalProbability,
				scores: new Map(dimensionIds.map((id) => [id, s.scores[id]]))
			}))
		};
	});

	return { dimensionIds, weights, alternatives };
}

// Lookups by id. An unknown id is a programming error, not a degenerate case, so they throw.

export function alternativeOf(nm: NormalizedModel, altId: Id): NormalizedAlternative {
	const alt = nm.alternatives.find((a) => a.id === altId);
	if (!alt) throw new Error(`Unknown alternative "${altId}"`);
	return alt;
}

export function stateOf(alt: NormalizedAlternative, stateId: Id): NormalizedState {
	const state = alt.states.find((s) => s.id === stateId);
	if (!state) throw new Error(`Unknown state "${stateId}" in alternative "${alt.id}"`);
	return state;
}

export function weightOf(nm: NormalizedModel, dimId: Id): number {
	const w = nm.weights.get(dimId);
	if (w === undefined) throw new Error(`Unknown dimension "${dimId}"`);
	return w;
}
