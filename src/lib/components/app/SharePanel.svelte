<script lang="ts">
	import { t } from '#lib/i18n/index.js';

	// SPEC.md §4: the link and the warning that it carries the whole model.
	let { share, onclose }: { share: { url: string } | { error: string }; onclose: () => void } =
		$props();

	const url = $derived('url' in share ? share.url : null);

	let input: HTMLInputElement | undefined = $state();
	let heading: HTMLElement | undefined = $state();
	let status = $state('');

	$effect(() => heading?.focus());

	async function copy() {
		if (!url) return;
		try {
			await navigator.clipboard.writeText(url);
			status = t.app.copied;
		} catch {
			input?.select();
			status = t.app.copyFailed;
		}
	}
</script>

<section class="panel" aria-labelledby="share-heading">
	<h2 id="share-heading" tabindex="-1" bind:this={heading}>{t.app.shareHeading}</h2>
	{#if url}
		<p class="warning"><strong>{t.app.shareWarning}</strong></p>
		<label for="share-url">{t.app.shareLink}</label>
		<div class="row">
			<input
				id="share-url"
				type="text"
				readonly
				value={url}
				bind:this={input}
				onfocus={(e) => e.currentTarget.select()}
			/>
			<button type="button" class="primary" onclick={copy}>{t.app.copy}</button>
		</div>
		<p role="status">{status}</p>
	{:else if 'error' in share}
		<p>{share.error}</p>
	{/if}
	<button type="button" onclick={onclose}>{t.app.close}</button>
</section>

<style>
	.panel {
		margin: 1rem 0;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-left: 6px solid var(--color-warn);
		border-radius: var(--radius);
		background: var(--color-surface);
	}

	h2 {
		margin: 0 0 0.5rem;
		font-size: 1.15rem;
	}

	.warning {
		color: var(--color-warn);
	}

	label {
		display: block;
		font-weight: 600;
	}

	.row {
		display: grid;
		grid-template-columns: minmax(0, 1fr) auto;
		gap: 0.5rem;
		margin-top: 0.25rem;
	}

	[role='status'] {
		min-height: 1.5em;
		margin: 0.25rem 0 0.5rem;
	}
</style>
