<script lang="ts">
	import { LIMITS } from '#lib/core/index.js';
	import { t } from '#lib/i18n/index.js';
	import {
		addState,
		canAddState,
		normalizeProbabilities,
		rawSum,
		removeState
	} from '#lib/model/edit.js';
	import type { Editor } from '#lib/stores/editor.svelte.js';
	import PercentInput from './PercentInput.svelte';
	import SumIndicator from './SumIndicator.svelte';

	let { editor }: { editor: Editor } = $props();
	const m = $derived(editor.model);
	const altLabel = (name: string, i: number) =>
		name ? t.quoted(name) : t.unnamed.alternative(i + 1);
	const stateLabel = (name: string, j: number) => (name ? t.quoted(name) : t.unnamed.state(j + 1));
</script>

{#each t.wizard.states.help as paragraph (paragraph)}
	<p class="help">{paragraph}</p>
{/each}

{#each m.alternatives as alt, a (alt.id)}
	{@const altName = altLabel(alt.name, a)}
	<details
		open
		class:has-errors={editor
			.issuesFor('states')
			.some((i) => i.key.startsWith(`alternatives.${a}`) && i.severity === 'error')}
	>
		<summary><h3>{altName}</h3></summary>

		{#if alt.states.length === 0}
			<p>{t.wizard.states.empty}</p>
		{:else}
			<ol class="rows">
				{#each alt.states as state, j (state.id)}
					<li>
						<div class="name">
							<label for="f-{alt.id}-{state.id}-name" class="sr-only"
								>{t.wizard.states.nameOf(j + 1, altName)}</label
							>
							<input
								id="f-{alt.id}-{state.id}-name"
								type="text"
								maxlength={LIMITS.name}
								placeholder={t.unnamed.state(j + 1)}
								aria-invalid={editor.hasError('alternatives', a, 'states', j, 'name')}
								bind:value={state.name}
							/>
							<button
								type="button"
								aria-label={t.wizard.states.removeOf(stateLabel(state.name, j))}
								onclick={() => removeState(m, alt.id, state.id)}>{t.wizard.remove}</button
							>
						</div>
						<PercentInput
							id="f-{alt.id}-{state.id}-probability"
							label={t.wizard.states.probabilityOf(stateLabel(state.name, j))}
							value={state.probability}
							invalid={editor.hasError('alternatives', a, 'states', j, 'probability')}
							onchange={(p) => (state.probability = p)}
						/>
					</li>
				{/each}
			</ol>
			<SumIndicator
				sum={rawSum(alt.states.map((s) => s.probability))}
				onnormalize={() => normalizeProbabilities(m, alt.id)}
			/>
		{/if}

		<div class="actions">
			<button type="button" disabled={!canAddState(m, alt.id)} onclick={() => addState(m, alt.id)}
				>{t.wizard.states.add}</button
			>
			<span class="help">{t.wizard.states.limit}</span>
		</div>
	</details>
{/each}

<style>
	details {
		margin: 1rem 0;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	details.has-errors {
		border-left: 4px solid var(--color-error);
	}

	summary {
		cursor: pointer;
	}

	summary h3 {
		display: inline;
		font-size: 1.05rem;
	}

	.rows {
		display: grid;
		gap: 0.75rem;
		margin: 1rem 0;
		padding: 0;
		list-style: none;
	}

	.rows li {
		display: grid;
		gap: 0.5rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-border);
	}

	.name {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.5rem;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
		margin: 0.75rem 0 0.25rem;
	}
</style>
