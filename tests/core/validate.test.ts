import { describe, expect, it } from 'vitest';
import { validate } from '../../src/lib/core/validate';
import type { DecisionModel, IssueCode } from '../../src/lib/core/types';
import { career, tiny } from './helpers';

const codes = (issues: { code: IssueCode }[]) => issues.map((i) => i.code);

function edit(change: (m: DecisionModel) => void): DecisionModel {
	const m = tiny();
	change(m);
	return m;
}

describe('validate (MODEL.md §7)', () => {
	it('accepts the oracle model without errors or warnings', () => {
		expect(validate(career())).toEqual({ errors: [], warnings: [] });
	});

	describe('errors', () => {
		it('rejects a negative weight, with its path', () => {
			const { errors } = validate(edit((m) => (m.dimensions[1].weight = -0.1)));
			expect(errors).toEqual([{ code: 'weight-invalid', path: ['dimensions', 1, 'weight'] }]);
		});

		it('rejects a non-finite weight', () => {
			const { errors } = validate(edit((m) => (m.dimensions[0].weight = Number.NaN)));
			expect(codes(errors)).toContain('weight-invalid');
		});

		it('rejects weights whose sum is zero', () => {
			const { errors } = validate(edit((m) => m.dimensions.forEach((d) => (d.weight = 0))));
			expect(codes(errors)).toEqual(['weights-sum-zero']);
		});

		it('edge case: a single tiny positive weight is a valid sum', () => {
			const { errors } = validate(
				edit((m) => {
					m.dimensions[0].weight = 0;
					m.dimensions[1].weight = 1e-6;
				})
			);
			expect(errors).toEqual([]);
		});

		it('rejects a negative probability, with its path', () => {
			const { errors } = validate(edit((m) => (m.alternatives[1].states[0].probability = -1)));
			expect(errors).toEqual([
				{
					code: 'probability-invalid',
					path: ['alternatives', 1, 'states', 0, 'probability']
				}
			]);
		});

		it('rejects a non-finite probability', () => {
			const { errors } = validate(
				edit((m) => (m.alternatives[0].states[0].probability = Number.POSITIVE_INFINITY))
			);
			expect(codes(errors)).toContain('probability-invalid');
		});

		it('rejects probabilities whose sum is zero for an alternative', () => {
			const { errors } = validate(
				edit((m) => m.alternatives[0].states.forEach((s) => (s.probability = 0)))
			);
			expect(errors).toEqual([{ code: 'probabilities-sum-zero', path: ['alternatives', 0] }]);
		});

		it('rejects a score above 10 or below 0', () => {
			const { errors } = validate(
				edit((m) => {
					m.alternatives[0].states[0].scores.d1 = 10.5;
					m.alternatives[1].states[1].scores.d2 = -0.5;
				})
			);
			expect(errors).toEqual([
				{
					code: 'score-out-of-range',
					path: ['alternatives', 0, 'states', 0, 'scores', 'd1']
				},
				{
					code: 'score-out-of-range',
					path: ['alternatives', 1, 'states', 1, 'scores', 'd2']
				}
			]);
		});

		it('edge case: scores of exactly 0 and 10 are valid', () => {
			const { errors } = validate(
				edit((m) => {
					m.alternatives[0].states[0].scores.d1 = 0;
					m.alternatives[0].states[0].scores.d2 = 10;
				})
			);
			expect(errors).toEqual([]);
		});

		it('rejects a NaN score', () => {
			const { errors } = validate(
				edit((m) => (m.alternatives[0].states[0].scores.d1 = Number.NaN))
			);
			expect(codes(errors)).toEqual(['score-out-of-range']);
		});

		it('rejects scores that do not cover exactly the dimensions', () => {
			const { errors } = validate(
				edit((m) => {
					delete (m.alternatives[0].states[0].scores as Record<string, number>).d2;
					m.alternatives[1].states[0].scores.d9 = 5;
				})
			);
			expect(errors).toEqual([
				{ code: 'scores-mismatch', path: ['alternatives', 0, 'states', 0, 'scores'] },
				{ code: 'scores-mismatch', path: ['alternatives', 1, 'states', 0, 'scores'] }
			]);
		});

		it('requires at least 2 alternatives', () => {
			const { errors } = validate(edit((m) => m.alternatives.pop()));
			expect(errors).toEqual([{ code: 'too-few-alternatives', path: ['alternatives'] }]);
		});

		it('requires at least 1 dimension', () => {
			const { errors } = validate(
				edit((m) => {
					m.dimensions = [];
					m.alternatives.forEach((a) => a.states.forEach((s) => (s.scores = {})));
				})
			);
			expect(codes(errors)).toEqual(['no-dimensions', 'weights-sum-zero']);
		});

		it('requires each alternative to have at least 1 state', () => {
			const { errors } = validate(edit((m) => (m.alternatives[1].states = [])));
			expect(errors).toEqual([{ code: 'no-states', path: ['alternatives', 1] }]);
		});
	});

	describe('warnings', () => {
		it('warns when raw weights do not add up to 1', () => {
			const { errors, warnings } = validate(
				edit((m) => m.dimensions.forEach((d) => (d.weight = 50)))
			);
			expect(errors).toEqual([]);
			expect(warnings).toEqual([
				{ code: 'weights-not-normalized', path: ['dimensions'], params: { sum: 100 } }
			]);
		});

		it('edge case: weights within 0.005 of 1 do not warn', () => {
			const near = validate(edit((m) => (m.dimensions[0].weight = 0.504)));
			const far = validate(edit((m) => (m.dimensions[0].weight = 0.506)));
			expect(codes(near.warnings)).toEqual([]);
			expect(codes(far.warnings)).toEqual(['weights-not-normalized']);
		});

		it('warns when probabilities of an alternative do not add up to 1', () => {
			const { warnings } = validate(edit((m) => (m.alternatives[1].states[1].probability = 0.7)));
			expect(warnings).toEqual([
				{
					code: 'probabilities-not-normalized',
					path: ['alternatives', 1],
					params: { sum: 0.95 }
				}
			]);
		});

		it('edge case: probabilities within 0.005 of 1 do not warn', () => {
			const near = validate(edit((m) => (m.alternatives[0].states[0].probability = 0.504)));
			const far = validate(edit((m) => (m.alternatives[0].states[0].probability = 0.506)));
			expect(codes(near.warnings)).toEqual([]);
			expect(codes(far.warnings)).toEqual(['probabilities-not-normalized']);
		});

		it('warns about an alternative with a single state', () => {
			const { errors, warnings } = validate(
				edit((m) => {
					m.alternatives[0].states.pop();
					m.alternatives[0].states[0].probability = 1;
				})
			);
			expect(errors).toEqual([]);
			expect(warnings).toEqual([{ code: 'single-state', path: ['alternatives', 0] }]);
		});

		it('warns about a dimension with weight 0', () => {
			const { errors, warnings } = validate(
				edit((m) => {
					m.dimensions[0].weight = 0;
					m.dimensions[1].weight = 1;
				})
			);
			expect(errors).toEqual([]);
			expect(warnings).toEqual([{ code: 'zero-weight', path: ['dimensions', 0] }]);
		});
	});

	it('does not mutate its argument', () => {
		const m = edit((x) => (x.dimensions[0].weight = -1));
		const copy = structuredClone(m);
		validate(m);
		expect(m).toEqual(copy);
	});
});
