// Autosave in localStorage (SPEC.md §4). Every access is wrapped in try/catch:
// storage can be disabled, full, or throw on mere access.
import { deserialize, serialize, type DecisionModel } from '#lib/core/index.js';

export const STORAGE_KEY = 'argmax:v1:current';

/** ARCHITECTURE.md §7: nothing larger than 256 KB is processed. */
export const MAX_STORED_BYTES = 256 * 1024;

export type LoadResult =
	| { status: 'empty' }
	| { status: 'ok'; model: DecisionModel }
	| { status: 'invalid' }
	| { status: 'unavailable' };

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function storage(): StorageLike | null {
	try {
		return globalThis.localStorage ?? null;
	} catch {
		return null;
	}
}

/** The saved model, validated through parseModel like any other external input. */
export function loadSaved(store: StorageLike | null = storage()): LoadResult {
	if (!store) return { status: 'unavailable' };
	let text: string | null;
	try {
		text = store.getItem(STORAGE_KEY);
	} catch {
		return { status: 'unavailable' };
	}
	if (text === null) return { status: 'empty' };
	if (text.length > MAX_STORED_BYTES) return { status: 'invalid' };
	const result = deserialize(text);
	return result.ok ? { status: 'ok', model: result.value } : { status: 'invalid' };
}

/** Saves a model that already passed parseModel. False if storage failed. */
export function save(model: DecisionModel, store: StorageLike | null = storage()): boolean {
	if (!store) return false;
	try {
		store.setItem(STORAGE_KEY, serialize(model));
		return true;
	} catch {
		return false;
	}
}

/** Forgets the saved model (New model). False if storage failed. */
export function clearSaved(store: StorageLike | null = storage()): boolean {
	if (!store) return false;
	try {
		store.removeItem(STORAGE_KEY);
		return true;
	} catch {
		return false;
	}
}
