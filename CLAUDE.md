# CLAUDE.md

## What this project is

**Argmax** is a public, open-source (MIT) website for making decisions under uncertainty with multi-attribute expected utility: the user defines alternatives, states with probabilities, dimensions with weights, and scores, and gets a ranking with a sensitivity analysis. Everything is computed in the browser; there is no backend. It ships as a static site on GitHub Pages and as a Docker image for self-hosting.

## Documents: read them before writing code

| Document | Contents |
|---|---|
| `docs/SPEC.md` | What to build: pages, wizard, results, persistence, non-functional requirements. |
| `docs/MODEL.md` | The mathematics. **Source of truth**: if code and document disagree, the document wins. |
| `docs/ARCHITECTURE.md` | Stack, layout, data schema, core API, tests, security, Docker and CI/CD. |
| `docs/ROADMAP.md` | Milestones with acceptance criteria. Work in order and tick the boxes. |
| `fixtures/career-decision*.json` | Example model and expected results. This is the test oracle. |
| `python/argmax.py` | Reference implementation in Python. Usage: `python3 python/argmax.py fixtures/career-decision.json --sensitivity`. |

## Non-negotiable rules

1. **No network at runtime.** No backend, analytics, CDNs or external fonts. User data never leaves the browser.
2. **The core is pure.** `src/lib/core/` does not import Svelte and does not touch the DOM, `window` or `localStorage`. All the mathematics lives there and is tested there.
3. **Do not invent mathematics.** Implement exactly what `docs/MODEL.md` says. If you find an error or a gap, stop and ask instead of improvising.
4. **The oracle rules.** The TypeScript and Python tests must match `fixtures/career-decision.expected.json` (tolerance `1e-9`). Do not change that file without explaining why.
5. **Every external input goes through `parseModel`** (imported JSON, URL fragment, `localStorage`). Respect the limits and rules in `ARCHITECTURE.md` §7.
6. **Never `{@html}` with user data.** The only exception is the HTML generated from `MODEL.md` at build time.
7. **Every new runtime dependency is justified** in its commit message. We prefer 30 lines of our own code to a library.
8. **Keep the container hardened.** Non-root, read-only filesystem, no new capabilities. Security headers live in `docker/security-headers.conf` and must be included in every nginx `location` block (see `ARCHITECTURE.md` §8.1).

## Commands

```bash
npm run dev                 # dev server
npm run check               # svelte-check + types
npm run lint                # ESLint + Prettier
npm test                    # Vitest (unit and property tests)
npm run test:e2e            # Playwright against the build
npm run build               # static build (BASE_PATH="" by default)
python3 -m pytest python/   # Python oracle
docker compose up --build   # serve the build at http://localhost:8080
```

Before considering a task done: `npm run check && npm run lint && npm test && python3 -m pytest python/`. If you touched `Dockerfile`, `compose.yaml` or `docker/`, also build and run the container and check the headers with `curl -I`.

## Conventions

- Everything in **English**: code, comments, docs, commit messages and UI text. UI strings always go through `src/lib/i18n/en.ts`; no hard-coded strings in components, so other languages can be added later.
- TypeScript `strict`, no `any` (use `unknown` and narrow). Svelte 5 with runes.
- Code notation follows `MODEL.md` and cites it in comments (`// MODEL.md §5.1`).
- `EPS = 1e-9` for ties and comparisons with zero. Return `null` in degenerate cases; never divide by zero.
- Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `build:`, `ci:`…), small and single-purpose.
- Small components. Charts are hand-written SVG in `src/lib/components/charts/`.

## How to work

1. Read `docs/ROADMAP.md` and take the first unfinished milestone.
2. For core work, write the test (or property) first, then the implementation.
3. When a milestone is done: CI green, boxes ticked, and a short summary of what was done and which decisions you made.
4. If a decision is not covered by the documents and changes something user-visible or architectural, ask. If it is an internal detail, decide, carry on and mention it in the summary.
5. Do not implement anything from the "Later" section of the roadmap unless asked.

## Author

- Author: Jose
- GitHub: `jtravesi`
- Copyright holder in `LICENSE`: **pending** (replace `<YOUR NAME>` before M3)
- Repository: `jtravesi/argmax`
