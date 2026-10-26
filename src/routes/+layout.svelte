<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { t } from '#lib/i18n/index.js';
	import { LICENSE_URL, REPOSITORY_URL } from '#lib/site.js';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	// /model and /about have no client-side JavaScript (csr = false): the router must
	// load them as full pages, or it would try to fetch their data, which the CSP blocks.
	const links = [
		{ route: '/', href: resolve('/'), label: t.nav.home, reload: false },
		{ route: '/app', href: resolve('/app'), label: t.nav.app, reload: false },
		{ route: '/model', href: resolve('/model'), label: t.nav.model, reload: true },
		{ route: '/about', href: resolve('/about'), label: t.nav.about, reload: true }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<header>
	<nav aria-label={t.nav.label}>
		<ul>
			{#each links as link (link.href)}
				<li>
					<a
						href={link.href}
						data-sveltekit-reload={link.reload ? '' : undefined}
						aria-current={page.route.id === link.route ? 'page' : undefined}>{link.label}</a
					>
				</li>
			{/each}
		</ul>
		<!-- Handled by static/theme.js; CSS shows the label of the current theme. -->
		<button type="button" id="theme-toggle" class="theme" title={t.theme.help}>
			<span class="t-auto">{t.theme.auto}</span>
			<span class="t-light">{t.theme.light}</span>
			<span class="t-dark">{t.theme.dark}</span>
		</button>
	</nav>
</header>

<main>
	{@render children()}
</main>

<footer>
	<a href={REPOSITORY_URL} rel="external noopener noreferrer">{t.footer.repository}</a>
	<span aria-hidden="true">·</span>
	<a href={LICENSE_URL} rel="external noopener noreferrer">{t.footer.license}</a>
</footer>

<style>
	header {
		position: sticky;
		top: 0;
		z-index: 10;
		background: var(--color-bg);
		border-bottom: 1px solid var(--color-border);
	}

	nav {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.25rem 1rem;
		margin: 0 auto;
		max-width: 60rem;
		padding: 0.5rem 1rem;
	}

	nav ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1.25rem;
		margin: 0;
		padding: 0.25rem 0;
		list-style: none;
	}

	.theme {
		display: none;
		padding: 0.2rem 0.6rem;
		font-size: 0.85rem;
	}

	:global(html.theme-js) .theme {
		display: inline-block;
	}

	.t-light,
	.t-dark,
	:global(html[data-theme='light']) .t-auto,
	:global(html[data-theme='dark']) .t-auto {
		display: none;
	}

	:global(html[data-theme='light']) .t-light,
	:global(html[data-theme='dark']) .t-dark {
		display: inline;
	}

	nav a {
		color: var(--color-fg);
		text-decoration: none;
	}

	nav a[aria-current='page'] {
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 0.3em;
	}

	main {
		flex: 1;
		width: 100%;
		max-width: 60rem;
		margin: 0 auto;
		padding: 1.5rem 1rem;
		box-sizing: border-box;
	}

	footer {
		padding: 1rem;
		text-align: center;
		color: var(--color-muted);
		border-top: 1px solid var(--color-border);
	}
</style>
