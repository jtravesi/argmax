// Number formats (SPEC.md §3.2): 2 decimals for utilities; probabilities and
// weights as whole percentages, except tipping points (1 decimal).
import { en } from '#lib/i18n/en.js';

const utility = new Intl.NumberFormat(en.locale, {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2
});
const percent = new Intl.NumberFormat(en.locale, { style: 'percent', maximumFractionDigits: 0 });

export const formatUtility = (x: number) => utility.format(x);
export const formatPercent = (p: number) => percent.format(p);

/** A fraction as a whole percentage for number inputs (0.25 → 25). NaN stays NaN. */
export const toPercentInput = (p: number) => Math.round(p * 100);
