"""
argmax.py
=========

Reference implementation of the Argmax decision model in plain Python
(standard library only, Python 3.10+).

It implements docs/MODEL.md and acts as the test oracle for the web app:
both implementations must agree with fixtures/*.expected.json.

Usage:
    python3 argmax.py MODEL.json                 # full report
    python3 argmax.py MODEL.json --sensitivity   # report + tipping points

Library usage:
    from argmax import Decision
    d = Decision.from_json("fixtures/career-decision.json")
    d.rank()
"""

from __future__ import annotations

import json
import math
import sys
from dataclasses import dataclass, field

EPS = 1e-9
SUM_TOLERANCE = 0.005  # MODEL.md §7


# ----------------------------------------------------------------------
#  Data model
# ----------------------------------------------------------------------

@dataclass
class Dimension:
    id: str
    name: str
    weight: float  # raw, normalized on use


@dataclass
class State:
    id: str
    name: str
    probability: float  # raw, normalized per alternative on use
    scores: dict[str, float]  # dimension id -> [0, 10]


@dataclass
class Alternative:
    id: str
    name: str
    states: list[State] = field(default_factory=list)


class ValidationError(ValueError):
    pass


# ----------------------------------------------------------------------
#  Decision
# ----------------------------------------------------------------------

class Decision:
    """A decision model as defined in docs/MODEL.md."""

    def __init__(self, title: str, dimensions: list[Dimension],
                 alternatives: list[Alternative]):
        self.title = title
        self.dimensions = dimensions
        self.alternatives = alternatives
        errors = self.validate()["errors"]
        if errors:
            raise ValidationError("; ".join(errors))

    # ---- Loading ---------------------------------------------------------

    @classmethod
    def from_dict(cls, data: dict) -> "Decision":
        """Build a model from the JSON schema shared with the web app (v1)."""
        if data.get("schemaVersion") != 1:
            raise ValidationError("unsupported schemaVersion (expected 1)")
        dims = [Dimension(d["id"], d["name"], float(d["weight"]))
                for d in data["dimensions"]]
        alts = [
            Alternative(a["id"], a["name"], [
                State(s["id"], s["name"], float(s["probability"]),
                      {k: float(v) for k, v in s["scores"].items()})
                for s in a["states"]
            ])
            for a in data["alternatives"]
        ]
        return cls(data.get("title", "Untitled decision"), dims, alts)

    @classmethod
    def from_json(cls, path: str) -> "Decision":
        with open(path, encoding="utf-8") as f:
            return cls.from_dict(json.load(f))

    # ---- Validation (MODEL.md §7) ---------------------------------------

    def validate(self) -> dict[str, list[str]]:
        errors: list[str] = []
        warnings: list[str] = []
        dim_ids = [d.id for d in self.dimensions]

        if len(self.alternatives) < 2:
            errors.append("at least 2 alternatives are required")
        if not self.dimensions:
            errors.append("at least 1 dimension is required")
        if any(d.weight < 0 for d in self.dimensions):
            errors.append("weights must be >= 0")
        total_w = sum(d.weight for d in self.dimensions)
        if total_w <= 0:
            errors.append("weights must have a positive sum")
        elif abs(total_w - 1) > SUM_TOLERANCE:
            warnings.append(f"weights sum to {total_w:.3f}; normalized to 1")
        for d in self.dimensions:
            if d.weight == 0:
                warnings.append(f"dimension '{d.name}' has weight 0")

        for a in self.alternatives:
            if not a.states:
                errors.append(f"'{a.name}' has no states")
                continue
            if any(s.probability < 0 for s in a.states):
                errors.append(f"'{a.name}': probabilities must be >= 0")
            total_p = sum(s.probability for s in a.states)
            if total_p <= 0:
                errors.append(f"'{a.name}': probabilities must have a positive sum")
            elif abs(total_p - 1) > SUM_TOLERANCE:
                warnings.append(f"'{a.name}': probabilities sum to {total_p:.3f}; normalized to 1")
            if len(a.states) == 1:
                warnings.append(f"'{a.name}' has a single state (no uncertainty)")
            for s in a.states:
                if set(s.scores) != set(dim_ids):
                    errors.append(f"'{a.name}' / '{s.name}': scores must cover exactly the dimensions")
                for v in s.scores.values():
                    if not (math.isfinite(v) and 0 <= v <= 10):
                        errors.append(f"'{a.name}' / '{s.name}': scores must be in [0, 10]")
                        break
        return {"errors": errors, "warnings": warnings}

    # ---- Normalization ----------------------------------------------------

    def weights(self) -> dict[str, float]:
        total = sum(d.weight for d in self.dimensions)
        return {d.id: d.weight / total for d in self.dimensions}

    def _alt(self, alt_id: str) -> Alternative:
        for a in self.alternatives:
            if a.id == alt_id:
                return a
        raise KeyError(alt_id)

    def probabilities(self, alt_id: str) -> dict[str, float]:
        a = self._alt(alt_id)
        total = sum(s.probability for s in a.states)
        return {s.id: s.probability / total for s in a.states}

    # ---- Core quantities (MODEL.md §2–4) --------------------------------

    def state_utility(self, alt_id: str, state_id: str) -> float:
        """u(a, s) = sum_d w_d x_{a,s,d}"""
        w = self.weights()
        s = next(s for s in self._alt(alt_id).states if s.id == state_id)
        return sum(w[d] * s.scores[d] for d in w)

    def state_utilities(self, alt_id: str) -> dict[str, float]:
        return {s.id: self.state_utility(alt_id, s.id) for s in self._alt(alt_id).states}

    def expected_profile(self, alt_id: str) -> dict[str, float]:
        """x̄_{a,d} = sum_s p_a(s) x_{a,s,d}"""
        p = self.probabilities(alt_id)
        a = self._alt(alt_id)
        return {d.id: sum(p[s.id] * s.scores[d.id] for s in a.states)
                for d in self.dimensions}

    def expected_utility(self, alt_id: str) -> float:
        """EU(a) = sum_s p_a(s) u(a, s)"""
        p = self.probabilities(alt_id)
        u = self.state_utilities(alt_id)
        return sum(p[s] * u[s] for s in p)

    def rank(self) -> list[tuple[str, float]]:
        """Alternatives by descending EU; ties keep input order."""
        eus = [(a.id, self.expected_utility(a.id)) for a in self.alternatives]
        return sorted(eus, key=lambda x: -x[1])

    def risk_profile(self, alt_id: str, tau: float = 5.0) -> dict[str, float]:
        p = self.probabilities(alt_id)
        u = self.state_utilities(alt_id)
        eu = sum(p[s] * u[s] for s in p)
        var = sum(p[s] * (u[s] - eu) ** 2 for s in p)
        return {
            "expectedUtility": eu,
            "variance": var,
            "stdDev": math.sqrt(var),
            "worstCase": min(u.values()),
            "bestCase": max(u.values()),
            "pBelowTau": sum(p[s] for s in p if u[s] < tau),
        }

    # ---- Sensitivity (MODEL.md §5) ----------------------------------------

    def tipping_weight(self, dim_id: str, a: str, b: str) -> float | None:
        """Weight t of `dim_id` at which EU(a) = EU(b), with the other
        weights rescaled proportionally. Closed form, MODEL.md §5.1."""
        w = self.weights()
        wk = w[dim_id]
        if wk >= 1 - EPS:
            return None
        xa, xb = self.expected_profile(a), self.expected_profile(b)

        def rest(x: dict[str, float]) -> float:
            return sum(w[d] * x[d] for d in w if d != dim_id) / (1 - wk)

        dr = rest(xa) - rest(xb)
        dx = xa[dim_id] - xb[dim_id]
        den = dr - dx
        if abs(den) < EPS:
            return None
        t = dr / den
        return t if -EPS <= t <= 1 + EPS else None

    def tipping_probability(self, alt_id: str, state_id: str, b: str) -> float | None:
        """Probability q of `state_id` in `alt_id` at which EU(alt_id) = EU(b).
        Closed form, MODEL.md §5.2."""
        p = self.probabilities(alt_id)
        pj = p[state_id]
        if pj >= 1 - EPS:
            return None
        u = self.state_utilities(alt_id)
        m = sum(p[s] * u[s] for s in p if s != state_id) / (1 - pj)
        den = u[state_id] - m
        if abs(den) < EPS:
            return None
        q = (self.expected_utility(b) - m) / den
        return q if -EPS <= q <= 1 + EPS else None

    # ---- Report -------------------------------------------------------------

    def report(self, sensitivity: bool = False) -> None:
        line = "=" * 72
        print(line)
        print(f"  ARGMAX · {self.title}")
        print(line)
        for warning in self.validate()["warnings"]:
            print(f"  warning: {warning}")

        print("\nDIMENSIONS (normalized weights)")
        for d in sorted(self.dimensions, key=lambda d: -d.weight):
            wd = self.weights()[d.id]
            print(f"  {d.name:<36} {wd:>6.1%}  {'█' * int(wd * 40)}")

        print("\nALTERNATIVES")
        for a in self.alternatives:
            print(f"\n  {a.name}")
            p, u = self.probabilities(a.id), self.state_utilities(a.id)
            for s in a.states:
                print(f"    {s.name:<38} P={p[s.id]:>5.1%}  u={u[s.id]:>5.2f}"
                      f"  contribution={p[s.id] * u[s.id]:>5.2f}")
            r = self.risk_profile(a.id)
            print(f"    {'risk':<38} worst={r['worstCase']:.2f}  best={r['bestCase']:.2f}"
                  f"  sd={r['stdDev']:.2f}")

        print("\nRANKING (expected utility)")
        ranking = self.rank()
        names = {a.id: a.name for a in self.alternatives}
        for i, (aid, eu) in enumerate(ranking, 1):
            print(f"  {i}. {names[aid]:<44} {eu:>5.2f}  {'█' * int(eu * 4)}")

        if len(ranking) >= 2:
            gap = ranking[0][1] - ranking[1][1]
            verdict = ("clear decision" if gap > 1.0
                       else "moderate decision (check sensitivity)" if gap > 0.3
                       else "close call: the inputs decide")
            print(f"\n  Gap between first and second: {gap:.2f} -> {verdict}")

        if sensitivity and len(ranking) >= 2:
            first, second = ranking[0][0], ranking[1][0]
            print(f"\nTIPPING POINTS ('{names[second]}' vs '{names[first]}')")
            for d in self.dimensions:
                t = self.tipping_weight(d.id, first, second)
                msg = f"weight {t:.1%}" if t is not None else "no weight flips the order"
                print(f"  {d.name:<36} {msg}")
        print(line)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    Decision.from_json(sys.argv[1]).report(sensitivity="--sensitivity" in sys.argv)
