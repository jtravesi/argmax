<script lang="ts">
	import { onMount } from 'svelte';
	import SharePanel from '#lib/components/app/SharePanel.svelte';
	import Toolbar from '#lib/components/app/Toolbar.svelte';
	import Wizard from '#lib/components/wizard/Wizard.svelte';
	import type { DecisionModel, Issue } from '#lib/core/index.js';
	import { t } from '#lib/i18n/index.js';
	import { describeIssue } from '#lib/i18n/issues.js';
	import { blankModel } from '#lib/model/edit.js';
	import { exportFileName, exportText, readModelFile } from '#lib/persistence/file.js';
	import { clearSaved, loadSaved, save } from '#lib/persistence/local.js';
	import {
		decodeShare,
		encodeShare,
		MAX_FRAGMENT,
		payloadFromHash,
		shareUrl
	} from '#lib/persistence/share.js';
	import { Editor } from '#lib/stores/editor.svelte.js';
	import { findTemplate, type Template } from '#lib/templates/index.js';
	import { resolve } from '$app/paths';
	import { replaceState } from '$app/navigation';

	const MAX_LISTED_ISSUES = 8;

	const editor = new Editor();
	let restored = $state(false);
	let storageUnavailable = $state(false);
	let savedInvalid = $state(false);
	/** A message after import or opening a link; issues are already phrased. */
	let notice = $state<{ text: string; issues: string[]; error: boolean } | null>(null);
	/** A shared model waiting for the user to choose replace or view (SPEC.md §4). */
	let pendingShared = $state<DecisionModel | null>(null);
	let shareOpen = $state(false);
	/** Always the link to the current model, so it can never be stale (SPEC.md §4). */
	const share = $derived.by((): { url: string } | { error: string } => {
		if (!editor.parsed.ok) return { error: t.app.shareNotValid };
		const model = editor.parsed.value;
		if (encodeShare(model).length > MAX_FRAGMENT) return { error: t.app.shareTooLarge };
		return { url: shareUrl(model, location.href) };
	});
	let promptHeading: HTMLElement | undefined = $state();

	// Bring the choice to the user's attention, including screen readers.
	$effect(() => {
		if (pendingShared) promptHeading?.focus();
	});

	const errorCount = $derived(editor.issues.filter((i) => i.severity === 'error').length);
	const same = (a: DecisionModel, b: DecisionModel) => JSON.stringify(a) === JSON.stringify(b);
	const current = () => $state.snapshot(editor.model) as DecisionModel;
	const isBlank = () => same(current(), blankModel());

	function describeAll(issues: Issue[]): string[] {
		const blank = blankModel();
		const lines = issues.slice(0, MAX_LISTED_ISSUES).map((i) => describeIssue(i, blank));
		if (issues.length > MAX_LISTED_ISSUES) {
			lines.push(t.app.moreIssues(issues.length - MAX_LISTED_ISSUES));
		}
		return lines;
	}

	/** Handles #m=… on load and when the fragment changes later. */
	function openSharedFromHash(saved: DecisionModel | null) {
		const payload = payloadFromHash(location.hash);
		if (payload === null) return;
		replaceState(resolve('/app'), {}); // the model should not linger in the address bar
		const result = decodeShare(payload);
		if (!result.ok) {
			const e = result.error;
			notice =
				e.reason === 'invalid'
					? { text: t.app.sharedInvalid, issues: describeAll(e.issues), error: true }
					: {
							text: e.reason === 'too-large' ? t.app.sharedTooLarge : t.app.sharedCorrupt,
							issues: [],
							error: true
						};
			return;
		}
		if (saved && !same(saved, result.value)) pendingShared = result.value;
		else editor.replace(result.value, { step: 'results' });
	}

	onMount(() => {
		const saved = loadSaved();
		if (saved.status === 'ok') editor.model = saved.model;
		else if (saved.status === 'unavailable') storageUnavailable = true;
		else if (saved.status === 'invalid') savedInvalid = true;

		// /app?template=<id>, from the home page. Never replace a saved model silently.
		const templateId = new URL(location.href).searchParams.get('template');
		const template = templateId ? findTemplate(templateId) : undefined;
		if (template && (saved.status !== 'ok' || confirm(t.app.confirmLoad(template.title)))) {
			editor.replace(template.create());
		}
		if (templateId !== null) replaceState(resolve('/app'), {});

		openSharedFromHash(saved.status === 'ok' ? saved.model : null);
		restored = true;

		const onHashChange = () => openSharedFromHash(isBlank() ? null : current());
		window.addEventListener('hashchange', onHashChange);
		return () => window.removeEventListener('hashchange', onHashChange);
	});

	// Autosave with debounce, only models that pass parseModel (SPEC.md §4), never in read-only.
	$effect(() => {
		if (!restored || editor.readOnly || !editor.parsed.ok) return;
		const model = editor.parsed.value;
		const timer = setTimeout(() => {
			if (!save(model)) storageUnavailable = true;
		}, 400);
		return () => clearTimeout(timer);
	});

	function newModel() {
		if (!isBlank() && !confirm(t.app.confirmNew)) return;
		if (!editor.readOnly) clearSaved();
		editor.replace(blankModel());
		notice = null;
	}

	function loadTemplate(template: Template) {
		if (!isBlank() && !confirm(t.app.confirmLoad(template.title))) return;
		editor.replace(template.create());
		notice = null;
	}

	async function importFile(file: File) {
		const result = await readModelFile(file);
		if (!result.ok) {
			const e = result.error;
			notice =
				e.reason === 'invalid'
					? { text: t.app.importInvalid(file.name), issues: describeAll(e.issues), error: true }
					: {
							text: e.reason === 'too-large' ? t.app.importTooLarge : t.app.importUnreadable,
							issues: [],
							error: true
						};
			return;
		}
		if (!isBlank() && !confirm(t.app.confirmImport(result.value.title))) return;
		editor.replace(result.value);
		notice = { text: t.app.imported(result.value.title), issues: [], error: false };
	}

	function exportFile() {
		if (!editor.parsed.ok) return;
		const model = editor.parsed.value;
		const url = URL.createObjectURL(new Blob([exportText(model)], { type: 'application/json' }));
		const link = document.createElement('a');
		link.href = url;
		link.download = exportFileName(model);
		link.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	function backToMine() {
		const saved = loadSaved();
		editor.replace(saved.status === 'ok' ? saved.model : blankModel());
	}
</script>

<svelte:head>
	<title>{t.pages.app.title}</title>
</svelte:head>

<h1>{editor.model.title || t.pages.app.heading}</h1>

<Toolbar
	canExport={editor.parsed.ok}
	onnew={newModel}
	onload={loadTemplate}
	onimport={importFile}
	onexport={exportFile}
	onshare={() => (shareOpen = true)}
/>

{#if shareOpen}
	<SharePanel {share} onclose={() => (shareOpen = false)} />
{/if}

<div aria-live="polite">
	{#if notice}
		<div class="notice" class:error={notice.error}>
			<p>{notice.text}</p>
			{#if notice.issues.length > 0}
				<ul>
					{#each notice.issues as line, i (i)}
						<li>{line}</li>
					{/each}
				</ul>
			{/if}
			<button type="button" class="link" onclick={() => (notice = null)}>{t.app.dismiss}</button>
		</div>
	{/if}
</div>

{#if pendingShared}
	<section class="prompt" aria-labelledby="shared-heading">
		<h2 id="shared-heading" tabindex="-1" bind:this={promptHeading}>{t.app.sharedHeading}</h2>
		<p>{t.app.sharedPrompt(pendingShared.title)}</p>
		<div class="actions">
			<button
				type="button"
				class="primary"
				onclick={() => {
					editor.replace(pendingShared as DecisionModel, { step: 'results' });
					pendingShared = null;
				}}>{t.app.sharedReplace}</button
			>
			<button
				type="button"
				onclick={() => {
					editor.replace(pendingShared as DecisionModel, { step: 'results', readOnly: true });
					pendingShared = null;
				}}>{t.app.sharedView}</button
			>
		</div>
	</section>
{/if}

{#if editor.readOnly}
	<div class="readonly" role="note">
		<p>{t.app.readOnly(editor.model.title)}</p>
		<div class="actions">
			<button type="button" onclick={() => (editor.readOnly = false)}>{t.app.keepShared}</button>
			<button type="button" onclick={backToMine}>{t.app.backToMine}</button>
		</div>
	</div>
{:else}
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
{/if}

<Wizard {editor} />

<style>
	h1 {
		margin-top: 0;
		overflow-wrap: anywhere;
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

	.notice,
	.prompt,
	.readonly {
		margin: 1rem 0;
		padding: 0.75rem 1rem;
		border-left: 6px solid var(--color-accent);
		border-radius: var(--radius);
		background: var(--color-surface);
	}

	.notice.error {
		border-left-color: var(--color-error);
	}

	.readonly,
	.prompt {
		border-left-color: var(--color-warn);
	}

	.notice p,
	.readonly p {
		margin: 0 0 0.5rem;
	}

	.prompt h2 {
		margin: 0 0 0.5rem;
		font-size: 1.15rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
</style>
