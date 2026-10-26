<script lang="ts">
	import { LIMITS } from '#lib/core/index.js';
	import { t } from '#lib/i18n/index.js';
	import {
		addAlternative,
		canAddAlternative,
		canRemoveAlternative,
		removeAlternative
	} from '#lib/model/edit.js';
	import type { Editor } from '#lib/stores/editor.svelte.js';

	let { editor }: { editor: Editor } = $props();
	const m = $derived(editor.model);
	const label = (name: string, i: number) => (name ? t.quoted(name) : t.unnamed.alternative(i + 1));
</script>

<p class="help">{t.wizard.alternatives.help}</p>

<ol class="rows">
	{#each m.alternatives as alt, i (alt.id)}
		<li>
			<label for="f-{alt.id}-name" class="sr-only">{t.wizard.alternatives.nameOf(i + 1)}</label>
			<input
				id="f-{alt.id}-name"
				type="text"
				maxlength={LIMITS.name}
				placeholder={t.unnamed.alternative(i + 1)}
				aria-invalid={editor.hasError('alternatives', i, 'name')}
				bind:value={alt.name}
			/>
			<button
				type="button"
				disabled={!canRemoveAlternative(m)}
				aria-label={t.wizard.alternatives.removeOf(label(alt.name, i))}
				onclick={() => removeAlternative(m, alt.id)}>{t.wizard.remove}</button
			>
		</li>
	{/each}
</ol>

<div class="actions">
	<button type="button" disabled={!canAddAlternative(m)} onclick={() => addAlternative(m)}
		>{t.wizard.alternatives.add}</button
	>
	<span class="help">{t.wizard.alternatives.limit}</span>
</div>

<style>
	.rows {
		display: grid;
		gap: 0.5rem;
		margin: 1rem 0;
		padding: 0;
		list-style: none;
	}

	.rows li {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.5rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}
</style>
