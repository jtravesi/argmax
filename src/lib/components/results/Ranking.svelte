<script lang="ts">
	import type { Analysis } from '#lib/core/index.js';
	import { t } from '#lib/i18n/index.js';
	import RankingTable from './RankingTable.svelte';

	// SPEC.md §3.2, item 2: EU per alternative on a fixed 0–10 scale.
	let { analysis }: { analysis: Analysis } = $props();
	const nameOf = (id: string) => analysis.alternatives.find((a) => a.id === id)?.name ?? id;
</script>

<section aria-labelledby="ranking-heading">
	<h3 id="ranking-heading">{t.results.ranking}</h3>
	<RankingTable ranking={analysis.ranking} {nameOf} caption={t.results.rankingChart} />
</section>
