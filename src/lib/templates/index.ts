// Templates shipped with the app (SPEC.md §5). They go through parseModel like any input.
import { parseModel, type DecisionModel } from '#lib/core/index.js';
import career from '../../../fixtures/career-decision.json';

function load(data: unknown, name: string): DecisionModel {
	const result = parseModel(data);
	if (!result.ok) throw new Error(`Template "${name}" is not a valid model`);
	return result.value;
}

const CAREER = load(career, 'career');

/** A fresh copy each time, so editing it never changes the template. */
export const careerTemplate = (): DecisionModel => structuredClone(CAREER);
