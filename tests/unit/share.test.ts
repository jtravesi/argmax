import fc from 'fast-check';
import LZString from 'lz-string';
import { describe, expect, it } from 'vitest';
import {
	decodeShare,
	encodeShare,
	lzDecompressBounded,
	MAX_FRAGMENT,
	MAX_DECOMPRESSED,
	payloadFromHash,
	shareUrl
} from '../../src/lib/persistence/share';
import { modelArb } from '../core/arbitraries';
import { career } from '../core/helpers';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$';

describe('bounded lz-string decompression', () => {
	it('inverts compressToEncodedURIComponent for any string', () => {
		fc.assert(
			fc.property(fc.string({ unit: 'binary', maxLength: 2000 }), (s) => {
				const packed = LZString.compressToEncodedURIComponent(s);
				expect(lzDecompressBounded(packed, Infinity)).toEqual({ ok: true, value: s });
			})
		);
	});

	it('agrees with lz-string wherever the input is a genuine encoding', () => {
		// lz-string accepts some garbage and returns arbitrary text (or throws); we reject it.
		// So: whatever we accept must match lz-string, and every genuine encoding
		// (one that lz-string's output compresses back to) must be accepted.
		fc.assert(
			fc.property(
				fc.string({ unit: fc.constantFrom(...ALPHABET), minLength: 1, maxLength: 200 }),
				(input) => {
					let theirs: string | null;
					try {
						theirs = LZString.decompressFromEncodedURIComponent(input);
					} catch {
						theirs = null;
					}
					const ours = lzDecompressBounded(input, Infinity);
					if (ours.ok) expect(ours.value).toBe(theirs);
					const genuine =
						theirs !== null && LZString.compressToEncodedURIComponent(theirs) === input;
					if (genuine) expect(ours).toEqual({ ok: true, value: theirs });
				}
			)
		);
	});

	it('aborts a compression bomb as soon as the output passes the limit', () => {
		const bomb = LZString.compressToEncodedURIComponent('a'.repeat(MAX_DECOMPRESSED + 50_000));
		expect(bomb.length).toBeLessThan(MAX_FRAGMENT);
		expect(lzDecompressBounded(bomb, MAX_DECOMPRESSED)).toEqual({ ok: false, error: 'too-large' });
	});

	it('rejects characters outside the alphabet and truncated input', () => {
		expect(lzDecompressBounded('abc<>', Infinity)).toEqual({ ok: false, error: 'corrupt' });
		const packed = LZString.compressToEncodedURIComponent('hello world, hello world');
		expect(lzDecompressBounded(packed.slice(0, 5), Infinity).ok).toBe(false);
		expect(lzDecompressBounded('', Infinity)).toEqual({ ok: false, error: 'corrupt' });
	});
});

describe('share links (ARCHITECTURE.md §7)', () => {
	it('round-trips any valid model through the URL fragment', () => {
		fc.assert(
			fc.property(modelArb(), (model) => {
				const url = shareUrl(model, 'https://example.org/argmax/app');
				const payload = payloadFromHash(new URL(url).hash);
				expect(payload).not.toBeNull();
				expect(decodeShare(payload as string)).toEqual({ ok: true, value: model });
			})
		);
	});

	it('builds /app#m=<payload> on the given page', () => {
		const url = shareUrl(career(), 'https://example.org/argmax/app?x=1#old');
		expect(url).toMatch(/^https:\/\/example\.org\/argmax\/app#m=[A-Za-z0-9+\-$]+$/);
		expect(encodeShare(career()).length).toBeLessThan(MAX_FRAGMENT);
	});

	it('reads only #m= fragments', () => {
		expect(payloadFromHash('#m=abc')).toBe('abc');
		expect(payloadFromHash('#x=abc')).toBeNull();
		expect(payloadFromHash('')).toBeNull();
	});

	it('refuses an oversized fragment before decompressing it', () => {
		expect(decodeShare('A'.repeat(MAX_FRAGMENT + 1))).toEqual({
			ok: false,
			error: { reason: 'too-large' }
		});
	});

	it('refuses corrupt or malicious payloads', () => {
		expect(decodeShare('%%%')).toEqual({ ok: false, error: { reason: 'corrupt' } });
		const notJson = LZString.compressToEncodedURIComponent('not json');
		expect(decodeShare(notJson)).toMatchObject({ ok: false, error: { reason: 'invalid' } });
		const polluted = LZString.compressToEncodedURIComponent(
			'{"schemaVersion":1,"__proto__":{"x":1}}'
		);
		const result = decodeShare(polluted);
		expect(result).toMatchObject({ ok: false, error: { reason: 'invalid' } });
		expect(({} as Record<string, unknown>).x).toBeUndefined();
	});
});
