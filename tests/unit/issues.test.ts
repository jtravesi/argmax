import { describe, expect, it } from 'vitest';
import { parseModel, validate, type DecisionModel, type Issue } from '../../src/lib/core';
import { describeIssue, labelsOf } from '../../src/lib/i18n/issues';
import { blankModel } from '../../src/lib/model/edit';
import { collectIssues, stepOf } from '../../src/lib/model/issues';
import { tiny } from '../core/helpers';

const issue = (code: Issue['code'], path: Issue['path'], params?: Issue['params']): Issue => ({
	code,
	path,
	params
});

describe('stepOf', () => {
	it.each([
		[issue('too-small', ['title']), 'decision'],
		[issue('too-big', ['horizon']), 'decision'],
		[issue('weight-invalid', ['dimensions', 0, 'weight']), 'dimensions'],
		[issue('no-dimensions', ['dimensions']), 'dimensions'],
		[issue('too-few-alternatives', ['alternatives']), 'alternatives'],
		[issue('too-small', ['alternatives', 1, 'name']), 'alternatives'],
		[issue('no-states', ['alternatives', 1]), 'states'],
		[issue('single-state', ['alternatives', 1]), 'states'],
		[issue('probabilities-sum-zero', ['alternatives', 0]), 'states'],
		[issue('too-small', ['alternatives', 0, 'states']), 'states'],
		[issue('probability-invalid', ['alternatives', 0, 'states', 1, 'probability']), 'states'],
		[issue('score-out-of-range', ['alternatives', 0, 'states', 1, 'scores', 'd1']), 'scores'],
		[issue('invalid-type', []), 'decision']
	] as const)('%j → %s', (i, step) => {
		expect(stepOf(i)).toBe(step);
	});
});

describe('describeIssue', () => {
	const m: DecisionModel = tiny();
	m.alternatives[1].name = '';

	it('names fields after the model, quoting user names', () => {
		expect(labelsOf(['dimensions', 0, 'weight'], m).field).toBe('Weight of “Money”');
		expect(labelsOf(['alternatives', 0, 'states', 1, 'scores', 'd2'], m).field).toBe(
			'Score of “Bad” (“A”) on “Fun”'
		);
		expect(labelsOf(['alternatives', 1, 'states', 0, 'probability'], m).field).toBe(
			'Probability of “Good” (Alternative 2)'
		);
		expect(labelsOf(['alternatives', 0, 'states', 0, 'name'], m).field).toBe(
			'Name of “Good” of “A”'
		);
		expect(labelsOf(['alternatives', 0, 'states', 0], m).field).toBe('“Good” of “A”');
		expect(labelsOf(['alternatives', 0, 'states', 0, 'scores'], m).field).toBe(
			'Scores of “Good” (“A”)'
		);
		expect(labelsOf(['alternatives', 0, 'states'], m).field).toBe('States of “A”');
		expect(labelsOf(['alternatives', 0], m).field).toBe('“A”');
		expect(labelsOf(['alternatives'], m).field).toBe('Alternatives');
		expect(labelsOf(['dimensions', 5], m).field).toBe('Dimension 6');
		expect(labelsOf(['dimensions'], m).field).toBe('Dimensions');
		expect(labelsOf(['dimensions', 1, 'name'], m).field).toBe('Name of “Fun”');
		expect(labelsOf([], m).field).toBe('Model');
	});

	it('reads naturally for text, lists and numbers', () => {
		expect(describeIssue(issue('too-small', ['title'], { minimum: 1 }), m)).toBe(
			'Title is required.'
		);
		expect(describeIssue(issue('too-small', ['alternatives', 1, 'name'], { minimum: 1 }), m)).toBe(
			'Name of Alternative 2 is required.'
		);
		expect(describeIssue(issue('too-big', ['title'], { maximum: 120 }), m)).toBe(
			'Title is too long (up to 120 characters).'
		);
		expect(
			describeIssue(issue('too-small', ['alternatives', 0, 'states'], { minimum: 1 }), m)
		).toBe('States of “A”: at least 1.');
		expect(describeIssue(issue('too-big', ['dimensions'], { maximum: 10 }), m)).toBe(
			'Dimensions: at most 10.'
		);
		expect(describeIssue(issue('too-small', ['dimensions', 0, 'weight'], { minimum: 0 }), m)).toBe(
			'Weight of “Money” must be at least 0.'
		);
		expect(
			describeIssue(
				issue('too-big', ['alternatives', 0, 'states', 0, 'scores', 'd1'], { maximum: 10 }),
				m
			)
		).toBe('Score of “Good” (“A”) on “Money” must be at most 10.');
	});

	it('formats sums as percentages', () => {
		expect(describeIssue(issue('weights-not-normalized', ['dimensions'], { sum: 0.9 }), m)).toBe(
			'Weights add up to 90%; they are normalized to 100%.'
		);
		expect(
			describeIssue(issue('probabilities-not-normalized', ['alternatives', 0], { sum: 1.2 }), m)
		).toBe('“A”: probabilities add up to 120%; they are normalized to 100%.');
	});

	it('has a message for every issue code', () => {
		const codes: Issue['code'][] = [
			'too-few-alternatives',
			'no-dimensions',
			'no-states',
			'weight-invalid',
			'weights-sum-zero',
			'probability-invalid',
			'probabilities-sum-zero',
			'score-out-of-range',
			'scores-mismatch',
			'weights-not-normalized',
			'probabilities-not-normalized',
			'single-state',
			'zero-weight',
			'invalid-json',
			'unsupported-version',
			'forbidden-key',
			'duplicate-id',
			'invalid-type',
			'too-small',
			'too-big',
			'unrecognized-key',
			'invalid'
		];
		for (const code of codes) {
			const text = describeIssue(
				issue(code, ['alternatives', 0], { sum: 1, minimum: 2, maximum: 3 }),
				m
			);
			expect(text.length).toBeGreaterThan(5);
			expect(text).not.toMatch(/undefined|NaN/);
		}
	});
});

describe('collectIssues', () => {
	const run = (m: DecisionModel) => collectIssues(m, validate(m), parseModel(m));

	it('reports nothing for a valid model', () => {
		expect(run(tiny())).toEqual([]);
	});

	it('assigns the blank model issues to their steps', () => {
		const issues = run(blankModel());
		expect(issues.every((i) => i.severity === 'error')).toBe(true);
		expect(new Set(issues.map((i) => i.step))).toEqual(
			new Set(['decision', 'dimensions', 'alternatives', 'states'])
		);
	});

	it('keeps one error per field, preferring the validate message', () => {
		const m = tiny();
		m.dimensions[0].weight = -1;
		const issues = run(m);
		expect(issues).toEqual([
			{
				key: 'dimensions.0.weight',
				severity: 'error',
				step: 'dimensions',
				message: 'Weight of “Money” must be a number of at least 0.'
			}
		]);
	});

	it('lists warnings after errors', () => {
		const m = tiny();
		m.title = '';
		m.dimensions[0].weight = 0;
		expect(run(m).map((i) => [i.severity, i.key])).toEqual([
			['error', 'title'],
			['warning', 'dimensions'],
			['warning', 'dimensions.0']
		]);
	});
});
