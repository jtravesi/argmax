<script lang="ts">
	import { t } from '#lib/i18n/index.js';
	import { TEMPLATES, type Template } from '#lib/templates/index.js';

	// SPEC.md §4: new model, load template, export, import and share.
	let {
		canExport,
		onnew,
		onload,
		onimport,
		onexport,
		onshare
	}: {
		canExport: boolean;
		onnew: () => void;
		onload: (template: Template) => void;
		onimport: (file: File) => void;
		onexport: () => void;
		onshare: () => void;
	} = $props();

	let menuOpen = $state(false);
	let fileInput: HTMLInputElement | undefined = $state();

	function choose(template: Template) {
		menuOpen = false;
		onload(template);
	}

	function picked(e: Event & { currentTarget: HTMLInputElement }) {
		const file = e.currentTarget.files?.[0];
		e.currentTarget.value = ''; // so the same file can be picked again
		if (file) onimport(file);
	}
</script>

<div class="toolbar" role="toolbar" aria-label={t.app.toolbar}>
	<button type="button" onclick={onnew}>{t.app.newModel}</button>

	<details class="menu" bind:open={menuOpen}>
		<summary>{t.app.loadTemplate}</summary>
		<ul>
			{#each TEMPLATES as template (template.id)}
				<li><button type="button" onclick={() => choose(template)}>{template.title}</button></li>
			{/each}
		</ul>
	</details>

	<button type="button" onclick={() => fileInput?.click()}>{t.app.importJson}</button>
	<input
		bind:this={fileInput}
		type="file"
		accept="application/json,.json"
		class="sr-only"
		tabindex="-1"
		aria-hidden="true"
		onchange={picked}
	/>
	<button type="button" disabled={!canExport} onclick={onexport}>{t.app.exportJson}</button>
	<button type="button" disabled={!canExport} onclick={onshare}>{t.app.share}</button>
</div>

<style>
	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: flex-start;
	}

	.menu {
		position: relative;
	}

	summary {
		padding: 0.4rem 0.8rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-surface);
		cursor: pointer;
		list-style-position: inside;
	}

	.menu ul {
		position: absolute;
		z-index: 5;
		min-width: 16rem;
		margin: 0.25rem 0 0;
		padding: 0.25rem;
		list-style: none;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-bg);
		box-shadow: 0 4px 12px rgb(0 0 0 / 0.15);
	}

	.menu li button {
		width: 100%;
		text-align: left;
		border: 0;
		background: none;
	}

	.menu li button:hover {
		background: var(--color-surface);
	}
</style>
