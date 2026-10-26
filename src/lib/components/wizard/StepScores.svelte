<script lang="ts">
	import { liveStateUtility } from '#lib/core/index.js';
	import { formatUtility } from '#lib/format.js';
	import { t } from '#lib/i18n/index.js';
	import type { Editor } from '#lib/stores/editor.svelte.js';

	let { editor }: { editor: Editor } = $props();
	const m = $derived(editor.model);
	const name = (n: string, fallback: string) => (n ? t.quoted(n) : fallback);
</script>

<p class="help">{t.wizard.scores.help}</p>
<p class="scale" role="note">{t.wizard.scores.scale}</p>

{#if m.dimensions.length === 0}
	<p>{t.wizard.scores.noDimensions}</p>
{:else}
	{#each m.alternatives as alt, a (alt.id)}
		{@const altName = name(alt.name, t.unnamed.alternative(a + 1))}
		<section aria-labelledby="scores-{alt.id}">
			<h3 id="scores-{alt.id}">{altName}</h3>
			{#if alt.states.length === 0}
				<p>{t.wizard.scores.noStates}</p>
			{:else}
				<table>
					<thead>
						<tr>
							<th scope="col">{t.wizard.scores.state}</th>
							{#each m.dimensions as dim, k (dim.id)}
								<th scope="col">{dim.name || t.unnamed.dimension(k + 1)}</th>
							{/each}
							<th scope="col" class="num"
								><abbr title={t.wizard.scores.utilityLong}>{t.wizard.scores.utility}</abbr></th
							>
						</tr>
					</thead>
					<tbody>
						{#each alt.states as state, j (state.id)}
							{@const stateName = name(state.name, t.unnamed.state(j + 1))}
							{@const u = liveStateUtility(m, state)}
							<tr>
								<th scope="row">{state.name || t.unnamed.state(j + 1)}</th>
								{#each m.dimensions as dim, k (dim.id)}
									{@const dimName = name(dim.name, t.unnamed.dimension(k + 1))}
									<td>
										<label for="f-{alt.id}-{state.id}-{dim.id}" class="cell-label"
											>{dim.name || t.unnamed.dimension(k + 1)}</label
										>
										<input
											id="f-{alt.id}-{state.id}-{dim.id}"
											type="number"
											min="0"
											max="10"
											step="0.5"
											inputmode="decimal"
											value={state.scores[dim.id]}
											aria-label={t.wizard.scores.scoreOf(stateName, dimName)}
											aria-invalid={editor.hasError(
												'alternatives',
												a,
												'states',
												j,
												'scores',
												dim.id
											)}
											oninput={(e) => (state.scores[dim.id] = e.currentTarget.valueAsNumber)}
										/>
									</td>
								{/each}
								<td class="num utility">
									<span class="cell-label">{t.wizard.scores.utilityLong}</span>
									<output>{u === null ? '—' : formatUtility(u)}</output>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</section>
	{/each}
{/if}

<style>
	.scale {
		position: sticky;
		top: 3.25rem;
		z-index: 1;
		margin: 0.5rem 0 1rem;
		padding: 0.4rem 0.75rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		font-weight: 600;
	}

	section {
		margin-bottom: 1.5rem;
	}

	h3 {
		font-size: 1.05rem;
	}

	td input {
		width: 4.5rem;
	}

	.utility output {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	/* Wide screens: a table; the per-cell labels are only for assistive technology. */
	@media (min-width: 40rem) {
		.cell-label {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
			white-space: nowrap;
		}
	}

	/* Narrow screens: one card per state with one control per dimension (SPEC.md §3.1). */
	@media (max-width: 39.99rem) {
		thead {
			position: absolute;
			width: 1px;
			height: 1px;
			overflow: hidden;
			clip: rect(0, 0, 0, 0);
		}

		table,
		tbody,
		tr,
		th,
		td {
			display: block;
		}

		tr {
			margin-bottom: 0.75rem;
			padding: 0.5rem 0.75rem;
			border: 1px solid var(--color-border);
			border-radius: var(--radius);
		}

		tbody th {
			border: 0;
			padding: 0.25rem 0;
			font-size: 1.05rem;
		}

		td {
			display: flex;
			justify-content: space-between;
			align-items: center;
			gap: 0.75rem;
			padding: 0.3rem 0;
		}

		td.num {
			text-align: left;
		}
	}
</style>
