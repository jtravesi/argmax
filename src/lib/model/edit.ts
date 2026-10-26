// Editing operations used by the wizard. They mutate the model in place, which is
// what Svelte's $state proxies expect; they never touch the browser.
import { LIMITS, type DecisionModel, type Id } from '#lib/core/index.js';

/** Score given to a new cell: 5 is neutral on the 0–10 scale (SPEC.md §3.1, step 5). */
export const DEFAULT_SCORE = 5;

/** The model a new session starts with: two unnamed alternatives and nothing else. */
export function blankModel(): DecisionModel {
	return {
		schemaVersion: 1,
		title: '',
		dimensions: [],
		alternatives: [
			{ id: 'a1', name: '', states: [] },
			{ id: 'a2', name: '', states: [] }
		]
	};
}

/** The first `${prefix}${n}` not used by `items`. */
export function nextId(prefix: string, items: readonly { id: Id }[]): Id {
	const used = new Set(items.map((i) => i.id));
	let n = 1;
	while (used.has(`${prefix}${n}`)) n++;
	return `${prefix}${n}`;
}

export const canAddDimension = (m: DecisionModel) => m.dimensions.length < LIMITS.dimensions.max;
export const canAddAlternative = (m: DecisionModel) =>
	m.alternatives.length < LIMITS.alternatives.max;
export const canRemoveAlternative = (m: DecisionModel) =>
	m.alternatives.length > LIMITS.alternatives.min;
export const canAddState = (m: DecisionModel, altId: Id) =>
	(m.alternatives.find((a) => a.id === altId)?.states.length ?? Infinity) < LIMITS.states.max;

/** Adds a dimension with weight 0 and a neutral score in every state. */
export function addDimension(m: DecisionModel, name = ''): Id | null {
	if (!canAddDimension(m)) return null;
	const id = nextId('d', m.dimensions);
	m.dimensions.push({ id, name, weight: 0 });
	for (const alt of m.alternatives) for (const s of alt.states) s.scores[id] = DEFAULT_SCORE;
	return id;
}

/** Removes a dimension and its score from every state. */
export function removeDimension(m: DecisionModel, dimId: Id): void {
	m.dimensions = m.dimensions.filter((d) => d.id !== dimId);
	for (const alt of m.alternatives) {
		for (const s of alt.states) {
			s.scores = Object.fromEntries(Object.entries(s.scores).filter(([k]) => k !== dimId));
		}
	}
}

export function addAlternative(m: DecisionModel): Id | null {
	if (!canAddAlternative(m)) return null;
	const id = nextId('a', m.alternatives);
	m.alternatives.push({ id, name: '', states: [] });
	return id;
}

export function removeAlternative(m: DecisionModel, altId: Id): void {
	if (!canRemoveAlternative(m)) return;
	m.alternatives = m.alternatives.filter((a) => a.id !== altId);
}

/** Adds a state with probability 0 and a neutral score on every dimension. */
export function addState(m: DecisionModel, altId: Id): Id | null {
	const alt = m.alternatives.find((a) => a.id === altId);
	if (!alt || !canAddState(m, altId)) return null;
	const id = nextId('s', alt.states);
	alt.states.push({
		id,
		name: '',
		probability: 0,
		scores: Object.fromEntries(m.dimensions.map((d) => [d.id, DEFAULT_SCORE]))
	});
	return id;
}

export function removeState(m: DecisionModel, altId: Id, stateId: Id): void {
	const alt = m.alternatives.find((a) => a.id === altId);
	if (alt) alt.states = alt.states.filter((s) => s.id !== stateId);
}

/** Sum of raw values, or null if any of them is not a number ≥ 0. */
export function rawSum(values: readonly number[]): number | null {
	let total = 0;
	for (const v of values) {
		if (!(Number.isFinite(v) && v >= 0)) return null;
		total += v;
	}
	return total;
}

/** Rescales the raw weights so that they add up to 1 (MODEL.md §1). No-op if impossible. */
export function normalizeWeights(m: DecisionModel): void {
	const total = rawSum(m.dimensions.map((d) => d.weight));
	if (!total) return;
	for (const d of m.dimensions) d.weight /= total;
}

/** Rescales the raw probabilities of one alternative so that they add up to 1. */
export function normalizeProbabilities(m: DecisionModel, altId: Id): void {
	const alt = m.alternatives.find((a) => a.id === altId);
	if (!alt) return;
	const total = rawSum(alt.states.map((s) => s.probability));
	if (!total) return;
	for (const s of alt.states) s.probability /= total;
}
