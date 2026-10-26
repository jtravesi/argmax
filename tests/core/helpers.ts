import { readFileSync } from 'node:fs';
import type { DecisionModel } from '../../src/lib/core/types';

const root = new URL('../../', import.meta.url);

export function readFixture<T = unknown>(name: string): T {
	return JSON.parse(readFileSync(new URL(`fixtures/${name}`, root), 'utf8')) as T;
}

export const career = (): DecisionModel => readFixture<DecisionModel>('career-decision.json');

/** A small valid model: two alternatives, two dimensions. Each call returns a fresh copy. */
export function tiny(): DecisionModel {
	return {
		schemaVersion: 1,
		title: 'Tiny',
		dimensions: [
			{ id: 'd1', name: 'Money', weight: 0.5 },
			{ id: 'd2', name: 'Fun', weight: 0.5 }
		],
		alternatives: [
			{
				id: 'a1',
				name: 'A',
				states: [
					{ id: 's1', name: 'Good', probability: 0.5, scores: { d1: 8, d2: 6 } },
					{ id: 's2', name: 'Bad', probability: 0.5, scores: { d1: 2, d2: 4 } }
				]
			},
			{
				id: 'a2',
				name: 'B',
				states: [
					{ id: 's1', name: 'Good', probability: 0.25, scores: { d1: 6, d2: 10 } },
					{ id: 's2', name: 'Bad', probability: 0.75, scores: { d1: 3, d2: 3 } }
				]
			}
		]
	};
}
