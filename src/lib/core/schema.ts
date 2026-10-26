// JSON schema of the model (ARCHITECTURE.md §4) and the single entry point for
// untrusted input: imported files, the URL fragment and localStorage (§7).
import { z } from 'zod';
import type { DecisionModel, Issue, IssueCode, Result } from './types';

export const CURRENT_SCHEMA_VERSION = 1;

/** Size limits of a model (SPEC.md §3.3, ARCHITECTURE.md §4). */
export const LIMITS = {
	title: 120,
	description: 1000,
	horizon: 80,
	name: 80,
	id: 64,
	dimensions: { min: 1, max: 10 },
	alternatives: { min: 2, max: 8 },
	states: { min: 1, max: 8 }
} as const;

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_SCAN_DEPTH = 8;

const id = z
	.string()
	.min(1)
	.max(LIMITS.id)
	.refine((v) => !FORBIDDEN_KEYS.has(v), { params: { code: 'forbidden-key' } });
const name = z.string().min(1).max(LIMITS.name);

const stateSchema = z.strictObject({
	id,
	name,
	probability: z.number().min(0),
	scores: z.record(z.string(), z.number().min(0).max(10))
});

const alternativeSchema = z.strictObject({
	id,
	name,
	states: z.array(stateSchema).min(LIMITS.states.min).max(LIMITS.states.max)
});

const dimensionSchema = z.strictObject({
	id,
	name,
	weight: z.number().min(0)
});

const modelSchema = z
	.strictObject({
		schemaVersion: z.literal(1),
		title: z.string().min(1).max(LIMITS.title),
		description: z.string().max(LIMITS.description).optional(),
		horizon: z.string().max(LIMITS.horizon).optional(),
		dimensions: z.array(dimensionSchema).min(LIMITS.dimensions.min).max(LIMITS.dimensions.max),
		alternatives: z
			.array(alternativeSchema)
			.min(LIMITS.alternatives.min)
			.max(LIMITS.alternatives.max)
	})
	.superRefine((m, ctx) => {
		const duplicate = (ids: string[], path: (string | number)[]) => {
			ids.forEach((v, i) => {
				if (ids.indexOf(v) !== i) {
					ctx.addIssue({
						code: 'custom',
						path: [...path, i, 'id'],
						params: { code: 'duplicate-id' }
					});
				}
			});
		};
		const dimensionIds = m.dimensions.map((d) => d.id);
		duplicate(dimensionIds, ['dimensions']);
		duplicate(
			m.alternatives.map((a) => a.id),
			['alternatives']
		);
		m.alternatives.forEach((alt, a) => {
			duplicate(
				alt.states.map((s) => s.id),
				['alternatives', a, 'states']
			);
			alt.states.forEach((s, j) => {
				const keys = Object.keys(s.scores);
				if (keys.length !== dimensionIds.length || !dimensionIds.every((d) => keys.includes(d))) {
					ctx.addIssue({
						code: 'custom',
						path: ['alternatives', a, 'states', j, 'scores'],
						params: { code: 'scores-mismatch' }
					});
				}
			});
		});
	});

/**
 * Own keys named __proto__, constructor or prototype in the input. JSON.parse
 * creates them as own properties; zod would silently drop them. Iterative and
 * bounded: a valid model is at most 6 levels deep (root → alternatives → i →
 * states → j → scores → key), and zod rejects anything deeper by its type.
 */
function findForbiddenKeys(input: unknown): Issue[] {
	const issues: Issue[] = [];
	const stack: { value: unknown; path: (string | number)[] }[] = [{ value: input, path: [] }];
	while (stack.length > 0) {
		const { value, path } = stack.pop() as (typeof stack)[number];
		if (typeof value !== 'object' || value === null || path.length > MAX_SCAN_DEPTH) continue;
		for (const key of Object.keys(value)) {
			const childPath = [...path, Array.isArray(value) ? Number(key) : key];
			if (FORBIDDEN_KEYS.has(key)) issues.push({ code: 'forbidden-key', path: childPath });
			else stack.push({ value: (value as Record<string, unknown>)[key], path: childPath });
		}
	}
	return issues;
}

/** Upgrades from version v to v + 1 live at index v − 1. None yet: version 1 is current. */
type Migration = (data: Record<string, unknown>) => Record<string, unknown>;
const MIGRATIONS: readonly Migration[] = [];

/** Apply the migrations from `version` up to the last one. Exported for tests. */
export function migrate(
	data: Record<string, unknown>,
	version: number,
	migrations: readonly Migration[] = MIGRATIONS
): Record<string, unknown> {
	let current = data;
	for (let v = version; v <= migrations.length; v++) current = migrations[v - 1](current);
	return current;
}

const toPath = (path: PropertyKey[]): (string | number)[] =>
	path.map((p) => (typeof p === 'number' ? p : String(p)));

function fromZod(issue: z.core.$ZodIssue): Issue[] {
	const path = toPath(issue.path);
	switch (issue.code) {
		case 'custom': {
			const code = (issue.params?.code ?? 'invalid') as IssueCode;
			return [{ code, path }];
		}
		case 'invalid_type':
			return [{ code: 'invalid-type', path, params: { expected: issue.expected } }];
		case 'too_small':
			return [{ code: 'too-small', path, params: { minimum: Number(issue.minimum) } }];
		case 'too_big':
			return [{ code: 'too-big', path, params: { maximum: Number(issue.maximum) } }];
		case 'unrecognized_keys':
			return issue.keys.map((key) => ({ code: 'unrecognized-key', path: [...path, key] }));
		default:
			return [{ code: 'invalid', path }];
	}
}

/**
 * Validate untrusted input against the schema, after migrating older versions.
 * Never returns partial data. MODEL.md §7 checks (sums, warnings) are `validate`'s job.
 */
export function parseModel(input: unknown): Result<DecisionModel, Issue[]> {
	const forbidden = findForbiddenKeys(input);
	if (forbidden.length > 0) return { ok: false, error: forbidden };

	if (typeof input !== 'object' || input === null || Array.isArray(input)) {
		return {
			ok: false,
			error: [{ code: 'invalid-type', path: [], params: { expected: 'object' } }]
		};
	}
	const data = input as Record<string, unknown>;
	const version = data.schemaVersion;
	if (
		typeof version !== 'number' ||
		!Number.isInteger(version) ||
		version < 1 ||
		version > CURRENT_SCHEMA_VERSION
	) {
		return { ok: false, error: [{ code: 'unsupported-version', path: ['schemaVersion'] }] };
	}

	const parsed = modelSchema.safeParse(migrate(data, version));
	if (!parsed.success) return { ok: false, error: parsed.error.issues.flatMap(fromZod) };
	return { ok: true, value: parsed.data };
}

export function serialize(model: DecisionModel): string {
	return JSON.stringify(model);
}

/** JSON text → model. Size limits are applied by the caller (ARCHITECTURE.md §7). */
export function deserialize(text: string): Result<DecisionModel, Issue[]> {
	let data: unknown;
	try {
		data = JSON.parse(text);
	} catch {
		return { ok: false, error: [{ code: 'invalid-json', path: [] }] };
	}
	return parseModel(data);
}
