"""Oracle tests: python/argmax.py must match fixtures/*.expected.json.

Run with:  python3 -m pytest python/
"""

import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

from argmax import Decision  # noqa: E402

MODEL = ROOT / "fixtures" / "career-decision.json"
EXPECTED = json.loads((ROOT / "fixtures" / "career-decision.expected.json").read_text())
TOL = EXPECTED["tolerance"]


def close(a, b):
    if a is None or b is None:
        return a is b
    return math.isclose(a, b, abs_tol=TOL)


def model():
    return Decision.from_json(str(MODEL))


def test_normalized_weights():
    w = model().weights()
    for k, v in EXPECTED["normalizedWeights"].items():
        assert close(w[k], v)


def test_alternatives():
    d = model()
    for alt_id, exp in EXPECTED["alternatives"].items():
        risk = d.risk_profile(alt_id)
        for key in ("expectedUtility", "variance", "stdDev", "worstCase", "bestCase", "pBelowTau"):
            assert close(risk[key], exp[key]), (alt_id, key)
        for sid, u in exp["stateUtilities"].items():
            assert close(d.state_utility(alt_id, sid), u)
        for dim, x in exp["expectedProfile"].items():
            assert close(d.expected_profile(alt_id)[dim], x)


def test_two_forms_of_expected_utility_agree():
    """MODEL.md §3: sum_s p u == sum_d w x̄."""
    d = model()
    w = d.weights()
    for a in d.alternatives:
        profile = d.expected_profile(a.id)
        assert close(d.expected_utility(a.id), sum(w[k] * profile[k] for k in w))


def test_ranking():
    assert [aid for aid, _ in model().rank()] == EXPECTED["ranking"]


def test_tipping_weights():
    d = model()
    for tp in EXPECTED["tippingWeights"]:
        assert close(d.tipping_weight(tp["dimension"], tp["a"], tp["b"]), tp["weight"])


def test_tipping_probabilities():
    d = model()
    for tp in EXPECTED["tippingProbabilities"]:
        got = d.tipping_probability(tp["alternative"], tp["state"], tp["against"])
        assert close(got, tp["probability"])


def test_tipping_weight_matches_numeric_sweep():
    """Independent check of the closed form: rescale weights by hand and
    look for the sign change of EU(a) - EU(b) on a fine grid."""
    d = model()
    w0 = d.weights()
    for tp in EXPECTED["tippingWeights"]:
        k, a, b = tp["dimension"], tp["a"], tp["b"]
        xa, xb = d.expected_profile(a), d.expected_profile(b)

        def gap(t):
            w = {j: (t if j == k else (1 - t) * w0[j] / (1 - w0[k])) for j in w0}
            return sum(w[j] * (xa[j] - xb[j]) for j in w)

        n = 100_000
        crossing = None
        for i in range(n):
            t0, t1 = i / n, (i + 1) / n
            if gap(t0) == 0 or gap(t0) * gap(t1) < 0:
                crossing = t0
                break
        if tp["weight"] is None:
            assert crossing is None
        else:
            assert abs(crossing - tp["weight"]) <= 1 / n
