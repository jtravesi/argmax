<script lang="ts">
	import 'katex/dist/katex.min.css';
	import { t } from '#lib/i18n/index.js';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{t.pages.model.title}</title>
</svelte:head>

<div class="layout">
	<nav aria-labelledby="toc-heading" class="toc">
		<h2 id="toc-heading">{t.model.contents}</h2>
		<ol>
			{#each data.toc as entry (entry.id)}
				<li class="level-{entry.level}"><a href="#{entry.id}">{entry.text}</a></li>
			{/each}
		</ol>
	</nav>

	<article class="prose">
		<!-- CLAUDE.md rule 6: the only allowed {@html}, generated from docs/MODEL.md at build time. -->
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html data.html}
	</article>
</div>

<style>
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1.5rem;
	}

	.toc h2 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
	}

	.toc ol {
		margin: 0;
		padding: 0;
		list-style: none;
		font-size: 0.92rem;
	}

	.toc li {
		margin: 0.2rem 0;
	}

	.toc .level-3 {
		padding-left: 1rem;
	}

	.toc a {
		color: var(--color-fg);
		text-decoration: none;
	}

	.toc a:hover {
		text-decoration: underline;
	}

	/* Wide screens: the table of contents sits beside the text and stays in view. */
	@media (min-width: 64rem) {
		.layout {
			grid-template-columns: 15rem minmax(0, 1fr);
			gap: 2.5rem;
		}

		.toc {
			position: sticky;
			top: 4rem;
			align-self: start;
			max-height: calc(100vh - 5rem);
			overflow-y: auto;
		}
	}

	@media (max-width: 63.99rem) {
		.toc {
			padding: 0.75rem 1rem;
			border: 1px solid var(--color-border);
			border-radius: var(--radius);
		}
	}

	.prose {
		max-width: 46rem;
		line-height: 1.65;
	}

	.prose :global(h1) {
		margin-top: 0;
	}

	.prose :global(blockquote) {
		margin: 1rem 0;
		padding: 0.5rem 1rem;
		border-left: 4px solid var(--color-border);
		color: var(--color-muted);
	}

	/* Long formulas scroll on their own instead of widening the page. */
	.prose :global(.katex-display) {
		overflow-x: auto;
		overflow-y: hidden;
		padding: 0.25rem 0;
	}

	.prose :global(table) {
		display: block;
		overflow-x: auto;
	}

	.prose :global(hr) {
		border: 0;
		border-top: 1px solid var(--color-border);
		margin: 2rem 0;
	}
</style>
