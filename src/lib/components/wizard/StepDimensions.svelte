<script lang="ts">
	import { LIMITS } from '#lib/core/index.js';
	import { t } from '#lib/i18n/index.js';
	import {
		addDimension,
		canAddDimension,
		normalizeWeights,
		rawSum,
		removeDimension
	} from '#lib/model/edit.js';
	import type { Editor } from '#lib/stores/editor.svelte.js';
	import PercentInput from './PercentInput.svelte';
	import SumIndicator from './SumIndicator.svelte';

	let { editor }: { editor: Editor } = $props();
	const m = $derived(editor.model);
	const sum = $derived(rawSum(m.dimensions.map((d) => d.weight)));
	const names = $derived(new Set(m.dimensions.map((d) => d.name.trim().toLowerCase())));
	const chips = $derived(t.wizard.dimensions.chips.filter((c) => !names.has(c.toLowerCase())));
	const label = (name: string, i: number) => (name ? t.quoted(name) : t.unnamed.dimension(i + 1));
</script>

{#each t.wizard.dimensions.help as paragraph (paragraph)}
	<p class="help">{paragraph}</p>
{/each}

{#if m.dimensions.length === 0}
	<p>{t.wizard.dimensions.empty}</p>
{:else}
	<ol class="rows">
		{#each m.dimensions as dim, i (dim.id)}
			<li>
				<div class="name">
					<label for="f-{dim.id}-name" class="sr-only">{t.wizard.dimensions.nameOf(i + 1)}</label>
					<input
						id="f-{dim.id}-name"
						type="text"
						maxlength={LIMITS.name}
						placeholder={t.unnamed.dimension(i + 1)}
						aria-invalid={editor.hasError('dimensions', i, 'name')}
						bind:value={dim.name}
					/>
					<button
						type="button"
						aria-label={t.wizard.dimensions.removeOf(label(dim.name, i))}
						onclick={() => removeDimension(m, dim.id)}>{t.wizard.remove}</button
					>
				</div>
				<PercentInput
					id="f-{dim.id}-weight"
					label={t.wizard.dimensions.weightOf(label(dim.name, i))}
					value={dim.weight}
					invalid={editor.hasError('dimensions', i, 'weight')}
					onchange={(w) => (dim.weight = w)}
				/>
			</li>
		{/each}
	</ol>
	<SumIndicator {sum} onnormalize={() => normalizeWeights(m)} />
{/if}

<div class="actions">
	<button type="button" disabled={!canAddDimension(m)} onclick={() => addDimension(m)}
		>{t.wizard.dimensions.add}</button
	>
	<span class="help">{t.wizard.dimensions.limit}</span>
</div>

{#if chips.length > 0 && canAddDimension(m)}
	<div class="chips" role="group" aria-label={t.wizard.dimensions.common}>
		<span class="help">{t.wizard.dimensions.common}:</span>
		{#each chips as chip (chip)}
			<button type="button" class="chip" onclick={() => addDimension(m, chip)}>+ {chip}</button>
		{/each}
	</div>
{/if}

<style>
	.rows {
		display: grid;
		gap: 1rem;
		margin: 1rem 0;
		padding: 0;
		list-style: none;
	}

	.rows li {
		display: grid;
		gap: 0.5rem;
		padding: 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	.name {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.5rem;
	}

	.actions,
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		margin-top: 1rem;
	}

	.chip {
		border-radius: 999px;
		padding: 0.2rem 0.75rem;
	}
</style>
