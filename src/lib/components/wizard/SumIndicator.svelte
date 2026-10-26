<script lang="ts">
	import { SUM_TOLERANCE } from '#lib/core/index.js';
	import { t } from '#lib/i18n/index.js';

	// Live sum of raw percentages: green at 100 (within MODEL.md §7's tolerance), amber otherwise.
	let { sum, onnormalize }: { sum: number | null; onnormalize: () => void } = $props();

	const ok = $derived(sum !== null && Math.abs(sum - 1) <= SUM_TOLERANCE);
	const canNormalize = $derived(sum !== null && sum > 0 && !ok);
</script>

<div class="sum" class:ok class:off={!ok} role="status">
	<span>
		{sum === null ? t.wizard.sumUnknown : t.wizard.sum(Math.round(sum * 100))}
		<span class="sr-only">({ok ? t.wizard.sumOk : t.wizard.sumOff})</span>
	</span>
	{#if canNormalize}
		<button type="button" onclick={onnormalize}>{t.wizard.normalize}</button>
	{/if}
</div>

<style>
	.sum {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		align-items: center;
		padding: 0.4rem 0.75rem;
		border-left: 4px solid;
		background: var(--color-surface);
		font-variant-numeric: tabular-nums;
	}

	.ok {
		border-color: var(--color-ok);
	}

	.ok span:first-child {
		color: var(--color-ok);
	}

	.off {
		border-color: var(--color-warn);
	}

	.off span:first-child {
		color: var(--color-warn);
	}
</style>
