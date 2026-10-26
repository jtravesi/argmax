<script lang="ts">
	import type { Analysis } from '#lib/core/index.js';
	import { t } from '#lib/i18n/index.js';
	import type { Editor } from '#lib/stores/editor.svelte.js';
	import Breakdown from './Breakdown.svelte';
	import Ranking from './Ranking.svelte';
	import Risk from './Risk.svelte';
	import Verdict from './Verdict.svelte';

	// SPEC.md §3.2, items 1–4 and 9. Items 5–8 come with M4 (sensitivity).
	let { analysis, editor }: { analysis: Analysis; editor: Editor } = $props();
</script>

<div class="results">
	<Verdict {analysis} model={editor.model} />
	<Ranking {analysis} />
	<Breakdown {analysis} />
	<Risk {analysis} {editor} />
	<p class="reminder">{t.results.reminder}</p>
</div>

<style>
	.results {
		display: grid;
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
