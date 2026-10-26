// State of the tool: the model being edited and everything derived from it.
// Results are always derived, never stored (ARCHITECTURE.md §1).
import {
	analyze,
	normalize,
	parseModel,
	validate,
	type DecisionModel,
	type NormalizedModel
} from '#lib/core/index.js';
import { blankModel } from '#lib/model/edit.js';
import { collectIssues, STEPS, type StepName, type UiIssue } from '#lib/model/issues.js';

export class Editor {
	model = $state<DecisionModel>(blankModel());
	step = $state<StepName>('decision');
	/** Threshold τ for P_τ in the risk profile (MODEL.md §4). */
	tau = $state(5);
	/** Half-width h of the tornado intervals (MODEL.md §5.4). */
	h = $state(0.1);

	readonly validation = $derived(validate(this.model));
	readonly parsed = $derived(parseModel($state.snapshot(this.model)));
	readonly issues: UiIssue[] = $derived(collectIssues(this.model, this.validation, this.parsed));
	readonly errorKeys: readonly string[] = $derived(
		this.issues.filter((i) => i.severity === 'error').map((i) => i.key)
	);
	/** Valid for the math and the schema: results can be shown and the model saved. */
	readonly valid = $derived(this.errorKeys.length === 0);
	readonly analysis = $derived(
		this.valid ? analyze($state.snapshot(this.model), { tau: this.tau, h: this.h }) : null
	);
	/** The model on the simplex, independent of τ and h, so the what-if survives them. */
	readonly normalized = $derived(this.valid ? normalize($state.snapshot(this.model)) : null);

	/** What-if copy of `normalized` (SPEC.md §3.2, item 6). Never saved. */
	#whatIf = $state.raw<{ base: NormalizedModel; model: NormalizedModel } | null>(null);

	/** The current what-if model, or the baseline if nothing was moved or the model changed. */
	get whatIf(): NormalizedModel | null {
		const base = this.normalized;
		if (!base) return null;
		return this.#whatIf?.base === base ? this.#whatIf.model : base;
	}

	get whatIfActive(): boolean {
		return this.#whatIf !== null && this.#whatIf.base === this.normalized;
	}

	setWhatIf(model: NormalizedModel | null): void {
		const base = this.normalized;
		this.#whatIf = base && model ? { base, model } : null;
	}

	issuesFor(step: StepName): UiIssue[] {
		return this.issues.filter((i) => i.step === step);
	}

	stepHasErrors(step: StepName): boolean {
		return this.issues.some((i) => i.step === step && i.severity === 'error');
	}

	hasError(...path: (string | number)[]): boolean {
		return this.errorKeys.includes(path.join('.'));
	}

	get stepIndex(): number {
		return STEPS.indexOf(this.step);
	}

	go(step: StepName): void {
		this.step = step;
	}

	replace(model: DecisionModel): void {
		this.model = model;
		this.step = 'decision';
	}
}
