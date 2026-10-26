// Templates shipped with the app (SPEC.md §5). They go through parseModel like any input.
import { parseModel, type DecisionModel } from '#lib/core/index.js';
import career from '../../../fixtures/career-decision.json';
import blank from './blank.json';
import flat from './flat.json';
import jobOffers from './job-offers.json';

export interface Template {
	id: string;
	title: string;
	description: string;
	create: () => DecisionModel;
}

function template(id: string, data: unknown): Template {
	const result = parseModel(data);
	if (!result.ok) throw new Error(`Template "${id}" is not a valid model`);
	const model = result.value;
	return {
		id,
		title: model.title,
		description: model.description ?? '',
		// A fresh copy each time, so editing it never changes the template.
		create: () => structuredClone(model)
	};
}

/** SPEC.md §5, in that order. The career template is also the test oracle. */
export const TEMPLATES: readonly Template[] = [
	template('career', career),
	template('job-offers', jobOffers),
	template('flat', flat),
	template('blank', blank)
];

export const findTemplate = (id: string): Template | undefined =>
	TEMPLATES.find((t) => t.id === id);

export const careerTemplate = (): DecisionModel => TEMPLATES[0].create();
