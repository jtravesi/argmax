<script lang="ts">
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { t } from '#lib/i18n/index.js';
	import { LICENSE_URL, REPOSITORY_URL } from '#lib/site.js';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const links = [
		{ href: resolve('/'), label: t.nav.home },
		{ href: resolve('/app'), label: t.nav.app },
		{ href: resolve('/model'), label: t.nav.model },
		{ href: resolve('/about'), label: t.nav.about }
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
					<a href={link.href} aria-current={page.url.pathname === link.href ? 'page' : undefined}
						>{link.label}</a
					>
				</li>
			{/each}
		</ul>
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

	nav ul {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem 1.25rem;
		margin: 0 auto;
		max-width: 60rem;
		padding: 0.75rem 1rem;
		list-style: none;
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
