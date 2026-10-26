<script lang="ts">
	import type { Analysis, DecisionModel, TornadoBar } from '#lib/core/index.js';
	import { formatGap, formatPercent } from '#lib/format.js';
	import { t } from '#lib/i18n/index.js';
	import type { Editor } from '#lib/stores/editor.svelte.js';
	import TornadoChart from '../charts/TornadoChart.svelte';

	// SPEC.md §3.2, item 8; MODEL.md §5.4.
	let { analysis, model, editor }: { analysis: Analysis; model: DecisionModel; editor: Editor } =
		$props();

	const H_OPTIONS = [0.05, 0.1, 0.2] as const;

	const nameOf = (id: string) => analysis.alternatives.find((a) => a.id === id)?.name ?? id;
	const winner = $derived(analysis.verdict.winner);
	const baseline = $derived(analysis.verdict.gap);

	function labelOf(bar: TornadoBar): string {
		const p = bar.parameter;
		if (p.kind === 'weight') {
			return t.results.weightOf(model.dimensions.find((d) => d.id === p.dimId)?.name ?? p.dimId);
		}
		const alt = analysis.alternatives.find((a) => a.id === p.altId);
		const state = alt?.states.find((s) => s.id === p.stateId);
		return t.results.probabilityOf(state?.name ?? p.stateId, alt?.name ?? p.altId);
	}

	const keyOf = (bar: TornadoBar) =>
		bar.parameter.kind === 'weight'
			? `w-${bar.parameter.dimId}`
			: `p-${bar.parameter.altId}-${bar.parameter.stateId}`;

	/** The new winner at either end, if any (MODEL.md §5.4 recomputes the full ranking). */
	const newWinner = (bar: TornadoBar) =>
		[bar.winnerAtLow, bar.winnerAtHigh].find((w) => w !== winner);

	const rows = $derived(
		analysis.tornado.map((bar) => ({
			key: keyOf(bar),
			label: labelOf(bar),
			min: bar.min,
			max: bar.max
		}))
	);
</script>

<section aria-labelledby="tornado-heading">
	<h3 id="tornado-heading">{t.results.tornado}</h3>
	<p class="help">
		{t.results.tornadoHelp(
			nameOf(winner),
			nameOf(analysis.verdict.runnerUp),
			formatPercent(editor.h)
		)}
	</p>

	<fieldset class="h">
		<legend>{t.results.tornadoH}</legend>
		{#each H_OPTIONS as h (h)}
			<label>
				<input
					type="radio"
					name="tornado-h"
					value={h}
					checked={editor.h === h}
					onchange={() => (editor.h = h)}
				/>
				±{formatPercent(h)}
			</label>
		{/each}
	</fieldset>

	<TornadoChart
		{rows}
		{baseline}
		label="{t.results.tornadoChart(nameOf(winner), nameOf(analysis.verdict.runnerUp))}. {t.results
			.chartTable}"
	/>

	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th scope="col">{t.results.parameter}</th>
					<th scope="col" class="num">{t.results.range}</th>
					<th scope="col" class="num">{t.results.gapAtLow}</th>
					<th scope="col" class="num">{t.results.gapAtHigh}</th>
					<th scope="col">{t.results.winnerChanges}</th>
				</tr>
			</thead>
			<tbody>
				{#each analysis.tornado as bar (keyOf(bar))}
					{@const changed = newWinner(bar)}
					<tr>
						<th scope="row">{labelOf(bar)}</th>
						<td class="num">{formatPercent(bar.low)}–{formatPercent(bar.high)}</td>
						<td class="num">{formatGap(bar.gapAtLow)}</td>
						<td class="num">{formatGap(bar.gapAtHigh)}</td>
						<td class:changed>{changed ? t.results.yes(nameOf(changed)) : t.results.no}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<style>
	.h {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
		margin: 0 0 1rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	legend {
		font-weight: 600;
	}

	.h label {
		display: flex;
		gap: 0.35rem;
		align-items: center;
	}

	.table-wrap {
		margin-top: 1rem;
	}

	tbody th {
		font-weight: normal;
		overflow-wrap: break-word;
	}

	.changed {
		color: var(--color-warn);
		font-weight: 600;
	}
</style>
