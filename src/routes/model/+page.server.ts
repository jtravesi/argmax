import { renderMarkdown } from '#lib/server/markdown.js';
import source from '../../../docs/MODEL.md?raw';
import type { PageServerLoad } from './$types';

// Rendered at build time and served as plain HTML, with no JavaScript (ARCHITECTURE.md §2).
export const csr = false;

export const load: PageServerLoad = () => renderMarkdown(source);
