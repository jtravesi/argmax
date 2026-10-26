<script lang="ts">
	// Tornado (MODEL.md §5.4): one bar [min G, max G] per input, on a shared scale
	// that always includes 0. Bars that cross 0 can change the winner.
	let {
		rows,
		baseline,
		label
	}: {
		rows: { key: string; label: string; min: number; max: number }[];
		baseline: number;
		label: string;
	} = $props();

	const domain = $derived.by(() => {
		let lo = Math.min(0, baseline, ...rows.map((r) => r.min));
		let hi = Math.max(0, baseline, ...rows.map((r) => r.max));
		const pad = (hi - lo || 1) * 0.05;
		lo -= pad;
		hi += pad;
		return { lo, hi };
	});
	const x = (v: number) => ((v - domain.lo) / (domain.hi - domain.lo)) * 100;
</script>

<div class="chart" role="img" aria-label={label}>
	{#each rows as row (row.key)}
		<div class="row">
			<span class="label">{row.label}</span>
			<svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">
				<line x1={x(0)} x2={x(0)} y1="0" y2="10" class="zero" />
				<line x1={x(baseline)} x2={x(baseline)} y1="0" y2="10" class="baseline" />
				<rect
					x={x(row.min)}
					y="2"
					width={Math.max(0.4, x(row.max) - x(row.min))}
					height="6"
					class:crosses={row.min < 0}
				/>
			</svg>
		</div>
	{/each}
</div>

<style>
	.chart {
		display: grid;
		gap: 0.25rem;
	}

	.row {
		display: grid;
		grid-template-columns: minmax(8rem, 35%) 1fr;
		gap: 0.75rem;
		align-items: center;
	}

	.label {
		font-size: 0.88rem;
		overflow-wrap: break-word;
	}

	svg {
		display: block;
		width: 100%;
		height: 1.1rem;
	}

	rect {
		fill: var(--color-bar);
	}

	rect.crosses {
		fill: var(--color-warn);
	}

	.zero {
		stroke: var(--color-fg);
		stroke-width: 1.5;
		vector-effect: non-scaling-stroke;
	}

	.baseline {
		stroke: var(--color-muted);
		stroke-width: 1;
		stroke-dasharray: 2 2;
		vector-effect: non-scaling-stroke;
	}

	@media (max-width: 39.99rem) {
		.row {
			grid-template-columns: 1fr;
			gap: 0.1rem;
		}
	}
</style>
