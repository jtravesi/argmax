# Argmax

**Decision making under uncertainty, with the math in plain sight.**

$$a^* = \arg\max_{a} \; \mathbb{E}[u(a)]$$

Argmax walks you through a structured decision: list your alternatives, the outcomes each one could lead to and how likely you think they are, the dimensions you care about and how much, and score every outcome. It computes the expected utility of each alternative, its risk profile, the exact tipping points where the ranking would change, and a sensitivity analysis.

- **Private.** Everything runs in your browser. No server, no cookies, no analytics.
- **Rigorous.** The full mathematical model is written down in [`docs/MODEL.md`](docs/MODEL.md).
- **Open.** MIT licensed. Run it yourself with one command.

> The model does not decide for you. It makes your beliefs explicit and checks that they are consistent.

## Try it

- **Online:** _demo coming soon on GitHub Pages._
- **With Docker:**

  ```bash
  docker run --rm -p 8080:8080 ghcr.io/jtravesi/argmax:latest
  ```

  or, from a clone of this repository:

  ```bash
  docker compose up --build
  ```

  Then open <http://localhost:8080>.

## Development

```bash
npm ci
npm run dev
npm test
python3 -m pytest python/
```

Project documents: [`docs/SPEC.md`](docs/SPEC.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), [`docs/ROADMAP.md`](docs/ROADMAP.md).

### Python reference implementation

[`python/argmax.py`](python/argmax.py) implements the same model with no dependencies. It is also the test oracle for the web app.

```bash
python3 python/argmax.py fixtures/career-decision.json --sensitivity
```

## License

[MIT](LICENSE)
