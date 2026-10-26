// Live validation for the wizard: issues from validate (MODEL.md §7) and from the
// schema (ARCHITECTURE.md §4), each assigned to the step where it can be fixed.
import type { DecisionModel, Issue, Result } from '#lib/core/index.js';
import { describeIssue } from '#lib/i18n/issues.js';

export const STEPS = [
	'decision',
	'dimensions',
	'alternatives',
	'states',
	'scores',
	'results'
] as const;
export type StepName = (typeof STEPS)[number];

export interface UiIssue {
	/** The path joined with dots; unique per field. */
	key: string;
	severity: 'error' | 'warning';
	step: StepName;
	message: string;
}

const ALTERNATIVE_LEVEL_STATE_CODES = new Set([
	'no-states',
	'probabilities-sum-zero',
	'probabilities-not-normalized',
	'single-state'
]);

/** The wizard step where an issue can be fixed. */
export function stepOf(issue: Issue): StepName {
	const [root, , key, , sub] = issue.path;
	if (root === 'dimensions') return 'dimensions';
	if (root !== 'alternatives') return 'decision';
	if (issue.path.length === 1) return 'alternatives';
	if (key === 'states') return sub === 'scores' ? 'scores' : 'states';
	if (ALTERNATIVE_LEVEL_STATE_CODES.has(issue.code)) return 'states';
	return 'alternatives';
}

export const pathKey = (path: readonly (string | number)[]) => path.join('.');

/**
 * Errors from validate and the schema, then warnings. When both report the same
 * field, the validate message wins: it is the more specific one.
 */
export function collectIssues(
	model: DecisionModel,
	validation: { errors: Issue[]; warnings: Issue[] },
	parsed: Result<DecisionModel, Issue[]>
): UiIssue[] {
	const seen = new Set<string>();
	const result: UiIssue[] = [];
	const add = (issue: Issue, severity: UiIssue['severity']) => {
		const key = pathKey(issue.path);
		if (severity === 'error') {
			if (seen.has(key)) return;
			seen.add(key);
		}
		result.push({ key, severity, step: stepOf(issue), message: describeIssue(issue, model) });
	};
	validation.errors.forEach((i) => add(i, 'error'));
	if (!parsed.ok) parsed.error.forEach((i) => add(i, 'error'));
	validation.warnings.forEach((i) => add(i, 'warning'));
	return result;
}
