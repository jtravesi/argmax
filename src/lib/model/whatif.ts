// "What if" exploration (SPEC.md §3.2, item 6): moves applied to a copy of the
// normalized model, never to the saved one.
import {
	EPS,
	withDimensionWeight,
	withStateProbability,
	type Id,
	type NormalizedModel
} from '#lib/core/index.js';

/**
 * Sets w_k = t on the current what-if model, rescaling the other weights
 * proportionally (MODEL.md §5.1). If w_k is already 1 there are no proportions
 * left to rescale, so the baseline's are used. Null if neither is defined.
 */
export function moveWeight(
	current: NormalizedModel,
	base: NormalizedModel,
	dimId: Id,
	t: number
): NormalizedModel | null {
	const moved = withDimensionWeight(current, dimId, t);
	if (moved) return moved;
	const fromBase = withDimensionWeight(base, dimId, t);
	// Keep the probabilities the user may already have moved.
	return fromBase && { ...current, weights: fromBase.weights };
}

/** Same as moveWeight for p_a(j) (MODEL.md §5.2). */
export function moveProbability(
	current: NormalizedModel,
	base: NormalizedModel,
	altId: Id,
	stateId: Id,
	q: number
): NormalizedModel | null {
	const moved = withStateProbability(current, altId, stateId, q);
	if (moved) return moved;
	const fromBase = withStateProbability(base, altId, stateId, q);
	if (!fromBase) return null;
	const alt = fromBase.alternatives.find((a) => a.id === altId);
	return {
		...current,
		alternatives: current.alternatives.map((a) => (a.id === altId && alt ? alt : a))
	};
}

/** Whether a tipping point lies above or below the current value of its parameter. */
export function sideOf(current: number, tipping: number): 'above' | 'below' | 'at' {
	if (Math.abs(tipping - current) < EPS) return 'at';
	return tipping > current ? 'above' : 'below';
}
