// Export and import as JSON files (SPEC.md §4). Import validates through
// parseModel and never loads partial data (ARCHITECTURE.md §7).
import { deserialize, type DecisionModel, type Issue, type Result } from '#lib/core/index.js';

/** ARCHITECTURE.md §7: imported files ≤ 256 KB. */
export const MAX_IMPORT_BYTES = 256 * 1024;

export type ImportError =
	{ reason: 'too-large' } | { reason: 'unreadable' } | { reason: 'invalid'; issues: Issue[] };

/** Checks the size before reading anything. */
export async function readModelFile(
	file: Pick<File, 'size' | 'text'>
): Promise<Result<DecisionModel, ImportError>> {
	if (file.size > MAX_IMPORT_BYTES) return { ok: false, error: { reason: 'too-large' } };
	let text: string;
	try {
		text = await file.text();
	} catch {
		return { ok: false, error: { reason: 'unreadable' } };
	}
	const parsed = deserialize(text);
	return parsed.ok ? parsed : { ok: false, error: { reason: 'invalid', issues: parsed.error } };
}

/** Pretty JSON, so an exported model is readable and diffable. */
export const exportText = (model: DecisionModel): string => JSON.stringify(model, null, 2) + '\n';

/** "Career crossroads" → "career-crossroads.json". */
export function exportFileName(model: DecisionModel): string {
	const slug = model.title
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60)
		.replace(/-+$/, '');
	return `${slug || 'decision'}.json`;
}
