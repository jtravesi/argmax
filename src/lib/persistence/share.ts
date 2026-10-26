// Share by URL fragment (SPEC.md §4): /app#m=<payload>. The fragment never
// reaches the server. Limits from ARCHITECTURE.md §7.
import LZString from 'lz-string';
import {
	deserialize,
	serialize,
	type DecisionModel,
	type Issue,
	type Result
} from '#lib/core/index.js';

/** Compressed fragment ≤ 32 KB. */
export const MAX_FRAGMENT = 32 * 1024;
/** Decompressed text ≤ 256 KB; decompression aborts as soon as it passes this. */
export const MAX_DECOMPRESSED = 256 * 1024;

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$';
const VALUE = new Map([...ALPHABET].map((ch, i) => [ch, i]));

/**
 * decompressFromEncodedURIComponent of lz-string 1.5.0 (MIT, © 2013 pieroxy),
 * adapted to stop once the output passes `maxLength`: a small fragment can
 * otherwise expand quadratically. Characters outside the alphabet are rejected.
 */
export function lzDecompressBounded(
	encoded: string,
	maxLength: number
): Result<string, 'too-large' | 'corrupt'> {
	const input = encoded.replace(/ /g, '+');
	const length = input.length;
	if (length === 0) return { ok: false, error: 'corrupt' };
	const codes: number[] = [];
	for (const ch of input) {
		const v = VALUE.get(ch);
		if (v === undefined) return { ok: false, error: 'corrupt' };
		codes.push(v);
	}

	const resetValue = 32;
	let val = codes[0];
	let position = resetValue;
	let index = 1;
	const readBits = (n: number): number => {
		let bits = 0;
		for (let power = 1; power !== 1 << n; power <<= 1) {
			const resb = val & position;
			position >>= 1;
			if (position === 0) {
				position = resetValue;
				val = codes[index++] ?? 0;
			}
			if (resb > 0) bits |= power;
		}
		return bits;
	};

	const dictionary: string[] = ['', '', ''];
	let enlargeIn = 4;
	let dictSize = 4;
	let numBits = 3;
	const result: string[] = [];

	let c: string;
	switch (readBits(2)) {
		case 0:
			c = String.fromCharCode(readBits(8));
			break;
		case 1:
			c = String.fromCharCode(readBits(16));
			break;
		case 2:
			return { ok: true, value: '' };
		default:
			return { ok: false, error: 'corrupt' };
	}
	dictionary[3] = c;
	let w = c;
	result.push(c);
	let produced = 1;

	for (;;) {
		if (index > length) return { ok: false, error: 'corrupt' };
		let code = readBits(numBits);
		switch (code) {
			case 0:
			case 1:
				dictionary[dictSize++] = String.fromCharCode(readBits(code === 0 ? 8 : 16));
				code = dictSize - 1;
				enlargeIn--;
				break;
			case 2:
				return { ok: true, value: result.join('') };
		}
		if (enlargeIn === 0) {
			enlargeIn = 2 ** numBits;
			numBits++;
		}

		let entry: string;
		if (code < dictSize && dictionary[code]) entry = dictionary[code];
		else if (code === dictSize) entry = w + w.charAt(0);
		else return { ok: false, error: 'corrupt' };

		produced += entry.length;
		if (produced > maxLength) return { ok: false, error: 'too-large' };
		result.push(entry);

		dictionary[dictSize++] = w + entry.charAt(0);
		enlargeIn--;
		w = entry;
		if (enlargeIn === 0) {
			enlargeIn = 2 ** numBits;
			numBits++;
		}
	}
}

export const encodeShare = (model: DecisionModel): string =>
	LZString.compressToEncodedURIComponent(serialize(model));

/** The /app#m=… URL for a model, on the page the user is on. */
export function shareUrl(model: DecisionModel, pageUrl: string): string {
	const url = new URL(pageUrl);
	url.search = '';
	url.hash = `m=${encodeShare(model)}`;
	return url.toString();
}

/** The payload of a `#m=` fragment, or null if the fragment is something else. */
export function payloadFromHash(hash: string): string | null {
	return hash.startsWith('#m=') ? hash.slice(3) : null;
}

export type ShareError =
	{ reason: 'too-large' } | { reason: 'corrupt' } | { reason: 'invalid'; issues: Issue[] };

/** Fragment payload → model, through parseModel like every external input. */
export function decodeShare(payload: string): Result<DecisionModel, ShareError> {
	if (payload.length > MAX_FRAGMENT) return { ok: false, error: { reason: 'too-large' } };
	const text = lzDecompressBounded(payload, MAX_DECOMPRESSED);
	if (!text.ok) return { ok: false, error: { reason: text.error } };
	const parsed = deserialize(text.value);
	return parsed.ok ? parsed : { ok: false, error: { reason: 'invalid', issues: parsed.error } };
}
