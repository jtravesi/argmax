import { describe, expect, it } from 'vitest';
import { parseModel, validate } from '../../src/lib/core';
import {
	addAlternative,
	addDimension,
	addState,
	blankModel,
	canAddState,
	nextId,
	normalizeProbabilities,
	normalizeWeights,
	rawSum,
	removeAlternative,
	removeDimension,
	removeState
} from '../../src/lib/model/edit';
import { tiny } from '../core/helpers';

describe('model editing', () => {
	it('starts blank with two unnamed alternatives', () => {
		const m = blankModel();
		expect(m.alternatives.map((a) => a.name)).toEqual(['', '']);
		expect(parseModel(m).ok).toBe(false);
	});

	it('nextId picks the first free number', () => {
		expect(nextId('d', [])).toBe('d1');
		expect(nextId('d', [{ id: 'd1' }, { id: 'd3' }])).toBe('d2');
	});

	it('adding a dimension adds a neutral score to every state', () => {
		const m = tiny();
		const id = addDimension(m, 'Health');
		expect(id).toBe('d3');
		expect(m.dimensions[2]).toEqual({ id: 'd3', name: 'Health', weight: 0 });
		for (const alt of m.alternatives) for (const s of alt.states) expect(s.scores.d3).toBe(5);
		expect(validate(m).errors).toEqual([]);
	});

	it('removing a dimension removes its scores', () => {
		const m = tiny();
		removeDimension(m, 'd1');
		expect(m.dimensions.map((d) => d.id)).toEqual(['d2']);
		for (const alt of m.alternatives)
			for (const s of alt.states) expect(Object.keys(s.scores)).toEqual(['d2']);
	});

	it('respects the limits on dimensions, alternatives and states', () => {
		const m = blankModel();
		for (let i = 0; i < 10; i++) expect(addDimension(m)).not.toBeNull();
		expect(addDimension(m)).toBeNull();
		for (let i = 0; i < 6; i++) expect(addAlternative(m)).not.toBeNull();
		expect(addAlternative(m)).toBeNull();
		for (let i = 0; i < 8; i++) expect(addState(m, 'a1')).not.toBeNull();
		expect(addState(m, 'a1')).toBeNull();
		expect(canAddState(m, 'nope')).toBe(false);
		expect(addState(m, 'nope')).toBeNull();
	});

	it('keeps at least two alternatives', () => {
		const m = blankModel();
		removeAlternative(m, 'a1');
		expect(m.alternatives).toHaveLength(2);
		addAlternative(m);
		removeAlternative(m, 'a1');
		expect(m.alternatives.map((a) => a.id)).toEqual(['a2', 'a3']);
	});

	it('adds and removes states with a neutral score per dimension', () => {
		const m = tiny();
		const id = addState(m, 'a1') as string;
		expect(m.alternatives[0].states[2]).toEqual({
			id,
			name: '',
			probability: 0,
			scores: { d1: 5, d2: 5 }
		});
		removeState(m, 'a1', id);
		removeState(m, 'nope', id);
		expect(m.alternatives[0].states).toHaveLength(2);
	});

	it('normalizes weights and probabilities to add up to 1', () => {
		const m = tiny();
		m.dimensions[0].weight = 30;
		m.dimensions[1].weight = 10;
		normalizeWeights(m);
		expect(m.dimensions.map((d) => d.weight)).toEqual([0.75, 0.25]);
		m.alternatives[1].states[0].probability = 1;
		m.alternatives[1].states[1].probability = 1;
		normalizeProbabilities(m, 'a2');
		expect(m.alternatives[1].states.map((s) => s.probability)).toEqual([0.5, 0.5]);
	});

	it('does not normalize what cannot be normalized', () => {
		const m = tiny();
		m.dimensions.forEach((d) => (d.weight = 0));
		normalizeWeights(m);
		expect(m.dimensions.map((d) => d.weight)).toEqual([0, 0]);
		m.alternatives[0].states[0].probability = Number.NaN;
		normalizeProbabilities(m, 'a1');
		expect(m.alternatives[0].states[1].probability).toBe(0.5);
		normalizeProbabilities(m, 'nope');
		expect(rawSum([1, -1])).toBeNull();
		expect(rawSum([0.25, 0.5])).toBe(0.75);
	});
});
