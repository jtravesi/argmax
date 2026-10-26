// Data model (ARCHITECTURE.md §4) and core types. Notation follows MODEL.md.

/** Tolerance for ties and comparisons with zero (MODEL.md §3). */
export const EPS = 1e-9;

/** Raw sums further than this from 1 trigger a warning (MODEL.md §7). */
export const SUM_TOLERANCE = 0.005;

export type Id = string;

export interface DecisionModel {
	schemaVersion: 1;
	title: string;
	description?: string;
	horizon?: string;
	dimensions: Dimension[];
	alternatives: Alternative[];
}

export interface Dimension {
	id: Id;
	name: string;
	/** Raw weight w̃_d ≥ 0, normalized on use. */
	weight: number;
}

export interface Alternative {
	id: Id;
	name: string;
	states: State[];
}

export interface State {
	id: Id;
	name: string;
	/** Raw probability ≥ 0, normalized per alternative on use. */
	probability: number;
	/** x_{a,s,d} ∈ [0, 10], one entry per dimension id. */
	scores: Record<Id, number>;
}

/**
 * A problem found in a model. `code` is stable and translated by the UI;
 * `path` points into the model (e.g. ["alternatives", 0, "states", 1, "probability"]).
 */
export interface Issue {
	code: IssueCode;
	path: (string | number)[];
	params?: Record<string, string | number>;
}

export type IssueCode =
	// MODEL.md §7, errors
	| 'too-few-alternatives'
	| 'no-dimensions'
	| 'no-states'
	| 'weight-invalid'
	| 'weights-sum-zero'
	| 'probability-invalid'
	| 'probabilities-sum-zero'
	| 'score-out-of-range'
	| 'scores-mismatch'
	// MODEL.md §7, warnings
	| 'weights-not-normalized'
	| 'probabilities-not-normalized'
	| 'single-state'
	| 'zero-weight'
	// Schema (ARCHITECTURE.md §4 and §7)
	| 'invalid-json'
	| 'unsupported-version'
	| 'forbidden-key'
	| 'duplicate-id'
	| 'invalid-type'
	| 'too-small'
	| 'too-big'
	| 'unrecognized-key'
	| 'invalid';

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** A state with its probability normalized: p_a(s). Scores are looked up by dimension id. */
export interface NormalizedState {
	readonly id: Id;
	readonly name: string;
	readonly probability: number;
	readonly scores: ReadonlyMap<Id, number>;
}

export interface NormalizedAlternative {
	readonly id: Id;
	readonly name: string;
	readonly states: readonly NormalizedState[];
}

/** Weights and probabilities on the simplex (MODEL.md §1). Input order is preserved. */
export interface NormalizedModel {
	readonly dimensionIds: readonly Id[];
	readonly weights: ReadonlyMap<Id, number>;
	readonly alternatives: readonly NormalizedAlternative[];
}
