<script lang="ts">
	import { t } from '#lib/i18n/index.js';
	import { STEPS, type StepName } from '#lib/model/issues.js';
	import type { Editor } from '#lib/stores/editor.svelte.js';
	import Results from '../results/Results.svelte';
	import IssueList from './IssueList.svelte';
	import StepAlternatives from './StepAlternatives.svelte';
	import StepDecision from './StepDecision.svelte';
	import StepDimensions from './StepDimensions.svelte';
	import StepScores from './StepScores.svelte';
	import StepStates from './StepStates.svelte';

	// SPEC.md §3.1: six steps, free navigation; a step with errors is flagged but
	// does not block navigation, except the results.
	let { editor }: { editor: Editor } = $props();

	let heading: HTMLElement | undefined = $state();
	let firstRun = true;

	// Move focus to the new step's heading, but not on page load.
	$effect(() => {
		void editor.step;
		if (firstRun) {
			firstRun = false;
			return;
		}
		heading?.focus();
	});

	const index = $derived(editor.stepIndex);
	const stepsWithErrors = $derived(STEPS.filter((s) => s !== 'results' && editor.stepHasErrors(s)));
	const go = (step: StepName) => editor.go(step);
</script>

<nav aria-label={t.wizard.stepsLabel} class="steps">
	<ol>
		{#each STEPS as step, i (step)}
			<li>
				<button
					type="button"
					aria-current={editor.step === step ? 'step' : undefined}
					class:error={step !== 'results' && editor.stepHasErrors(step)}
					onclick={() => go(step)}
				>
					<span class="n" aria-hidden="true">{i + 1}</span>
					<span class="label">{t.wizard.steps[step]}</span>
					{#if step !== 'results' && editor.stepHasErrors(step)}
						<span class="sr-only">({t.wizard.hasErrors})</span>
					{/if}
				</button>
			</li>
		{/each}
	</ol>
	<progress value={index + 1} max={STEPS.length} aria-hidden="true"></progress>
</nav>

<section class="step" aria-labelledby="step-heading">
	<p class="count">{t.wizard.stepOf(index + 1, STEPS.length)}</p>
	<h2 id="step-heading" tabindex="-1" bind:this={heading}>{t.wizard.steps[editor.step]}</h2>

	{#if editor.step === 'decision'}
		<StepDecision {editor} />
	{:else if editor.step === 'dimensions'}
		<StepDimensions {editor} />
	{:else if editor.step === 'alternatives'}
		<StepAlternatives {editor} />
	{:else if editor.step === 'states'}
		<StepStates {editor} />
	{:else if editor.step === 'scores'}
		<StepScores {editor} />
	{:else if editor.analysis?.ok}
		<Results analysis={editor.analysis} {editor} />
	{:else}
		<div class="blocked">
			<p>{t.wizard.blocked}</p>
			<ul>
				{#each stepsWithErrors as step (step)}
					<li>
						<button type="button" class="link" onclick={() => go(step)}
							>{t.wizard.steps[step]}</button
						>
					</li>
				{/each}
			</ul>
		</div>
	{/if}

	{#if editor.step !== 'results'}
		<IssueList issues={editor.issuesFor(editor.step)} />
	{/if}
</section>

<div class="buttons">
	<button type="button" disabled={index === 0} onclick={() => go(STEPS[index - 1])}
		>{t.wizard.back}</button
	>
	{#if index < STEPS.length - 1}
		<button type="button" onclick={() => go(STEPS[index + 1])}>{t.wizard.next}</button>
	{/if}
	{#if editor.valid && editor.step !== 'results'}
		<button type="button" class="primary" onclick={() => go('results')}
			>{t.wizard.seeResults}</button
		>
	{/if}
</div>

<style>
	.steps ol {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.steps button {
		display: flex;
		gap: 0.4rem;
		align-items: center;
		padding: 0.3rem 0.6rem;
		background: none;
		border-color: transparent;
	}

	.steps button[aria-current='step'] {
		border-color: var(--color-accent);
		font-weight: 600;
	}

	.n {
		display: inline-grid;
		place-items: center;
		width: 1.6rem;
		height: 1.6rem;
		border-radius: 50%;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		font-size: 0.85rem;
	}

	[aria-current='step'] .n {
		background: var(--color-accent);
		border-color: var(--color-accent);
		color: var(--color-accent-fg);
	}

	.error .n {
		border: 2px solid var(--color-error);
	}

	.error .label {
		color: var(--color-error);
	}

	progress {
		display: block;
		width: 100%;
		height: 0.4rem;
		margin-top: 0.5rem;
		accent-color: var(--color-accent);
	}

	.step {
		margin-top: 1.5rem;
	}

	.count {
		margin: 0;
		color: var(--color-muted);
		font-size: 0.9rem;
	}

	h2 {
		margin-top: 0.25rem;
	}

	.blocked {
		padding: 1rem;
		border-left: 4px solid var(--color-error);
		background: var(--color-surface);
	}

	.buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 2rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
	}

	/* Narrow screens: only the current step keeps its visible label. */
	@media (max-width: 39.99rem) {
		.steps ol {
			gap: 0.1rem;
		}

		.steps button {
			padding: 0.2rem 0.3rem;
		}

		.steps button:not([aria-current='step']) .label {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
		}
	}
</style>
