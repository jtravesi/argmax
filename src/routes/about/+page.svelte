<script lang="ts">
	import { t } from '#lib/i18n/index.js';
	import {
		AUTHOR,
		AUTHOR_URL,
		DOCKER_RUN,
		ISSUES_URL,
		LICENSE_URL,
		README_URL,
		REPOSITORY_URL
	} from '#lib/site.js';
</script>

<svelte:head>
	<title>{t.pages.about.title}</title>
</svelte:head>

<div class="prose">
	<h1>{t.pages.about.heading}</h1>

	<section aria-labelledby="author">
		<h2 id="author">{t.about.authorHeading}</h2>
		<p>{t.about.author(AUTHOR)}</p>
		<ul>
			<li><a href={AUTHOR_URL} rel="external noopener noreferrer">{t.about.profile}</a></li>
			<li><a href={REPOSITORY_URL} rel="external noopener noreferrer">{t.about.repository}</a></li>
			<li><a href={LICENSE_URL} rel="external noopener noreferrer">{t.about.license}</a></li>
		</ul>
	</section>

	<section aria-labelledby="privacy">
		<h2 id="privacy">{t.about.privacyHeading}</h2>
		{#each t.about.privacy as paragraph (paragraph)}
			<p>{paragraph}</p>
		{/each}
	</section>

	<section aria-labelledby="disclaimer">
		<h2 id="disclaimer">{t.about.disclaimerHeading}</h2>
		<p>{t.about.disclaimer}</p>
	</section>

	<section aria-labelledby="self-host">
		<h2 id="self-host">{t.about.selfHostHeading}</h2>
		<p>{t.about.selfHost}</p>
		<pre><code>{DOCKER_RUN}</code></pre>
		<p><a href={README_URL} rel="external noopener noreferrer">{t.about.readme}</a></p>
	</section>

	<section aria-labelledby="contribute">
		<h2 id="contribute">{t.about.contributeHeading}</h2>
		<p>
			{t.about.contribute}
			<a href={ISSUES_URL} rel="external noopener noreferrer">{t.about.issues}</a>.
		</p>
	</section>
</div>

<style>
	.prose {
		max-width: 46rem;
	}

	h1 {
		margin-top: 0;
	}

	h2 {
		margin-top: 2rem;
		font-size: 1.25rem;
	}

	pre {
		overflow-x: auto;
		padding: 0.75rem 1rem;
		border-radius: var(--radius);
		background: var(--color-surface);
		font-size: 0.9rem;
	}
</style>
