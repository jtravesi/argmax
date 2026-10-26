<script lang="ts">
	import type { Analysis } from '#lib/core/index.js';
	import { t } from '#lib/i18n/index.js';
	import type { Editor } from '#lib/stores/editor.svelte.js';
	import Breakdown from './Breakdown.svelte';
	import ExpectedProfile from './ExpectedProfile.svelte';
	import Ranking from './Ranking.svelte';
	import Risk from './Risk.svelte';
	import TippingPoints from './TippingPoints.svelte';
	import Tornado from './Tornado.svelte';
	import Verdict from './Verdict.svelte';
	import WhatIf from './WhatIf.svelte';

	// SPEC.md §3.2, items 1–9, in that order.
	let { analysis, editor }: { analysis: Analysis; editor: Editor } = $props();
</script>

<div class="results">
	<Verdict {analysis} model={editor.model} />
	<Ranking {analysis} />
	<Breakdown {analysis} />
	<Risk {analysis} {editor} />
	<ExpectedProfile {analysis} model={editor.model} />
	{#if editor.normalized}
		<WhatIf {editor} base={editor.normalized} model={editor.model} />
	{/if}
	<TippingPoints {analysis} model={editor.model} />
	<Tornado {analysis} model={editor.model} {editor} />
	<p class="reminder">{t.results.reminder}</p>
</div>

<style>
	.results {
		display: grid;
		/* minmax(0, …) lets wide content shrink instead of widening the page. */
		grid-template-columns: minmax(0, 1fr);
		gap: 2rem;
	}

	.results :global(h3) {
		font-size: 1.2rem;
		margin: 0 0 0.75rem;
	}

	.reminder {
		padding: 1rem 1.25rem;
		border-radius: var(--radius);
		background: var(--color-surface);
		font-style: italic;
	}
</style>
