<script lang="ts">
	// Contributions stacked on a fixed 0–10 scale; their total is the expected utility.
	let {
		segments,
		label,
		max = 10
	}: { segments: { key: string; value: number }[]; label: string; max?: number } = $props();

	const rects = $derived.by(() => {
		let x = 0;
		return segments.map((s, i) => {
			const width = (Math.max(0, s.value) / max) * 100;
			const rect = { key: s.key, x, width, series: (i % 8) + 1 };
			x += width;
			return rect;
		});
	});
</script>

<svg viewBox="0 0 100 10" preserveAspectRatio="none" role="img" aria-label={label}>
	<rect x="0" y="0" width="100" height="10" class="track" />
	{#each rects as r (r.key)}
		<rect
			x={r.x}
			y="0"
			width={r.width}
			height="10"
			style="fill: var(--series-{r.series})"
			class="segment"
		/>
	{/each}
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: 1.25rem;
	}

	.track {
		fill: var(--color-surface);
	}

	.segment {
		stroke: var(--color-bg);
		stroke-width: 1;
		vector-effect: non-scaling-stroke;
	}
</style>
