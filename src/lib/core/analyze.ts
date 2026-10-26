import { dominance, type Dominance } from './dominance';
import { normalize } from './normalize';
import { riskProfile, type RiskProfile } from './risk';
import { tippingProbability, tippingWeight, tornado, type TornadoBar } from './sensitivity';
import type { DecisionModel, Id, Issue, NormalizedModel } from './types';
import { contributions, expectedProfile, rank, stateUtilities, type RankEntry } from './utility';
import { validate } from './validate';

/** Robustness label of the verdict (SPEC.md §3.2): gap > 1.0, > 0.3, otherwise. */
export type Robustness = 'clear' | 'moderate' | 'close';

export function robustness(gap: number): Robustness {
	if (gap > 1) return 'clear';
	if (gap > 0.3) return 'moderate';
	return 'close';
}

export interface StateAnalysis {
	id: Id;
	name: string;
	probability: number;
	utility: number;
	contribution: number;
}

export interface AlternativeAnalysis {
	id: Id;
	name: string;
	eu: number;
	states: StateAnalysis[];
	risk: RiskProfile;
	profile: Map<Id, number>;
}

export interface AnalysisOptions {
	/** Threshold τ for P_τ (MODEL.md §4). */
	tau?: number;
	/** Half-width h of the tornado intervals (MODEL.md §5.4). */
	h?: number;
}

export interface Analysis {
	ok: true;
	warnings: Issue[];
	model: NormalizedModel;
	/** Input order. */
	alternatives: AlternativeAnalysis[];
	ranking: RankEntry[];
	verdict: { winner: Id; runnerUp: Id; eu: number; gap: number; robustness: Robustness };
	dominance: Dominance[];
	/** For each dimension, the weight at which the runner-up overtakes the winner (§5.1). */
	tippingWeights: { dimId: Id; weight: number | null }[];
	/** For each state of the top two, the probability at which they tie (§5.2). */
	tippingProbabilities: { altId: Id; stateId: Id; against: Id; probability: number | null }[];
	tornado: TornadoBar[];
}

export type AnalysisResult = Analysis | { ok: false; errors: Issue[]; warnings: Issue[] };

/** Everything the results page shows (SPEC.md §3.2), derived from the model in one call. */
export function analyze(model: DecisionModel, options: AnalysisOptions = {}): AnalysisResult {
	const { errors, warnings } = validate(model);
	const nm = normalize(model);
	if (!nm) return { ok: false, errors, warnings };
	const { tau = 5, h = 0.1 } = options;

	const ranking = rank(nm);
	const [first, second] = ranking;

	const alternatives = nm.alternatives.map((alt): AlternativeAnalysis => {
		const u = stateUtilities(nm, alt.id);
		const c = contributions(nm, alt.id);
		return {
			id: alt.id,
			name: alt.name,
			eu: (ranking.find((r) => r.altId === alt.id) as RankEntry).eu,
			states: alt.states.map((s) => ({
				id: s.id,
				name: s.name,
				probability: s.probability,
				utility: u.get(s.id) as number,
				contribution: c.get(s.id) as number
			})),
			risk: riskProfile(nm, alt.id, tau),
			profile: expectedProfile(nm, alt.id)
		};
	});

	const gap = first.eu - second.eu;
	const statesOf = (altId: Id) =>
		(nm.alternatives.find((a) => a.id === altId) as NormalizedModel['alternatives'][number]).states;

	return {
		ok: true,
		warnings,
		model: nm,
		alternatives,
		ranking,
		verdict: {
			winner: first.altId,
			runnerUp: second.altId,
			eu: first.eu,
			gap,
			robustness: robustness(gap)
		},
		dominance: dominance(nm),
		tippingWeights: nm.dimensionIds.map((dimId) => ({
			dimId,
			weight: tippingWeight(nm, dimId, first.altId, second.altId)
		})),
		tippingProbabilities: [
			[first.altId, second.altId],
			[second.altId, first.altId]
		].flatMap(([altId, against]) =>
			statesOf(altId).map((s) => ({
				altId,
				stateId: s.id,
				against,
				probability: tippingProbability(nm, altId, s.id, against)
			}))
		),
		tornado: tornado(nm, h)
	};
}
