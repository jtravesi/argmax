<script lang="ts">
	import type { Analysis } from '#lib/core/index.js';
	import { formatUtility } from '#lib/format.js';
	import { t } from '#lib/i18n/index.js';
	import Bar from '../charts/Bar.svelte';

	// SPEC.md §3.2, item 2: EU per alternative on a fixed 0–10 scale.
	let { analysis }: { analysis: Analysis } = $props();
	const nameOf = (id: string) => analysis.alternatives.find((a) => a.id === id)?.name ?? id;
</script>

<section aria-labelledby="ranking-heading">
	<h3 id="ranking-heading">{t.results.ranking}</h3>
	<p class="sr-only">{t.results.rankingChart}</p>
	<ol>
		{#each analysis.ranking as entry (entry.altId)}
			<li>
				<span class="name">{nameOf(entry.altId)}</span>
				<Bar value={entry.eu} />
				<span class="value">{formatUtility(entry.eu)}</span>
			</li>
		{/each}
	</ol>
	<div class="axis" aria-hidden="true"><span>0</span><span>5</span><span>10</span></div>
</section>

<style>
	ol {
		display: grid;
		gap: 0.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	li {
		display: grid;
		grid-template-columns: minmax(6rem, 14rem) 1fr 3rem;
		gap: 0.75rem;
		align-items: center;
	}

	.name {
		overflow-wrap: anywhere;
	}

	.value {
		text-align: right;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.axis {
		display: flex;
		justify-content: space-between;
		margin-left: calc(min(14rem, 30%) + 0.75rem);
		margin-right: 3.75rem;
		color: var(--color-muted);
		font-size: 0.8rem;
	}

	@media (max-width: 39.99rem) {
		li {
			grid-template-columns: 1fr 3rem;
		}

		.name {
			grid-column: 1 / -1;
		}

		.axis {
			margin-left: 0;
		}
	}
</style>
