<script lang="ts">
	import type { Analysis } from '#lib/core/index.js';
	import { formatPercent, formatUtility } from '#lib/format.js';
	import { t } from '#lib/i18n/index.js';
	import StackedBar from '../charts/StackedBar.svelte';

	// SPEC.md §3.2, item 3: per state, p_a(s), u(a, s) and c(a, s) (MODEL.md §3).
	let { analysis }: { analysis: Analysis } = $props();
</script>

<section aria-labelledby="breakdown-heading">
	<h3 id="breakdown-heading">{t.results.breakdown}</h3>
	{#each analysis.alternatives as alt (alt.id)}
		<div class="alternative">
			<h4>{alt.name}</h4>
			<StackedBar
				label="{t.results.contributionsChart(alt.name)}. {t.results.chartTable}"
				segments={alt.states.map((s) => ({ key: s.id, value: s.contribution }))}
			/>
			<div class="table-wrap">
				<table>
					<thead>
						<tr>
							<th scope="col">{t.results.state}</th>
							<th scope="col" class="num">{t.results.probability}</th>
							<th scope="col" class="num">{t.results.utility}</th>
							<th scope="col" class="num">{t.results.contribution}</th>
						</tr>
					</thead>
					<tbody>
						{#each alt.states as s, j (s.id)}
							<tr>
								<th scope="row">
									<span
										class="swatch"
										style="background: var(--series-{(j % 8) + 1})"
										aria-hidden="true"
									></span>
									{s.name}
								</th>
								<td class="num">{formatPercent(s.probability)}</td>
								<td class="num">{formatUtility(s.utility)}</td>
								<td class="num">{formatUtility(s.contribution)}</td>
							</tr>
						{/each}
					</tbody>
					<tfoot>
						<tr>
							<th scope="row" colspan="3">{t.results.total}</th>
							<td class="num total">{formatUtility(alt.eu)}</td>
						</tr>
					</tfoot>
				</table>
			</div>
		</div>
	{/each}
</section>

<style>
	.alternative {
		margin: 1rem 0 1.5rem;
	}

	h4 {
		margin: 0 0 0.5rem;
	}

	table {
		margin-top: 0.5rem;
	}

	tbody th {
		font-weight: normal;
		overflow-wrap: break-word;
	}

	thead th.num {
		white-space: nowrap;
	}

	@media (max-width: 39.99rem) {
		th,
		td {
			padding: 0.3rem 0.25rem;
			font-size: 0.9rem;
		}
	}

	.swatch {
		display: inline-block;
		width: 0.75rem;
		height: 0.75rem;
		margin-right: 0.35rem;
		border-radius: 2px;
		vertical-align: -0.05rem;
	}

	tfoot th {
		text-align: right;
	}

	.total {
		font-weight: 700;
	}
</style>
