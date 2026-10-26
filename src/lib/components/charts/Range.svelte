<script lang="ts">
	// Worst case – expected utility – best case on a fixed 0–10 scale, with the
	// threshold τ marked. Decorative: the same values are in the risk table.
	let { min, mean, max, tau }: { min: number; mean: number; max: number; tau: number } = $props();
	const x = (v: number) => (Math.max(0, Math.min(10, v)) / 10) * 100;
</script>

<svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">
	<rect x="0" y="0" width="100" height="10" class="track" />
	<line x1={x(tau)} x2={x(tau)} y1="0" y2="10" class="tau" />
	<rect x={x(min)} y="3.5" width={Math.max(0.5, x(max) - x(min))} height="3" class="range" />
	<rect x={x(mean) - 0.6} y="0.5" width="1.2" height="9" class="mean" />
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

	.range {
		fill: var(--color-muted);
	}

	.mean {
		fill: var(--color-bar);
	}

	.tau {
		stroke: var(--color-warn);
		stroke-width: 2;
		stroke-dasharray: 3 2;
		vector-effect: non-scaling-stroke;
	}
</style>
