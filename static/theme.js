// Theme toggle (SPEC.md §7). A plain script, not part of the app bundle, so that
// it also works on /model and /about, which ship no JavaScript: it applies the
// saved theme before the first paint and handles clicks on #theme-toggle.
// Allowed by the page's CSP (script-src 'self').
(function () {
	var KEY = 'argmax:theme';
	var NEXT = { auto: 'light', light: 'dark', dark: 'auto' };
	var root = document.documentElement;

	function apply(theme) {
		if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
		else root.removeAttribute('data-theme');
	}

	try {
		apply(localStorage.getItem(KEY));
	} catch {
		// Storage unavailable: follow the system.
	}
	// Reveals the toggle; without JavaScript it stays hidden (see +layout.svelte).
	root.classList.add('theme-js');

	document.addEventListener('click', function (event) {
		var button = event.target instanceof Element && event.target.closest('#theme-toggle');
		if (!button) return;
		var next = NEXT[root.getAttribute('data-theme') || 'auto'];
		apply(next);
		try {
			if (next === 'auto') localStorage.removeItem(KEY);
			else localStorage.setItem(KEY, next);
		} catch {
			// The choice just won't persist.
		}
	});
})();
