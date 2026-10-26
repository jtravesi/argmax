<script lang="ts">
	import type { Analysis, DecisionModel } from '#lib/core/index.js';
	import { formatUtility } from '#lib/format.js';
	import { t } from '#lib/i18n/index.js';

	// SPEC.md §3.2, item 5: x̄(a, d) per alternative and dimension, and dominance (MODEL.md §6).
	let { analysis, model }: { analysis: Analysis; model: DecisionModel } = $props();
	const nameOf = (id: string) => analysis.alternatives.find((a) => a.id === id)?.name ?? id;
</script>

<section aria-labelledby="profile-heading">
	<h3 id="profile-heading">{t.results.profile}</h3>
	<p class="help">{t.results.profileHelp}</p>

	{#if analysis.dominance.length > 0}
		<div class="dominance" role="note">
			{#each analysis.dominance as d (d.dominant + d.dominated)}
				<p><strong>{t.results.dominance(nameOf(d.dominant), nameOf(d.dominated))}</strong></p>
			{/each}
			<p class="help">{t.results.dominanceHelp}</p>
		</div>
	{/if}

	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th scope="col">{t.results.alternative}</th>
					{#each model.dimensions as dim (dim.id)}
						<th scope="col" class="num">{dim.name}</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each analysis.alternatives as alt (alt.id)}
					<tr>
						<th scope="row">{alt.name}</th>
						{#each model.dimensions as dim (dim.id)}
							<td class="num">{formatUtility(alt.profile.get(dim.id) ?? NaN)}</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>

<style>
	.dominance {
		margin-bottom: 1rem;
		padding: 0.5rem 1rem;
		border-left: 4px solid var(--color-ok);
		background: var(--color-surface);
	}

	.dominance p {
		margin: 0.25rem 0;
	}

	tbody th {
		font-weight: normal;
		overflow-wrap: break-word;
	}

	thead th.num {
		vertical-align: bottom;
	}
</style>
