<script lang="ts">
	import { t } from '#lib/i18n/index.js';
	import type { UiIssue } from '#lib/model/issues.js';

	// Live validation for one step, announced politely (ARCHITECTURE.md §9).
	let { issues }: { issues: UiIssue[] } = $props();

	const errors = $derived(issues.filter((i) => i.severity === 'error'));
	const warnings = $derived(issues.filter((i) => i.severity === 'warning'));
</script>

<div class="issues" aria-live="polite">
	{#if errors.length > 0}
		<section class="errors">
			<h3>{t.wizard.errorsHere}</h3>
			<ul>
				{#each errors as issue (issue.key + issue.message)}
					<li>{issue.message}</li>
				{/each}
			</ul>
		</section>
	{/if}
	{#if warnings.length > 0}
		<section class="warnings">
			<h3>{t.wizard.warningsHere}</h3>
			<ul>
				{#each warnings as issue (issue.key + issue.message)}
					<li>{issue.message}</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

<style>
	.issues {
		display: grid;
		gap: 0.75rem;
		margin-top: 1.5rem;
	}

	section {
		padding: 0.5rem 1rem;
		border-left: 4px solid;
		background: var(--color-surface);
	}

	.errors {
		border-color: var(--color-error);
	}

	.warnings {
		border-color: var(--color-warn);
	}

	h3 {
		margin: 0.25rem 0;
		font-size: 1rem;
	}

	ul {
		margin: 0.25rem 0;
		padding-left: 1.25rem;
	}
</style>
