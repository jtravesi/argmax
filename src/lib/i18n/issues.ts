// Turns an Issue (stable code + path) into a sentence, resolving names from the model.
import type { DecisionModel, Issue } from '#lib/core/index.js';
import { en, type IssueContext } from './en';

const TEXT_FIELDS = new Set(['title', 'description', 'horizon', 'name', 'id']);
const LIST_FIELDS = new Set(['dimensions', 'alternatives', 'states']);

const named = (name: string | undefined, fallback: string) => (name ? en.quoted(name) : fallback);

interface Labels {
	field: string;
	alternative: string;
}

/** Human labels for the field a path points to. Paths come from validate or parseModel. */
export function labelsOf(path: readonly (string | number)[], model: DecisionModel): Labels {
	const f = en.fields;
	const [root, i, key, j, sub, dimId] = path;

	if (root === 'title' || root === 'description' || root === 'horizon') {
		return { field: f[root], alternative: '' };
	}

	if (root === 'dimensions') {
		if (typeof i !== 'number') return { field: f.dimensions, alternative: '' };
		const dim = named(model.dimensions[i]?.name, en.unnamed.dimension(i + 1));
		if (key === 'weight') return { field: f.weightOf(dim), alternative: '' };
		if (key === 'name' || key === 'id') return { field: f.nameOf(dim), alternative: '' };
		return { field: dim, alternative: '' };
	}

	if (root === 'alternatives') {
		if (typeof i !== 'number') return { field: f.alternatives, alternative: '' };
		const altModel = model.alternatives[i];
		const alt = named(altModel?.name, en.unnamed.alternative(i + 1));
		if (key === 'name' || key === 'id') return { field: f.nameOf(alt), alternative: alt };
		if (key !== 'states') return { field: alt, alternative: alt };
		if (typeof j !== 'number') return { field: f.statesOf(alt), alternative: alt };
		const state = named(altModel?.states[j]?.name, en.unnamed.state(j + 1));
		if (sub === 'probability') return { field: f.probabilityOf(state, alt), alternative: alt };
		if (sub === 'name' || sub === 'id') {
			return { field: f.nameOf(f.stateOf(state, alt)), alternative: alt };
		}
		if (sub === 'scores') {
			if (dimId === undefined) return { field: f.scoresOf(state, alt), alternative: alt };
			const k = model.dimensions.findIndex((d) => d.id === dimId);
			const dim = named(model.dimensions[k]?.name, en.unnamed.dimension(k + 1));
			return { field: f.scoreOf(state, alt, dim), alternative: alt };
		}
		return { field: f.stateOf(state, alt), alternative: alt };
	}

	return { field: f.model, alternative: '' };
}

/** What kind of value the path holds, so "too small" can read naturally. */
function kindOf(path: readonly (string | number)[]): 'text' | 'list' | 'number' {
	const last = String(path[path.length - 1]);
	if (TEXT_FIELDS.has(last)) return 'text';
	if (LIST_FIELDS.has(last)) return 'list';
	return 'number';
}

export function describeIssue(issue: Issue, model: DecisionModel): string {
	const context: IssueContext = {
		...labelsOf(issue.path, model),
		params: { kind: kindOf(issue.path), ...issue.params }
	};
	return en.issues[issue.code](context);
}
