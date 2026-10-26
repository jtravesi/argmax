// Pure core: no Svelte, DOM, window or localStorage (CLAUDE.md, rule 2).
export * from './types';
export { parseModel, serialize, deserialize, CURRENT_SCHEMA_VERSION, LIMITS } from './schema';
export { validate } from './validate';
export { normalize } from './normalize';
export {
	stateUtility,
	stateUtilities,
	expectedProfile,
	expectedUtility,
	contributions,
	liveStateUtility,
	rank,
	type RankEntry
} from './utility';
export { riskProfile, type RiskProfile } from './risk';
export {
	withDimensionWeight,
	withStateProbability,
	tippingWeight,
	tippingProbability,
	scoreThreshold,
	tornado,
	type Parameter,
	type TornadoBar
} from './sensitivity';
export { dominance, type Dominance } from './dominance';
export {
	analyze,
	robustness,
	type Analysis,
	type AnalysisOptions,
	type AnalysisResult,
	type AlternativeAnalysis,
	type StateAnalysis,
	type Robustness
} from './analyze';
