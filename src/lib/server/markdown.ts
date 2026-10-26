// Markdown + math → HTML at build time (ARCHITECTURE.md §2). Runs only during
// prerendering: no KaTeX JavaScript reaches the browser, only its CSS and fonts.
import type { Element, ElementContent, Root } from 'hast';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { unified } from 'unified';

export interface TocEntry {
	id: string;
	text: string;
	level: 2 | 3;
}

/** Visible text of a heading. Math is read from its TeX source, before KaTeX runs. */
function textOf(node: ElementContent): string {
	if (node.type === 'text') return node.value;
	if (node.type !== 'element') return '';
	return node.children.map(textOf).join('');
}

function collectToc(toc: TocEntry[]) {
	return (tree: Root) => {
		for (const node of tree.children) {
			if (node.type !== 'element' || (node.tagName !== 'h2' && node.tagName !== 'h3')) continue;
			const heading = node as Element;
			toc.push({
				id: String(heading.properties.id),
				text: heading.children.map(textOf).join('').trim(),
				level: heading.tagName === 'h2' ? 2 : 3
			});
		}
	};
}

/** Raw HTML in the source is dropped (remark-rehype's default), never passed through. */
export async function renderMarkdown(source: string): Promise<{ html: string; toc: TocEntry[] }> {
	const toc: TocEntry[] = [];
	const file = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkMath)
		.use(remarkRehype)
		.use(rehypeSlug)
		.use(() => collectToc(toc))
		.use(rehypeKatex)
		.use(rehypeStringify)
		.process(source);
	return { html: String(file), toc };
}
