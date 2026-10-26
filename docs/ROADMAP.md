# Roadmap

Work through the milestones in order and tick each box when done. A milestone is finished when all its criteria are met and CI is green.

## M0 · Scaffolding

- [ ] SvelteKit + strict TypeScript + adapter-static project created at the repository root, without overwriting `docs/`, `fixtures/`, `python/` or `docker/`.
- [ ] `kit.paths.base` read from `BASE_PATH` (empty by default).
- [ ] ESLint, Prettier, `svelte-check`, Vitest and Playwright configured; scripts `dev`, `build`, `preview`, `check`, `lint`, `test`, `test:e2e`.
- [x] `python/test_oracle.py` passes against `fixtures/career-decision.expected.json`.
- [ ] Docker: `docker compose up --build` serves the site on `http://localhost:8080`; `nginx -t` passes; headers verified with `curl -I` on `/`, `/app` and a file under `/_app/immutable/`; container runs as non-root with a read-only filesystem.
- [ ] `ci.yml` green with a trivial test, the Python tests and the Docker build.
- [ ] Base layout with navigation to the four routes (empty pages).

## M1 · Mathematical core

- [ ] `src/lib/core/` complete according to `ARCHITECTURE.md` §5.
- [ ] Oracle test green.
- [ ] All properties in `ARCHITECTURE.md` §6 implemented with fast-check.
- [ ] One test per validation rule.
- [ ] Core branch coverage ≥ 95%.

## M2 · Wizard and basic results

- [ ] Wizard steps 1–5 (`SPEC.md` §3.1) with live validation.
- [ ] Results: verdict, ranking, breakdown per alternative and risk profile.
- [ ] Autosave to `localStorage`.
- [ ] All UI strings in `i18n/en.ts`.
- [ ] Usable at 360 px and with the keyboard.

## M3 · Content pages

- [ ] `/model` renders `docs/MODEL.md` with KaTeX at build time and a side table of contents.
- [ ] `/about` according to `SPEC.md` §6.
- [ ] `/` (home) with templates.

## M4 · Sensitivity

- [ ] Expected profile and dominance notice.
- [ ] "What if" sliders with a Reset button.
- [ ] Tipping points for weights and probabilities.
- [ ] Tornado with adjustable $h$.
- [ ] Every chart has an equivalent accessible table.

## M5 · Persistence and sharing

- [ ] JSON export and import with validation and size limits.
- [ ] Share by URL fragment, with the privacy warning.
- [ ] Handling the conflict between a saved model and a shared link.
- [ ] Templates 2–4 from `SPEC.md` §5.
- [ ] E2E tests from `ARCHITECTURE.md` §6, including malicious JSON and no external requests.

## M6 · Polish and release

- [ ] In-page CSP active and verified (no console errors), both on Pages and in Docker.
- [ ] Light and dark theme with toggle.
- [ ] WCAG 2.2 AA review.
- [ ] Performance budget from `SPEC.md` §7 met.
- [ ] `pages.yml` deploying to GitHub Pages.
- [ ] `docker.yml` publishing multi-arch images to GHCR; Trivy scan in CI; Dependabot active for npm, Actions and Docker.
- [ ] README with screenshot, demo link, Docker instructions and how to contribute.
- [ ] First release tagged `v1.0.0`.

## Later (do not implement unless asked)

- Additional UI languages (Spanish first).
- Uncertain inputs (intervals or distributions) and Monte Carlo simulation.
- Alternative criteria: maximin, mean-variance $EU - \lambda\sigma$, risk-averse utility.
- Sequential decisions and value of information.
- Full Bayesian network: states factored into variables with dependencies and evidence updating (`MODEL.md` §9).
- Export a report as PDF.
