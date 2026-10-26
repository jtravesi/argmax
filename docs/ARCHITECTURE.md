# Architecture

## 1. Principles

1. **Fully static, client-side.** No backend. The same build is served from GitHub Pages and from a Docker container.
2. **Pure core.** All the mathematics lives in `src/lib/core/`: pure TypeScript functions with no UI or browser dependencies. It is the most heavily tested part.
3. **Inputs are the only state.** Results are always derived from the model and never stored.
4. **Minimal dependencies.** Every runtime dependency must be justified. Charts are hand-written SVG, no chart library.

## 2. Stack

| Piece | Choice | Why |
|---|---|---|
| Framework | **SvelteKit + Svelte 5** (runes) | Natural reactivity for forms with live computation; small bundles. |
| Output | **`@sveltejs/adapter-static`** with prerendering | Static pages; `/model` and `/about` are plain HTML. |
| Language | **TypeScript** in `strict` mode | |
| Markdown + math | **mdsvex** + **remark-math** + **rehype-katex** | `MODEL.md` is turned into HTML with KaTeX **at build time**: no KaTeX JS on the client, only its CSS and fonts. |
| Validation | **zod** | One schema for JSON import, shared URLs and `localStorage`. |
| URL compression | **lz-string** (`compressToEncodedURIComponent`) | |
| Charts | Hand-written **SVG components** | Bars, stacked bar, range and tornado are simple; no extra dependency. |
| Unit tests | **Vitest** + **fast-check** | Mathematical properties (§6). |
| E2E tests | **Playwright** | Full flow and basic regressions. |
| Quality | ESLint, Prettier, `svelte-check` | |
| Oracle | **Python 3.10+**, standard library only, **pytest** | `python/argmax.py`. |
| Container | **Docker** multi-stage: Node (build) → unprivileged nginx (runtime) | Self-hosting and local use with one command. |

Use the current stable version of each tool at install time, and check its current documentation if an API has changed.

## 3. Repository layout

```
argmax/
├── CLAUDE.md
├── README.md
├── LICENSE
├── Dockerfile
├── compose.yaml
├── .dockerignore
├── docker/
│   ├── nginx.conf
│   └── security-headers.conf
├── docs/
│   ├── SPEC.md
│   ├── MODEL.md            # source of the /model page
│   ├── ARCHITECTURE.md
│   └── ROADMAP.md
├── fixtures/
│   ├── career-decision.json            # template + oracle
│   └── career-decision.expected.json   # expected results (tolerance 1e-9)
├── python/
│   ├── argmax.py
│   └── test_oracle.py
├── src/
│   ├── lib/
│   │   ├── core/           # pure: no svelte or DOM imports
│   │   │   ├── types.ts
│   │   │   ├── schema.ts       # zod + version migrations
│   │   │   ├── validate.ts
│   │   │   ├── normalize.ts
│   │   │   ├── utility.ts      # u, EU, expected profile, contributions
│   │   │   ├── risk.ts         # worst/best case, variance, P_tau
│   │   │   ├── sensitivity.ts  # §5.1–5.4, tipping points, tornado
│   │   │   ├── dominance.ts
│   │   │   └── index.ts
│   │   ├── persistence/    # localStorage, export/import, URL
│   │   ├── i18n/           # en.ts
│   │   ├── stores/         # model state with runes
│   │   ├── components/
│   │   │   ├── wizard/
│   │   │   ├── results/
│   │   │   └── charts/     # hand-written SVG
│   │   └── templates/      # template JSON (imports fixtures/)
│   └── routes/
│       ├── +layout.svelte
│       ├── +page.svelte        # Home
│       ├── app/+page.svelte
│       ├── model/+page.svx     # imports docs/MODEL.md
│       └── about/+page.svelte
├── tests/
│   ├── core/               # Vitest
│   └── e2e/                # Playwright
├── static/                 # self-hosted fonts, favicon
└── .github/
    ├── workflows/ci.yml
    ├── workflows/pages.yml
    ├── workflows/docker.yml
    └── dependabot.yml
```

## 4. Data model

JSON schema, version 1. Full example in `fixtures/career-decision.json`.

```ts
type Id = string; // unique within its collection

interface DecisionModel {
  schemaVersion: 1;
  title: string;            // 1..120
  description?: string;     // ..1000
  horizon?: string;         // ..80, e.g. "1 year"
  dimensions: Dimension[];  // 1..10
  alternatives: Alternative[]; // 2..8
}

interface Dimension {
  id: Id;
  name: string;   // 1..80
  weight: number; // >= 0, raw; normalized on use
}

interface Alternative {
  id: Id;
  name: string;   // 1..80
  states: State[]; // 1..8
}

interface State {
  id: Id;
  name: string;        // 1..80
  probability: number; // >= 0, raw; normalized per alternative
  scores: Record<Id, number>; // exactly one entry per dimension.id, values in [0, 10]
}
```

Schema rules on top of types and ranges: unique ids, `scores` with exactly the keys of `dimensions` (no more, no less), finite numbers (no `NaN` or `Infinity`), unknown keys rejected (`.strict()`). The UI shows percentages but stores fractions (0.25, not 25).

For future versions, `schema.ts` exposes `parseModel(unknown): Result<DecisionModel, Issue[]>`, which applies migrations `v1 → v2 → …` before validating.

## 5. Core API

Indicative signatures. All functions are pure and never mutate their arguments. Python equivalents in `python/argmax.py` use the same names in snake_case.

```ts
validate(model): { errors: Issue[]; warnings: Issue[] }
normalize(model): NormalizedModel   // weights and probabilities on the simplex

stateUtility(nm, altId, stateId): number
expectedProfile(nm, altId): Record<DimId, number>
expectedUtility(nm, altId): number
rank(nm): { altId: string; eu: number }[]   // descending; ties keep input order
analyze(model): AnalysisResult               // everything in SPEC §3.2 in one object

riskProfile(nm, altId, tau = 5): { worst; best; variance; stdDev; pBelowTau }

withDimensionWeight(nm, dimId, t): NormalizedModel          // §5.1
withStateProbability(nm, altId, stateId, q): NormalizedModel // §5.2
tippingWeight(nm, dimId, a, b): number | null               // closed form
tippingProbability(nm, altId, stateId, b): number | null    // closed form
scoreThreshold(nm, altId, stateId, dimId, b): number | null
tornado(nm, h = 0.1): TornadoBar[]
dominance(nm): { dominant: AltId; dominated: AltId }[]
```

Constant `EPS = 1e-9` for ties and comparisons with zero. Degenerate cases (`w_k = 1`, `p_a(j) = 1`, zero denominator) return `null` instead of dividing by zero.

## 6. Testing strategy

**Oracle.** `tests/core/oracle.test.ts` loads `fixtures/career-decision.json` and checks every value in `career-decision.expected.json` with tolerance `1e-9`. `python/test_oracle.py` does the same with the Python implementation (already in place and passing). If you change the mathematics, both must keep passing; if the `.expected.json` file has to change, explain why.

**Properties with fast-check** (generators of random valid models):

- $EU(a) \in [\underline{u}(a), \overline{u}(a)] \subseteq [0, 10]$.
- $\sum_s c(a,s) = EU(a)$.
- The two forms of $EU$ (`MODEL.md` §3) agree.
- The ranking is invariant when all raw weights are multiplied by a positive constant, and when the same positive affine map is applied to all scores.
- `withDimensionWeight(nm, k, w_k)` leaves $EU$ unchanged; same for probabilities.
- At the returned tipping point the two alternatives tie (to `1e-9`), and the order is reversed on either side.
- The closed-form tipping point matches a fine numerical sweep.
- If `dominance` reports that $a$ dominates $b$, then $EU(a) \ge EU(b)$ for random weights.
- `parseModel(serialize(m))` returns `m`; same for the round trip through the URL.

**Validation.** One test per rule in `MODEL.md` §7, including its edge case.

**E2E (Playwright).** Load the template and see the expected ranking; build a model from scratch; export and import; open a shared link; reload and keep state; import an invalid or malicious JSON and see an error without breaking anything; navigate with the keyboard only.

Core branch coverage target: ≥ 95%.

## 7. Security

There is no server, but the app processes untrusted data: imported JSON, the URL fragment and `localStorage`.

- **Strict validation on every input** with the same zod schema. Nothing enters the state without going through `parseModel`.
- **Limits before processing:** imported file ≤ 256 KB; fragment ≤ 32 KB compressed; decompressed size ≤ 256 KB (abort when exceeded).
- **Prototype pollution:** `scores` keys are checked against dimension ids; `__proto__`, `constructor` and `prototype` are rejected as ids; lookups by id use prototype-less objects or `Map`.
- **XSS:** never `{@html}` with user data. The only allowed `{@html}` is the HTML generated from `MODEL.md` at build time. Names are always rendered as text.
- **CSP in the page** through SvelteKit's `kit.csp` (meta tag with hashes on prerendered pages): `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'` (KaTeX uses `style` attributes); `img-src 'self' data:`; `font-src 'self'`; `connect-src 'none'`; `object-src 'none'`; `base-uri 'self'`; `form-action 'none'`. This is what protects the GitHub Pages deployment, which cannot set custom headers.
- **HTTP headers in Docker** (§8): nginx adds the protections a meta tag cannot provide. See §8 for how both CSPs combine.
- **No external requests:** self-hosted fonts, no CDNs, no analytics. An e2e test asserts there are no requests to other origins.
- **Supply chain:** `package-lock.json` committed; `npm ci` in CI; `npm audit --audit-level=high` in CI; Dependabot for npm, GitHub Actions and Docker; actions pinned by SHA; minimal `permissions:` in each workflow; base images pinned by digest; container image scanned with Trivy.
- **External links** with `rel="noopener noreferrer"`.

## 8. Deployment

The same static build has two targets. The only difference is the base path.

| Target | Base path | Who it is for |
|---|---|---|
| GitHub Pages | `/argmax` | Public demo. |
| Docker | `/` (root) | Self-hosting, local testing. |

SvelteKit reads the base path from the `BASE_PATH` environment variable at build time (`kit.paths.base = process.env.BASE_PATH ?? ''`).

### 8.1 Docker

Files at the repository root (already drafted; validate and adjust them in M0):

- `Dockerfile`: multi-stage. Stage `build` (Node LTS on Alpine) runs `npm ci` and `npm run build`. Stage `runtime` (`nginxinc/nginx-unprivileged`, Alpine) copies only the build output and the nginx config. Runs as a non-root user on port **8080**, with a `HEALTHCHECK`.
- `docker/nginx.conf`: serves prerendered pages (`try_files $uri $uri.html $uri/index.html =404`), long-lived cache for `/_app/immutable/`, `no-cache` for HTML, gzip, `server_tokens off`.
- `docker/security-headers.conf`: security headers, included in **every** `location` block. In nginx, an `add_header` inside a `location` discards all headers inherited from the `server` block, so headers cannot simply be declared once at the top.
- `compose.yaml`: one service hardened with `read_only`, `tmpfs: /tmp`, `cap_drop: ALL` and `no-new-privileges`.

**Combining CSPs.** When a page has a CSP in a meta tag and another in a header, the browser enforces **both** (the effective policy is the intersection). The header must therefore not include `default-src` or `script-src`, or it would block SvelteKit's hashed inline scripts. The nginx CSP contains only what a meta tag cannot express or what does not conflict: `frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'none'`. The rest of the policy stays in the meta tag.

Usage:

```bash
docker compose up --build          # http://localhost:8080
# or, with the published image:
docker run --rm -p 8080:8080 ghcr.io/jtravesi/argmax:latest
```

TLS (and HSTS) belong to the reverse proxy in front of the container (Caddy, Traefik, nginx…), not to this image.

### 8.2 CI/CD

- `ci.yml` (push and PR): lint, `svelte-check`, Vitest with coverage, pytest, build, Playwright against the build, `docker build`, and a Trivy scan of the image (fail on HIGH/CRITICAL with an available fix).
- `pages.yml` (push to `main`): build with `BASE_PATH=/argmax` and deploy to GitHub Pages with `actions/upload-pages-artifact` and `actions/deploy-pages`.
- `docker.yml` (tag `v*`): multi-arch build (`linux/amd64`, `linux/arm64`) and push to `ghcr.io/jtravesi/argmax` with tags `vX.Y.Z` and `latest`, SBOM and provenance attestations enabled.

## 9. Accessibility and interface

- Sober design, readable typography and well-typeset formulas: this is a tool for thinking, not a colorful dashboard.
- Colors defined as CSS tokens with light and dark variants.
- SVG charts have `role="img"`, an `aria-label` and an accessible equivalent table.
- Validation messages use `aria-live="polite"`.
