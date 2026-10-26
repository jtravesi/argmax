<script lang="ts">
	import { onMount } from 'svelte';
	import Wizard from '#lib/components/wizard/Wizard.svelte';
	import { t } from '#lib/i18n/index.js';
	import { blankModel } from '#lib/model/edit.js';
	import { clearSaved, loadSaved, save } from '#lib/persistence/local.js';
	import { Editor } from '#lib/stores/editor.svelte.js';
	import { careerTemplate } from '#lib/templates/index.js';

	const editor = new Editor();
	let restored = $state(false);
	let storageUnavailable = $state(false);
	let savedInvalid = $state(false);

	const errorCount = $derived(editor.issues.filter((i) => i.severity === 'error').length);
	const isBlank = () =>
		JSON.stringify($state.snapshot(editor.model)) === JSON.stringify(blankModel());

	onMount(() => {
		const saved = loadSaved();
		if (saved.status === 'ok') editor.model = saved.model;
		else if (saved.status === 'unavailable') storageUnavailable = true;
		else if (saved.status === 'invalid') savedInvalid = true;
		restored = true;
	});

	// Autosave with debounce, only models that pass parseModel (SPEC.md §4).
	$effect(() => {
		if (!restored || !editor.parsed.ok) return;
		const model = editor.parsed.value;
		const timer = setTimeout(() => {
			if (!save(model)) storageUnavailable = true;
		}, 400);
		return () => clearTimeout(timer);
	});

	function newModel() {
		if (!isBlank() && !confirm(t.app.confirmNew)) return;
		clearSaved();
		editor.replace(blankModel());
	}

	function loadExample() {
		if (!isBlank() && !confirm(t.app.confirmExample)) return;
		editor.replace(careerTemplate());
	}
</script>

<svelte:head>
	<title>{t.pages.app.title}</title>
</svelte:head>

<h1>{editor.model.title || t.pages.app.heading}</h1>

<div class="toolbar" role="toolbar" aria-label={t.app.toolbar}>
	<button type="button" onclick={newModel}>{t.app.newModel}</button>
	<button type="button" onclick={loadExample}>{t.app.loadExample}</button>
</div>

<p class="status">
	{#if storageUnavailable}
		<span class="warn">{t.app.storageUnavailable}</span>
	{:else if editor.valid}
		{t.app.saved}
	{:else}
		{t.app.notSaved(errorCount)}
	{/if}
	{#if savedInvalid}
		<span class="warn">{t.app.savedInvalid}</span>
	{/if}
</p>

<Wizard {editor} />

<style>
	h1 {
		margin-top: 0;
		overflow-wrap: anywhere;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.status {
		margin: 0.75rem 0 1.5rem;
		color: var(--color-muted);
		font-size: 0.9rem;
	}

	.warn {
		display: block;
		color: var(--color-warn);
	}
</style>
