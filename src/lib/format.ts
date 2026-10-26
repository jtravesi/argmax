// Number formats (SPEC.md §3.2): 2 decimals for utilities; probabilities and
// weights as whole percentages, except tipping points (1 decimal).
import { en } from '#lib/i18n/en.js';

const utility = new Intl.NumberFormat(en.locale, {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});
const percent = new Intl.NumberFormat(en.locale, { style: 'percent', maximumFractionDigits: 0 });
const tipping = new Intl.NumberFormat(en.locale, {
	style: 'percent',
	minimumFractionDigits: 1,
	maximumFractionDigits: 1
});
const signed = new Intl.NumberFormat(en.locale, {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
	signDisplay: 'exceptZero'
});

export const formatUtility = (x: number) => utility.format(x);
export const formatPercent = (p: number) => percent.format(p);
/** Tipping points keep one decimal (SPEC.md §3.2). */
export const formatTipping = (p: number) => tipping.format(p);
/** A utility difference with its sign, e.g. +0.51 or −0.20. */
export const formatGap = (x: number) => signed.format(x);

/** A fraction as a whole percentage for number inputs (0.25 → 25). NaN stays NaN. */
export const toPercentInput = (p: number) => Math.round(p * 100);
