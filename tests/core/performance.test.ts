// Performance budget (SPEC.md §7): recomputing results < 16 ms at the maximum size (§3.3).
import { describe, expect, it } from 'vitest';
import { analyze, LIMITS, type DecisionModel } from '../../src/lib/core';

function largest(): DecisionModel {
	const dimensions = Array.from({ length: LIMITS.dimensions.max }, (_, k) => ({
		id: `d${k}`,
		name: `Dimension ${k}`,
		weight: k + 1
	}));
	return {
		schemaVersion: 1,
		title: 'Largest model',
		dimensions,
		alternatives: Array.from({ length: LIMITS.alternatives.max }, (_, a) => ({
			id: `a${a}`,
			name: `Alternative ${a}`,
			states: Array.from({ length: LIMITS.states.max }, (_, s) => ({
				id: `s${s}`,
				name: `State ${s}`,
				probability: s + 1,
				scores: Object.fromEntries(dimensions.map((d, k) => [d.id, (a * 7 + s * 3 + k) % 11]))
			}))
		}))
	};
}

describe('performance', () => {
	it('analyze() of the largest model takes under 16 ms (median of 25 runs)', () => {
		const model = largest();
		for (let i = 0; i < 5; i++) analyze(model); // warm up
		const times: number[] = [];
		for (let i = 0; i < 25; i++) {
			const start = performance.now();
			analyze(model);
			times.push(performance.now() - start);
		}
		times.sort((x, y) => x - y);
		expect(times[Math.floor(times.length / 2)]).toBeLessThan(16);
	});
});
