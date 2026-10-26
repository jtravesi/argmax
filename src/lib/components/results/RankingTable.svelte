<script lang="ts">
	import type { RankEntry } from '#lib/core/index.js';
	import { formatUtility } from '#lib/format.js';
	import { t } from '#lib/i18n/index.js';
	import Bar from '../charts/Bar.svelte';

	// EU per alternative on a fixed 0–10 scale. The table is the chart: names and
	// values are text, the bars are decorative.
	let {
		ranking,
		nameOf,
		caption
	}: { ranking: RankEntry[]; nameOf: (id: string) => string; caption: string } = $props();
</script>

<table>
	<caption class="sr-only">{caption}</caption>
	<colgroup>
		<col class="name" />
		<col />
		<col class="value" />
	</colgroup>
	<thead class="sr-only">
		<tr>
			<th scope="col">{t.results.alternative}</th>
			<td aria-hidden="true"></td>
			<th scope="col">{t.results.eu}</th>
		</tr>
	</thead>
	<tbody>
		{#each ranking as entry (entry.altId)}
			<tr>
				<th scope="row">{nameOf(entry.altId)}</th>
				<td class="bar"><Bar value={entry.eu} /></td>
				<td class="num">{formatUtility(entry.eu)}</td>
			</tr>
		{/each}
	</tbody>
</table>
<div class="axis" aria-hidden="true"><span>0</span><span>5</span><span>10</span></div>

<style>
	table {
		table-layout: fixed;
	}

	th,
	td {
		border: 0;
		padding: 0.25rem 0;
		vertical-align: middle;
	}

	col.name {
		width: 35%;
	}

	col.value {
		width: 3.5rem;
	}

	tbody th {
		padding-right: 0.75rem;
		font-weight: normal;
		overflow-wrap: break-word;
	}

	td.num {
		font-weight: 600;
	}

	.axis {
		display: flex;
		justify-content: space-between;
		margin: 0 3.5rem 0 35%;
		color: var(--color-muted);
		font-size: 0.8rem;
	}

	@media (max-width: 39.99rem) {
		tbody tr {
			display: grid;
			grid-template-columns: 1fr 3.5rem;
		}

		tbody th {
			grid-column: 1 / -1;
			width: auto;
		}

		.axis {
			margin-left: 0;
		}
	}
</style>
