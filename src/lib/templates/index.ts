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

export interface Template {
	id: string;
	title: string;
	description: string;
	create: () => DecisionModel;
}

/** Templates 2–4 of SPEC.md §5 arrive with M5. */
export const TEMPLATES: readonly Template[] = [
	{
		id: 'career',
		title: CAREER.title,
		description: CAREER.description ?? '',
		create: careerTemplate
	}
];

export const findTemplate = (id: string): Template | undefined =>
	TEMPLATES.find((t) => t.id === id);
