<script lang="ts">
	import type { Analysis, DecisionModel } from '#lib/core/index.js';
	import { formatUtility } from '#lib/format.js';
	import { t } from '#lib/i18n/index.js';
	import { describeIssue } from '#lib/i18n/issues.js';

	// SPEC.md §3.2, item 1.
	let { analysis, model }: { analysis: Analysis; model: DecisionModel } = $props();

	const nameOf = (id: string) => analysis.alternatives.find((a) => a.id === id)?.name ?? id;
	const v = $derived(analysis.verdict);
</script>

<section aria-labelledby="verdict-heading" class="verdict {v.robustness}">
	<h3 id="verdict-heading">{t.results.verdict}</h3>
	<p class="winner">{t.results.winner(nameOf(v.winner))}</p>
	<p class="figures">
		{t.results.eu}: <strong>{formatUtility(v.eu)}</strong>
		<span aria-hidden="true">·</span>
		{t.results.gap(formatUtility(v.gap), nameOf(v.runnerUp))}
	</p>
	<p class="label">{t.results.robustness[v.robustness]}</p>

	{#if analysis.warnings.length > 0}
		<h4>{t.results.warnings}</h4>
		<ul>
			{#each analysis.warnings as w (w.code + w.path.join('.'))}
				<li>{describeIssue(w, model)}</li>
			{/each}
		</ul>
	{/if}
</section>

<style>
	.verdict {
		padding: 1rem 1.25rem;
		border: 1px solid var(--color-border);
		border-left: 6px solid var(--color-accent);
		border-radius: var(--radius);
		background: var(--color-surface);
	}

	.verdict.close {
		border-left-color: var(--color-warn);
	}

	.verdict.clear {
		border-left-color: var(--color-ok);
	}

	h3 {
		margin: 0;
		font-size: 1rem;
		color: var(--color-muted);
	}

	.winner {
		margin: 0.25rem 0;
		font-size: 1.35rem;
		font-weight: 600;
	}

	.figures {
		margin: 0.25rem 0;
		font-variant-numeric: tabular-nums;
	}

	.label {
		margin: 0.25rem 0 0;
		font-weight: 600;
	}

	h4 {
		margin: 1rem 0 0.25rem;
	}
</style>
