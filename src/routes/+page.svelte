<script lang="ts">
	import { t } from '#lib/i18n/index.js';
	import { TEMPLATES } from '#lib/templates/index.js';
	import { resolve } from '$app/paths';
</script>

<svelte:head>
	<title>{t.pages.home.title}</title>
	<meta name="description" content={t.site.tagline} />
</svelte:head>

<section class="hero">
	<h1>{t.site.name}</h1>
	<p class="tagline">{t.site.tagline}</p>
	<p>{t.home.lead}</p>
	<p>{t.home.purpose}</p>
	<a class="button primary" href={resolve('/app')}>{t.home.start}</a>
</section>

<section aria-labelledby="how">
	<h2 id="how">{t.home.howHeading}</h2>
	<ol class="steps">
		{#each t.home.how as step (step.title)}
			<li>
				<h3>{step.title}</h3>
				<p>{step.text}</p>
			</li>
		{/each}
	</ol>
</section>

<section aria-labelledby="templates">
	<h2 id="templates">{t.home.templatesHeading}</h2>
	<ul class="cards">
		{#each TEMPLATES as template (template.id)}
			<li>
				<h3>{template.title}</h3>
				<p>{template.description}</p>
				<a
					href="{resolve('/app')}?template={template.id}"
					aria-label={t.home.useTemplateLabel(template.title)}>{t.home.useTemplate}</a
				>
			</li>
		{/each}
	</ul>
</section>

<p class="privacy">{t.home.privacy}</p>

<style>
	.hero {
		max-width: 44rem;
	}

	h1 {
		margin: 0;
		font-size: 2.5rem;
	}

	.tagline {
		margin-top: 0.25rem;
		font-size: 1.25rem;
		color: var(--color-muted);
	}

	.button {
		display: inline-block;
		margin-top: 0.5rem;
		padding: 0.6rem 1.2rem;
		border-radius: var(--radius);
		text-decoration: none;
		font-weight: 600;
	}

	.button.primary {
		background: var(--color-accent);
		color: var(--color-accent-fg);
	}

	section {
		margin-bottom: 2.5rem;
	}

	h2 {
		font-size: 1.35rem;
	}

	h3 {
		margin: 0 0 0.35rem;
		font-size: 1.05rem;
	}

	.steps {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
		gap: 1rem;
		margin: 0;
		padding: 0;
		list-style: none;
		counter-reset: step;
	}

	.steps li {
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		counter-increment: step;
	}

	.steps h3::before {
		content: counter(step) '. ';
		color: var(--color-accent);
	}

	.steps p,
	.cards p {
		margin: 0;
		color: var(--color-muted);
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
		gap: 1rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.cards li {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius);
		background: var(--color-surface);
	}

	.cards a {
		align-self: flex-start;
		font-weight: 600;
	}

	.privacy {
		color: var(--color-muted);
	}
</style>
