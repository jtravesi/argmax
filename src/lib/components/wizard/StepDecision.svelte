<script lang="ts">
	import { LIMITS } from '#lib/core/index.js';
	import { t } from '#lib/i18n/index.js';
	import type { Editor } from '#lib/stores/editor.svelte.js';

	let { editor }: { editor: Editor } = $props();
	const m = $derived(editor.model);
</script>

<p class="help">{t.wizard.decision.help}</p>

<div class="field">
	<label for="f-title">{t.wizard.decision.title}</label>
	<input
		id="f-title"
		type="text"
		required
		maxlength={LIMITS.title}
		placeholder={t.wizard.decision.titlePlaceholder}
		aria-invalid={editor.hasError('title')}
		bind:value={m.title}
	/>
</div>

<div class="field">
	<label for="f-description">{t.wizard.decision.description}</label>
	<textarea
		id="f-description"
		rows="3"
		maxlength={LIMITS.description}
		value={m.description ?? ''}
		oninput={(e) => {
			const v = e.currentTarget.value;
			if (v) m.description = v;
			else delete m.description;
		}}></textarea>
</div>

<div class="field">
	<label for="f-horizon">{t.wizard.decision.horizon}</label>
	<input
		id="f-horizon"
		type="text"
		maxlength={LIMITS.horizon}
		placeholder={t.wizard.decision.horizonPlaceholder}
		value={m.horizon ?? ''}
		oninput={(e) => {
			const v = e.currentTarget.value;
			if (v) m.horizon = v;
			else delete m.horizon;
		}}
	/>
</div>

<style>
	.field {
		display: grid;
		gap: 0.25rem;
		margin-bottom: 1rem;
	}

	label {
		font-weight: 600;
	}
</style>
