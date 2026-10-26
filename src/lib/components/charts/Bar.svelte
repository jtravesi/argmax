<script lang="ts">
	// One horizontal bar on a fixed 0–10 scale. Decorative: the value is always
	// shown as text next to it.
	let { value, max = 10 }: { value: number; max?: number } = $props();
	const width = $derived(Math.max(0, Math.min(1, value / max)) * 100);
</script>

<svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">
	<rect x="0" y="0" width="100" height="10" class="track" />
	<rect x="0" y="0" {width} height="10" class="bar" />
	<line x1="50" x2="50" y1="0" y2="10" class="mid" />
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: 1rem;
	}

	.track {
		fill: var(--color-surface);
	}

	.bar {
		fill: var(--color-bar);
	}

	.mid {
		stroke: var(--color-border);
		stroke-width: 0.4;
		vector-effect: non-scaling-stroke;
	}
</style>
