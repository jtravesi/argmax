<script lang="ts">
	import { toPercentInput } from '#lib/format.js';

	// A fraction entered as a whole percentage, with a slider and a number field
	// kept in sync (SPEC.md §3.1, steps 2 and 4). The model stores the fraction.
	let {
		id,
		label,
		value,
		invalid = false,
		disabled = false,
		onchange
	}: {
		id: string;
		label: string;
		value: number;
		invalid?: boolean;
		disabled?: boolean;
		onchange: (fraction: number) => void;
	} = $props();

	const percent = $derived(toPercentInput(value));
	const set = (e: Event & { currentTarget: HTMLInputElement }) =>
		onchange(e.currentTarget.valueAsNumber / 100);
</script>

<div class="percent">
	<input
		type="range"
		min="0"
		max="100"
		step="1"
		value={Number.isFinite(percent) ? percent : 0}
		aria-label={label}
		{disabled}
		oninput={set}
	/>
	<input
		{id}
		type="number"
		min="0"
		max="100"
		step="1"
		inputmode="numeric"
		value={percent}
		aria-label={label}
		aria-invalid={invalid}
		{disabled}
		oninput={set}
	/>
</div>

<style>
	.percent {
		display: grid;
		grid-template-columns: 1fr 5rem;
		gap: 0.5rem;
		align-items: center;
	}
</style>
