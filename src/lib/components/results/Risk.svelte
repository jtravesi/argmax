<script lang="ts">
	import type { Analysis } from '#lib/core/index.js';
	import { formatPercent, formatUtility } from '#lib/format.js';
	import { t } from '#lib/i18n/index.js';
	import type { Editor } from '#lib/stores/editor.svelte.js';
	import Range from '../charts/Range.svelte';

	// SPEC.md §3.2, item 4; MODEL.md §4.
	let { analysis, editor }: { analysis: Analysis; editor: Editor } = $props();
	const tauText = $derived(formatUtility(editor.tau));
	const setTau = (e: Event & { currentTarget: HTMLInputElement }) => {
		const v = e.currentTarget.valueAsNumber;
		if (Number.isFinite(v)) editor.tau = Math.max(0, Math.min(10, v));
	};
</script>

<section aria-labelledby="risk-heading">
	<h3 id="risk-heading">{t.results.risk}</h3>
	<p class="help">{t.results.riskHelp}</p>

	<div class="tau">
		<label for="f-tau">{t.results.tau}</label>
		<input
			type="range"
			min="0"
			max="10"
			step="0.5"
			value={editor.tau}
			aria-label={t.results.tau}
			oninput={setTau}
		/>
		<input
			id="f-tau"
			type="number"
			min="0"
			max="10"
			step="0.5"
			value={editor.tau}
			oninput={setTau}
		/>
	</div>

	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th scope="col">{t.results.alternative}</th>
					<th scope="col" class="num">{t.results.worst}</th>
					<th scope="col" class="num">{t.results.best}</th>
					<th scope="col" class="num"
						><abbr title={t.results.stdDevLong}>{t.results.stdDev}</abbr></th
					>
					<th scope="col" class="num">{t.results.pBelowTau(tauText)}</th>
				</tr>
			</thead>
			<tbody>
				{#each analysis.alternatives as alt (alt.id)}
					<tr>
						<th scope="row">{alt.name}</th>
						<td class="num">{formatUtility(alt.risk.worst)}</td>
						<td class="num">{formatUtility(alt.risk.best)}</td>
						<td class="num">{formatUtility(alt.risk.stdDev)}</td>
						<td class="num">{formatPercent(alt.risk.pBelowTau)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="ranges" role="img" aria-label={t.results.rangeChart}>
		{#each analysis.alternatives as alt (alt.id)}
			<div class="range">
				<span class="name">{alt.name}</span>
				<Range min={alt.risk.worst} mean={alt.eu} max={alt.risk.best} tau={editor.tau} />
			</div>
		{/each}
		<div class="axis" aria-hidden="true"><span>0</span><span>5</span><span>10</span></div>
	</div>
</section>

<style>
	.tau {
		display: grid;
		grid-template-columns: 1fr 5rem;
		gap: 0.25rem 0.75rem;
		align-items: center;
		max-width: 28rem;
		margin-bottom: 1rem;
	}

	.tau label {
		grid-column: 1 / -1;
		font-weight: 600;
	}

	tbody th {
		font-weight: normal;
		overflow-wrap: break-word;
	}

	.ranges {
		display: grid;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.range {
		display: grid;
		grid-template-columns: minmax(6rem, 14rem) 1fr;
		gap: 0.75rem;
		align-items: center;
	}

	.name {
		overflow-wrap: anywhere;
	}

	.axis {
		display: flex;
		justify-content: space-between;
		margin-left: calc(min(14rem, 30%) + 0.75rem);
		color: var(--color-muted);
		font-size: 0.8rem;
	}

	@media (max-width: 39.99rem) {
		.range {
			grid-template-columns: 1fr;
			gap: 0.1rem;
		}

		.axis {
			margin-left: 0;
		}

		th,
		td {
			padding: 0.3rem 0.25rem;
			font-size: 0.9rem;
		}
	}
</style>
