<script lang="ts">
	import { rank, type DecisionModel, type NormalizedModel } from '#lib/core/index.js';
	import { t } from '#lib/i18n/index.js';
	import { moveProbability, moveWeight } from '#lib/model/whatif.js';
	import type { Editor } from '#lib/stores/editor.svelte.js';
	import PercentInput from '../wizard/PercentInput.svelte';
	import RankingTable from './RankingTable.svelte';

	// SPEC.md §3.2, item 6: sliders for every weight and probability that recompute
	// a "what if" ranking live, without changing the saved model.
	let { editor, base, model }: { editor: Editor; base: NormalizedModel; model: DecisionModel } =
		$props();

	const current = $derived(editor.whatIf ?? base);
	const ranking = $derived(rank(current));
	const baseWinner = $derived(rank(base)[0].altId);

	const nameOf = (id: string) => base.alternatives.find((a) => a.id === id)?.name ?? id;
	const dimName = (id: string) => model.dimensions.find((d) => d.id === id)?.name ?? id;
	const valid = (x: number) => x >= 0 && x <= 1;

	function setWeight(dimId: string, w: number) {
		if (!valid(w)) return;
		const moved = moveWeight(current, base, dimId, w);
		if (moved) editor.setWhatIf(moved);
	}

	function setProbability(altId: string, stateId: string, q: number) {
		if (!valid(q)) return;
		const moved = moveProbability(current, base, altId, stateId, q);
		if (moved) editor.setWhatIf(moved);
	}
</script>

<section aria-labelledby="whatif-heading">
	<h3 id="whatif-heading">{t.results.whatIf}</h3>
	<p class="help">{t.results.whatIfHelp}</p>

	<div class="layout">
		<div class="controls">
			<fieldset>
				<legend>{t.results.whatIfWeights}</legend>
				{#each current.dimensionIds as dimId (dimId)}
					<div class="slider">
						<label for="wi-{dimId}">{dimName(dimId)}</label>
						<PercentInput
							id="wi-{dimId}"
							label={t.results.weightOf(dimName(dimId))}
							value={current.weights.get(dimId) ?? 0}
							disabled={current.dimensionIds.length === 1}
							onchange={(w) => setWeight(dimId, w)}
						/>
					</div>
				{/each}
			</fieldset>

			{#each current.alternatives as alt (alt.id)}
				{#if alt.states.length > 1}
					<details>
						<summary>{t.results.whatIfProbabilities(alt.name)}</summary>
						{#each alt.states as s (s.id)}
							<div class="slider">
								<label for="wi-{alt.id}-{s.id}">{s.name}</label>
								<PercentInput
									id="wi-{alt.id}-{s.id}"
									label={t.results.probabilityOf(s.name, alt.name)}
									value={s.probability}
									onchange={(q) => setProbability(alt.id, s.id, q)}
								/>
							</div>
						{/each}
					</details>
				{/if}
			{/each}
		</div>

		<div class="outcome">
			<h4>{t.results.whatIfRanking}</h4>
			<RankingTable {ranking} {nameOf} caption={t.results.whatIfRanking} />
			<p class="verdict" role="status">
				{ranking[0].altId === baseWinner
					? t.results.whatIfSame
					: t.results.whatIfChanged(nameOf(ranking[0].altId))}
			</p>
			<button type="button" disabled={!editor.whatIfActive} onclick={() => editor.setWhatIf(null)}
				>{t.results.reset}</button
			>
		</div>
	</div>
</section>

<style>
	.layout {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1.5rem;
	}

	@media (min-width: 52rem) {
		.layout {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}

		.outcome {
			position: sticky;
			top: 4rem;
			align-self: start;
		}
	}

	fieldset {
		margin: 0 0 1rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	legend {
		font-weight: 600;
	}

	details {
		margin-bottom: 0.75rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
	}

	summary {
		cursor: pointer;
		font-weight: 600;
	}

	.slider {
		margin: 0.5rem 0;
	}

	.slider label {
		display: block;
		font-size: 0.92rem;
		overflow-wrap: break-word;
	}

	h4 {
		margin: 0 0 0.5rem;
	}

	.verdict {
		font-weight: 600;
	}
</style>
