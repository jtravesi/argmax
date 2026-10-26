import { EPS, SUM_TOLERANCE, type DecisionModel, type Issue } from './types';

const isNonNegative = (x: number) => Number.isFinite(x) && x >= 0;

/**
 * Input validation, MODEL.md §7. With errors nothing is computed; with warnings
 * the normalized values are used. The model may be half-edited, so every number
 * is checked even if the schema would already have rejected it.
 */
export function validate(model: DecisionModel): { errors: Issue[]; warnings: Issue[] } {
	const errors: Issue[] = [];
	const warnings: Issue[] = [];
	const dimensionIds = model.dimensions.map((d) => d.id);

	if (model.alternatives.length < 2) {
		errors.push({ code: 'too-few-alternatives', path: ['alternatives'] });
	}
	if (model.dimensions.length === 0) {
		errors.push({ code: 'no-dimensions', path: ['dimensions'] });
	}

	// Weights: w̃_d ≥ 0 and Σ w̃_d > 0.
	let weightsOk = true;
	model.dimensions.forEach((d, i) => {
		if (!isNonNegative(d.weight)) {
			weightsOk = false;
			errors.push({ code: 'weight-invalid', path: ['dimensions', i, 'weight'] });
		}
	});
	if (weightsOk) {
		const sum = model.dimensions.reduce((acc, d) => acc + d.weight, 0);
		if (sum < EPS) {
			errors.push({ code: 'weights-sum-zero', path: ['dimensions'] });
		} else {
			if (Math.abs(sum - 1) > SUM_TOLERANCE) {
				warnings.push({ code: 'weights-not-normalized', path: ['dimensions'], params: { sum } });
			}
			model.dimensions.forEach((d, i) => {
				if (d.weight < EPS) warnings.push({ code: 'zero-weight', path: ['dimensions', i] });
			});
		}
	}

	model.alternatives.forEach((alt, a) => {
		if (alt.states.length === 0) {
			errors.push({ code: 'no-states', path: ['alternatives', a] });
			return;
		}

		// Probabilities: p_a(s) ≥ 0 and Σ_s p_a(s) > 0.
		let probabilitiesOk = true;
		alt.states.forEach((s, j) => {
			if (!isNonNegative(s.probability)) {
				probabilitiesOk = false;
				errors.push({
					code: 'probability-invalid',
					path: ['alternatives', a, 'states', j, 'probability']
				});
			}
		});
		if (probabilitiesOk) {
			const sum = alt.states.reduce((acc, s) => acc + s.probability, 0);
			if (sum < EPS) {
				errors.push({ code: 'probabilities-sum-zero', path: ['alternatives', a] });
			} else if (Math.abs(sum - 1) > SUM_TOLERANCE) {
				warnings.push({
					code: 'probabilities-not-normalized',
					path: ['alternatives', a],
					params: { sum }
				});
			}
		}
		if (alt.states.length === 1) {
			warnings.push({ code: 'single-state', path: ['alternatives', a] });
		}

		// Scores: exactly one per dimension, each in [0, 10].
		alt.states.forEach((s, j) => {
			const keys = Object.keys(s.scores);
			if (keys.length !== dimensionIds.length || !dimensionIds.every((id) => keys.includes(id))) {
				errors.push({ code: 'scores-mismatch', path: ['alternatives', a, 'states', j, 'scores'] });
			}
			for (const id of dimensionIds) {
				if (!Object.hasOwn(s.scores, id)) continue;
				const x = s.scores[id];
				if (!(Number.isFinite(x) && x >= 0 && x <= 10)) {
					errors.push({
						code: 'score-out-of-range',
						path: ['alternatives', a, 'states', j, 'scores', id]
					});
				}
			}
		});
	});

	return { errors, warnings };
}
