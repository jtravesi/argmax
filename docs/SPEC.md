# Functional specification

## 1. Vision

**Argmax** is a public, open-source website that walks anyone through a decision analysis under uncertainty: define alternatives, possible outcomes with their probabilities, the dimensions that matter with their weights, score each outcome, and get the expected utility of every option together with a sensitivity analysis.

Three ideas drive the product:

1. **The process matters more than the number.** The tool forces beliefs to be made explicit. The result is a mirror, not an order.
2. **Full privacy.** The decisions people enter here are personal. Nothing leaves the user's browser.
3. **Visible rigor.** All the mathematics is formally documented and the code is auditable.

Mathematical reference: [`MODEL.md`](./MODEL.md).

---

## 2. Pages and routes

| Route | Page | Content |
|---|---|---|
| `/` | Home | What it is, what it is for, how it works in 3 steps, "Get started" button, template cards, one-line privacy note. |
| `/app` | Tool | Step-by-step wizard and results. Accepts a shared model in the fragment (`/app#m=...`). |
| `/model` | The model | `MODEL.md` rendered with formulas (KaTeX) and a side table of contents. |
| `/about` | About | Author, link to the author's GitHub profile and to the repository, MIT license, privacy, disclaimer, self-hosting with Docker. |

Fixed top navigation with the four sections. Footer with links to the repository and the license.

---

## 3. Tool (`/app`)

### 3.1 Wizard

Six steps with a progress bar. Users can move back and forth freely; a step with errors is flagged but does not block navigation. The results step is blocked while there are errors (see `MODEL.md` §7).

**Step 1 · The decision.** Title (required, max 120 characters), description and time horizon (optional). Help text: "Phrase the decision as a question."

**Step 2 · Dimensions.** Editable list: name + weight. Weights are entered as percentages (integers 0–100) with a slider and a number field kept in sync. Live sum indicator: green when it adds up to 100, amber otherwise with a "Normalize" button. Help: what a weight is (swing weight, in plain words) and the trick of comparing two scenarios that differ on only two dimensions. Common dimensions offered as clickable chips (money, wellbeing, learning, freedom, health, relationships, career progression).

**Step 3 · Alternatives.** Editable list of names (at least 2). Help: "Is there an option you are not considering?"

**Step 4 · States and probabilities.** One tab or accordion per alternative. In each, a list of states: name + probability as a percentage (integers). Per-alternative sum indicator with a "Normalize" button. Help: states should be mutually exclusive, 3–4 per alternative, the "which one would you bet money on?" trick, and the frequency reading ("30% = 3 times out of 10").

**Step 5 · Scores.** One table per alternative: rows = states, columns = dimensions, cells 0–10 (step 0.5). On mobile, one card per state with one control per dimension. A pinned reminder of the scale: 0 terrible, 5 neutral, 10 excellent. A final read-only column with live $u(a,s)$.

**Step 6 · Results.** See 3.2.

On every step: autosave (see §4) and a "See results" button when the model is valid.

### 3.2 Results

In this order:

1. **Verdict.** Winning alternative, its $EU$, the gap to the second one and a robustness label: gap > 1.0 "clear decision"; > 0.3 "moderate decision"; otherwise "close call: the inputs decide". Validation warnings, if any.
2. **Ranking.** Horizontal bars with $EU$ per alternative on a fixed 0–10 scale.
3. **Breakdown per alternative.** Table of states: normalized probability, $u(a,s)$, contribution $c(a,s)$. Stacked bar of contributions.
4. **Risk profile.** Per alternative: worst case, best case, $\sigma$ and $P_\tau$ with adjustable $\tau$. Range visualization (min–mean–max).
5. **Expected profile.** Table or chart of $\bar{x}_{a,d}$ per alternative and dimension. If there is dominance (`MODEL.md` §6), a highlighted message: "*A* beats *B* whatever the weights."
6. **Interactive sensitivity.** Sliders for every weight and every probability that recompute a "what if" ranking live, without changing the saved model. "Reset" button. Moving one slider rescales the others proportionally, as in `MODEL.md` §5.1 and §5.2; if the moved value was at 100%, the baseline proportions are used.
7. **Tipping points.** For each dimension, the exact weight at which the second alternative would overtake the first (`MODEL.md` §5.1), or "no weight changes the order". The same for the state probabilities of the top two (§5.2). Each tipping point says whether the change happens above or below the current value (e.g. "above 72.2%").
8. **Tornado.** `MODEL.md` §5.4, with adjustable $h$ (0.05 / 0.10 / 0.20).
9. **Closing reminder.** "The model does not decide for you. If the result does not match your intuition, ask yourself what you are modeling wrong, or what is biasing your intuition."

Number format: 2 decimals for utilities; probabilities and weights as whole percentages, except tipping points (1 decimal).

### 3.3 Limits

- Alternatives: 2–8. States per alternative: 1–8. Dimensions: 1–10.
- Text: title 120 characters; names 80; description 1000.

---

## 4. Persistence, import and sharing

- **Autosave** to `localStorage` (versioned key, e.g. `argmax:v1:current`) with debounce. Every access wrapped in try/catch: if it fails, the app keeps working and shows a discreet notice.
  Only models that pass `parseModel` are saved. While the model being edited does not (for example, an empty title or fewer than two alternatives), nothing is written: the last valid version stays saved, and the wizard indicates that the current changes are not saved yet and why.
- **New model** (with confirmation if there are unsaved changes) and **Load template**.
- **Export JSON** (file download) and **Import JSON** (file picker). Schema in `ARCHITECTURE.md` §4. Import validates against the schema and shows readable errors, never loading partial data.
- **Share by URL.** The model is serialized, compressed and encoded in the fragment: `/app#m=<payload>`. The fragment never reaches the server. "Copy link" button with a warning: "Anyone with this link will see your whole model."
- When a shared link is opened while the user has a saved model of their own, ask whether to replace it or open the shared one read-only.

---

## 5. Templates

Shipped as JSON in the repository:

1. **Career crossroads** (`fixtures/career-decision.json`; also the test oracle).
2. **Choosing between job offers.**
3. **Choosing a flat.**
4. **Guided blank template** (2 alternatives, 3 typical dimensions, 3 empty states per alternative). Templates go through `parseModel`, which requires names, so the "empty" states carry guiding names to rename (Best case, Most likely, Worst case) and neutral scores of 5.

Claude Code writes templates 2 and 3 with plausible values, and they must be consistent (probabilities summing to 1, reasonable scores).

---

## 6. About

- Author name and link to their GitHub profile (`jtravesi`, see `CLAUDE.md`).
- Link to the repository and the MIT license.
- **Privacy:** no server, no cookies, no analytics, no requests to third parties; anything saved lives in the browser and is removed with its site data.
- **Disclaimer:** an educational tool to support reflection; not professional advice (financial, medical, legal or psychological).
- **Run it yourself:** one-line Docker command and a link to the README.
- How to contribute (link to issues).

---

## 7. Non-functional requirements

- **Privacy:** zero network requests at runtime after the page has loaded. Fonts and assets self-hosted.
- **Performance:** initial JS for `/app` < 150 KB gzip. Recomputing results < 16 ms at the maximum size (§3.3).
- **Accessibility:** WCAG 2.2 AA. Fully usable with the keyboard, visible focus, a `label` on every field, sufficient contrast, charts with a text alternative (table), `prefers-reduced-motion` respected.
- **Responsive:** from 360 px wide, without horizontal scrolling.
- **Theme:** light and dark following `prefers-color-scheme`, with a manual toggle.
- **Language:** English UI. Every string lives in a dictionary so other languages can be added without touching components.
- **Browsers:** last two versions of Chrome, Firefox and Safari.
- **Deployment:** the same static build runs on Cloudflare Pages (public demo) and in a Docker container (self-hosting and local use). See `ARCHITECTURE.md` §8.

---

## 8. Out of scope (for now)

User accounts, backend, cloud storage, real-time collaboration, analytics, generative AI inside the app. Future extensions are listed in `ROADMAP.md`.
