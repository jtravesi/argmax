<script lang="ts">
	import type { Analysis, DecisionModel } from '#lib/core/index.js';
	import { formatPercent, formatTipping } from '#lib/format.js';
	import { t } from '#lib/i18n/index.js';
	import { sideOf } from '#lib/model/whatif.js';

	// SPEC.md §3.2, item 7; MODEL.md §5.1 and §5.2 (closed form).
	let { analysis, model }: { analysis: Analysis; model: DecisionModel } = $props();

	const nameOf = (id: string) => analysis.alternatives.find((a) => a.id === id)?.name ?? id;
	const dimName = (id: string) => model.dimensions.find((d) => d.id === id)?.name ?? id;
	const winner = $derived(nameOf(analysis.verdict.winner));
	const runnerUp = $derived(nameOf(analysis.verdict.runnerUp));

	const weightOf = (id: string) => analysis.model.weights.get(id) ?? 0;
	const probabilityOf = (altId: string, stateId: string) =>
		analysis.model.alternatives.find((a) => a.id === altId)?.states.find((s) => s.id === stateId)
			?.probability ?? 0;
	const stateName = (altId: string, stateId: string) =>
		analysis.alternatives.find((a) => a.id === altId)?.states.find((s) => s.id === stateId)?.name ??
		stateId;

	const describe = (current: number, tipping: number) =>
		t.results.side[sideOf(current, tipping)](formatTipping(tipping));
</script>

<section aria-labelledby="tipping-heading">
	<h3 id="tipping-heading">{t.results.tipping}</h3>

	<p class="help">{t.results.tippingWeightsHelp(runnerUp, winner)}</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th scope="col">{t.results.dimension}</th>
					<th scope="col" class="num">{t.results.current}</th>
					<th scope="col" class="num">{t.results.tippingPoint}</th>
				</tr>
			</thead>
			<tbody>
				{#each analysis.tippingWeights as tp (tp.dimId)}
					{@const current = weightOf(tp.dimId)}
					<tr>
						<th scope="row">{dimName(tp.dimId)}</th>
						<td class="num">{formatPercent(current)}</td>
						<td class="num" class:none={tp.weight === null}>
							{tp.weight === null ? t.results.noWeightChanges : describe(current, tp.weight)}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<p class="help">{t.results.tippingProbabilitiesHelp(runnerUp, winner)}</p>
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th scope="col">{t.results.state}</th>
					<th scope="col" class="num">{t.results.current}</th>
					<th scope="col" class="num">{t.results.tippingPoint}</th>
				</tr>
			</thead>
			<tbody>
				{#each analysis.tippingProbabilities as tp (tp.altId + tp.stateId)}
					{@const current = probabilityOf(tp.altId, tp.stateId)}
					<tr>
						<th scope="row"
							>{t.results.outcomeOf(stateName(tp.altId, tp.stateId), nameOf(tp.altId))}</th
						>
						<td class="num">{formatPercent(current)}</td>
						<td class="num" class:none={tp.probability === null}>
							{tp.probability === null
								? t.results.noProbabilityChanges
								: describe(current, tp.probability)}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<style>
	tbody th {
		font-weight: normal;
		overflow-wrap: break-word;
	}

	.none {
		color: var(--color-muted);
	}

	.help:not(:first-of-type) {
		margin-top: 1.5rem;
	}
</style>
