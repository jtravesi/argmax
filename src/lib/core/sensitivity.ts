import { alternativeOf, stateOf, weightOf } from './normalize';
import { EPS, type Id, type NormalizedModel } from './types';
import { expectedProfile, expectedUtility, rank, stateUtilities } from './utility';

function assertUnit(name: string, x: number): void {
	if (!(x >= 0 && x <= 1)) throw new RangeError(`${name} must be in [0, 1], got ${x}`);
}

/**
 * A tipping point must lie in [0, 1] (MODEL.md §5.1, §5.2). No tolerance and no
 * clamping: a root just outside the interval is no reversal inside it, and a
 * clamped value would no longer be a tie.
 */
const inUnit = (x: number): number | null => (x >= 0 && x <= 1 ? x : null);

/**
 * MODEL.md §5.1: set w_k = t and rescale the other weights proportionally,
 * w_d(t) = (1 − t) w_d / (1 − w_k). Null when w_k = 1 (nothing to rescale).
 */
export function withDimensionWeight(
	nm: NormalizedModel,
	dimId: Id,
	t: number
): NormalizedModel | null {
	assertUnit('t', t);
	const wk = weightOf(nm, dimId);
	if (wk >= 1 - EPS) return null;
	const weights = new Map(
		[...nm.weights].map(([d, w]) => [d, d === dimId ? t : ((1 - t) * w) / (1 - wk)])
	);
	return { ...nm, weights };
}

/**
 * MODEL.md §5.2: set p_a(j) = q and rescale the other states of a,
 * p_a(s) = (1 − q) p_a(s) / (1 − p_a(j)). Null when p_a(j) = 1.
 */
export function withStateProbability(
	nm: NormalizedModel,
	altId: Id,
	stateId: Id,
	q: number
): NormalizedModel | null {
	assertUnit('q', q);
	const pj = stateOf(alternativeOf(nm, altId), stateId).probability;
	if (pj >= 1 - EPS) return null;
	const alternatives = nm.alternatives.map((alt) =>
		alt.id !== altId
			? alt
			: {
					...alt,
					states: alt.states.map((s) => ({
						...s,
						probability: s.id === stateId ? q : ((1 - q) * s.probability) / (1 - pj)
					}))
				}
	);
	return { ...nm, alternatives };
}

/**
 * MODEL.md §5.1: the weight t* of dimension k at which EU_a(t) = EU_b(t),
 * t* = (R_a − R_b) / ((R_a − R_b) − (x̄_{a,k} − x̄_{b,k})),
 * with R_{a,k} = Σ_{d≠k} w_d x̄_{a,d} / (1 − w_k).
 * Null when w_k = 1, the denominator is zero, or t* ∉ [0, 1].
 */
export function tippingWeight(nm: NormalizedModel, dimId: Id, a: Id, b: Id): number | null {
	if (a === b) throw new Error('tippingWeight needs two different alternatives');
	const wk = weightOf(nm, dimId);
	if (wk >= 1 - EPS) return null;
	const xa = expectedProfile(nm, a);
	const xb = expectedProfile(nm, b);

	const rest = (x: Map<Id, number>) => {
		let r = 0;
		for (const [d, w] of nm.weights) if (d !== dimId) r += w * (x.get(d) as number);
		return r / (1 - wk);
	};

	const dr = rest(xa) - rest(xb);
	const dx = (xa.get(dimId) as number) - (xb.get(dimId) as number);
	const den = dr - dx;
	if (Math.abs(den) < EPS) return null;
	return inUnit(dr / den);
}

/**
 * MODEL.md §5.2: the probability q* of state j of alternative a at which EU(a) = EU(b),
 * q* = (EU(b) − M_{a,j}) / (u(a, j) − M_{a,j}),
 * with M_{a,j} = Σ_{s≠j} p_a(s) u(a, s) / (1 − p_a(j)).
 * Null when p_a(j) = 1, u(a, j) = M_{a,j}, or q* ∉ [0, 1].
 */
export function tippingProbability(
	nm: NormalizedModel,
	altId: Id,
	stateId: Id,
	b: Id
): number | null {
	if (altId === b) throw new Error('tippingProbability needs two different alternatives');
	const alt = alternativeOf(nm, altId);
	const pj = stateOf(alt, stateId).probability;
	if (pj >= 1 - EPS) return null;
	const u = stateUtilities(nm, altId);

	let m = 0;
	for (const s of alt.states) if (s.id !== stateId) m += s.probability * (u.get(s.id) as number);
	m /= 1 - pj;

	const den = (u.get(stateId) as number) - m;
	if (Math.abs(den) < EPS) return null;
	return inUnit((expectedUtility(nm, b) - m) / den);
}

/**
 * MODEL.md §5.3: the score x_{a,s,d} + δ at which EU(a) = EU(b), with
 * δ = (EU(b) − EU(a)) / (p_a(s) w_d). Null when p_a(s) w_d = 0 or the score
 * would leave [0, 10].
 */
export function scoreThreshold(
	nm: NormalizedModel,
	altId: Id,
	stateId: Id,
	dimId: Id,
	b: Id
): number | null {
	if (altId === b) throw new Error('scoreThreshold needs two different alternatives');
	const state = stateOf(alternativeOf(nm, altId), stateId);
	const slope = state.probability * weightOf(nm, dimId);
	if (slope < EPS) return null;
	const delta = (expectedUtility(nm, b) - expectedUtility(nm, altId)) / slope;
	const x = (state.scores.get(dimId) as number) + delta;
	return x >= 0 && x <= 10 ? x : null;
}

export type Parameter =
	{ kind: 'weight'; dimId: Id } | { kind: 'probability'; altId: Id; stateId: Id };

export interface TornadoBar {
	parameter: Parameter;
	/** Baseline value θ. */
	base: number;
	/** Explored interval [max(0, θ − h), min(1, θ + h)]. */
	low: number;
	high: number;
	/** G = EU(a₍₁₎) − EU(a₍₂₎) at each end of the interval. */
	gapAtLow: number;
	gapAtHigh: number;
	min: number;
	max: number;
	/** First alternative of the full ranking recomputed at each end. */
	winnerAtLow: Id;
	winnerAtHigh: Id;
}

/**
 * MODEL.md §5.4: tornado diagram for the gap G between the first two alternatives
 * of the baseline ranking. G is affine in each parameter, so the ends of the
 * interval suffice. Parameters whose rescaling is undefined (w_k = 1 or p_a(j) = 1)
 * are left out. Bars are sorted by length, longest first.
 */
export function tornado(nm: NormalizedModel, h = 0.1): TornadoBar[] {
	if (!(h > 0 && h <= 1)) throw new RangeError(`h must be in (0, 1], got ${h}`);
	const [first, second] = rank(nm);
	const gap = (m: NormalizedModel) =>
		expectedUtility(m, first.altId) - expectedUtility(m, second.altId);

	const bars: TornadoBar[] = [];
	const explore = (
		parameter: Parameter,
		base: number,
		at: (value: number) => NormalizedModel | null
	) => {
		const low = Math.max(0, base - h);
		const high = Math.min(1, base + h);
		const mLow = at(low);
		const mHigh = at(high);
		if (!mLow || !mHigh) return;
		const gapAtLow = gap(mLow);
		const gapAtHigh = gap(mHigh);
		bars.push({
			parameter,
			base,
			low,
			high,
			gapAtLow,
			gapAtHigh,
			min: Math.min(gapAtLow, gapAtHigh),
			max: Math.max(gapAtLow, gapAtHigh),
			winnerAtLow: rank(mLow)[0].altId,
			winnerAtHigh: rank(mHigh)[0].altId
		});
	};

	for (const [dimId, w] of nm.weights) {
		explore({ kind: 'weight', dimId }, w, (t) => withDimensionWeight(nm, dimId, t));
	}
	for (const alt of nm.alternatives) {
		for (const s of alt.states) {
			explore({ kind: 'probability', altId: alt.id, stateId: s.id }, s.probability, (q) =>
				withStateProbability(nm, alt.id, s.id, q)
			);
		}
	}

	// Array.prototype.sort is stable: equal lengths keep the order above.
	return bars.sort((x, y) => y.max - y.min - (x.max - x.min));
}
