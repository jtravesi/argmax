import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../../src/lib/server/markdown';

describe('renderMarkdown (build time)', () => {
	it('typesets inline and display math with KaTeX', async () => {
		const { html } = await renderMarkdown(
			'Inline $\\frac{a}{b}$.\n\n$$\nEU(a) = \\sum_s p_a(s)\n$$\n'
		);
		expect(html).toContain('class="katex"');
		expect(html).toContain('class="katex-display"');
		expect(html).not.toContain('$$');
	});

	it('gives headings ids and builds a table of contents of h2 and h3', async () => {
		const { html, toc } = await renderMarkdown(
			'# Title\n\n## 1. Objects\n\n### 5.1 Weight of a dimension\n\n#### Deep\n'
		);
		expect(html).toContain('<h2 id="1-objects">');
		expect(toc).toEqual([
			{ id: '1-objects', text: '1. Objects', level: 2 },
			{ id: '51-weight-of-a-dimension', text: '5.1 Weight of a dimension', level: 3 }
		]);
	});

	it('uses the text of math inside headings for the table of contents', async () => {
		const { toc } = await renderMarkdown('## Utility $u$\n');
		expect(toc[0].text).toBe('Utility u');
	});

	it('renders GFM tables', async () => {
		const { html } = await renderMarkdown('| Rule | Type |\n|---|---|\n| $x \\ge 0$ | Error |\n');
		expect(html).toContain('<table>');
		expect(html).toContain('class="katex"');
	});

	it('drops raw HTML from the source', async () => {
		const { html } = await renderMarkdown(
			'Hello <script>alert(1)</script> <img src=x onerror=alert(1)>\n'
		);
		expect(html).not.toMatch(/<script|onerror/);
	});

	it('renders docs/MODEL.md without KaTeX errors', async () => {
		const source = readFileSync(new URL('../../docs/MODEL.md', import.meta.url), 'utf8');
		const { html, toc } = await renderMarkdown(source);
		expect(html).not.toContain('katex-error');
		// The TeX source legitimately stays in MathML <annotation>s; nothing else may be left raw.
		const visible = html.replace(/<annotation[^>]*>[\s\S]*?<\/annotation>/g, '');
		expect(visible).not.toMatch(/\$\$|\\frac/);
		expect(toc.filter((h) => h.level === 2).map((h) => h.text)).toEqual([
			'1. Objects',
			'2. Utility of an outcome',
			'3. Expected utility and decision rule',
			'4. Risk indicators',
			'5. Sensitivity analysis',
			'6. Dominance in the expected profile',
			'7. Input validation',
			'8. Assumptions and limitations',
			'9. Relation to Bayesian networks and influence diagrams',
			'10. References'
		]);
	});
});
