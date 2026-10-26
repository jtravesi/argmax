# The model

> Source of truth for the mathematics of the project. It is rendered as-is on the **Model** page of the site (KaTeX, at build time).
> If the code and this document disagree, this document wins. If you think this document is wrong, do not "fix" it in code: flag it.

---

## 1. Objects

**Alternatives.** A finite set $\mathcal{A} = \{a_1, \dots, a_m\}$ with $m \ge 2$. These are the options being decided between; exactly one is chosen.

**States.** For each alternative $a \in \mathcal{A}$, a finite non-empty set $S_a$ of states of the world: the possible outcomes if $a$ is chosen. States **belong to each alternative**; no common state space is assumed. The model is therefore a one-level decision tree.

**Dimensions.** A finite set $\mathcal{D} = \{1, \dots, n\}$, $n \ge 1$, of attributes on which an outcome is valued (money, wellbeing, freedom…).

**Weights.** A vector $w \in \Delta^{n-1}$, where

$$
\Delta^{k-1} = \Big\{ v \in \mathbb{R}^{k}_{\ge 0} \;:\; \textstyle\sum_{i=1}^{k} v_i = 1 \Big\}
$$

is the probability simplex. The user enters raw weights $\tilde w_d \ge 0$ with $\sum_d \tilde w_d > 0$, which are normalized:

$$
w_d = \frac{\tilde w_d}{\sum_{e \in \mathcal{D}} \tilde w_e}.
$$

**Probabilities.** For each $a$, a distribution $p_a \in \Delta^{|S_a|-1}$ with $p_a(s) = P(s \mid a)$, the subjective probability that state $s$ occurs if $a$ is chosen. It is normalized in the same way as the weights.

**Scores.** For each $a$, $s \in S_a$ and $d \in \mathcal{D}$, a value $x_{a,s,d} \in [0, 10]$: how good outcome $s$ of alternative $a$ is on dimension $d$. It is an **interval scale**: $0$ is the worst level considered and $10$ the best, on each dimension.

---

## 2. Utility of an outcome

We use the **additive multi-attribute value function** (MAUT):

$$
u(a, s) = \sum_{d \in \mathcal{D}} w_d \, x_{a,s,d}.
$$

Since $w \in \Delta^{n-1}$, $u(a,s)$ is a convex combination of the scores, so $u(a,s) \in [0, 10]$.

**Meaning of the weights (swing weights).** The weight $w_d$ does not measure "how important $d$ is in the abstract", but how much going from $0$ to $10$ on $d$ is worth compared with going from $0$ to $10$ on the other dimensions. Weights and scales are therefore tied: if a dimension is rescaled, its weight no longer means the same thing.

**Validity condition.** The additive form is justified when the dimensions are **mutually preferentially independent**: the preference between two outcomes that differ only on a subset of dimensions does not depend on the common level of the remaining ones (Keeney and Raiffa, 1976).

---

## 3. Expected utility and decision rule

The expected utility of an alternative is

$$
EU(a) = \sum_{s \in S_a} p_a(s)\, u(a, s).
$$

Swapping the sums gives an equivalent and very useful form:

$$
EU(a) = \sum_{d \in \mathcal{D}} w_d \, \bar{x}_{a,d},
\qquad
\bar{x}_{a,d} = \sum_{s \in S_a} p_a(s)\, x_{a,s,d},
$$

where $\bar{x}_a = (\bar{x}_{a,1}, \dots, \bar{x}_{a,n})$ is the **expected profile** of $a$: the average score expected on each dimension.

**Decision rule.**

$$
a^* \in \arg\max_{a \in \mathcal{A}} EU(a).
$$

This is where the name of the project comes from. Two alternatives are tied when $|EU(a) - EU(b)| < \varepsilon$, with $\varepsilon = 10^{-9}$.

**Contribution of a state.** $c(a,s) = p_a(s)\,u(a,s)$, so that $\sum_{s} c(a,s) = EU(a)$. This is what the per-state breakdown shows.

**Foundation.** By the von Neumann–Morgenstern theorem, if preferences over lotteries are complete, transitive, continuous and satisfy the independence axiom, there is a utility function $u$ such that one lottery is preferred to another if and only if it has a higher expected utility; $u$ is unique up to positive affine transformations. Savage (1954) extends the result to subjective probabilities.

**Invariance.** The ranking does not change if every score is transformed by the same affine map $x \mapsto \alpha x + \beta$, $\alpha > 0$: the $0$–$10$ scale is a convention.

---

## 4. Risk indicators

The decision criterion is expected utility (a **risk-neutral** decision maker with respect to $u$). The following are shown as complementary information:

- **Worst case:** $\underline{u}(a) = \min_{s \in S_a} u(a,s)$.
- **Best case:** $\overline{u}(a) = \max_{s \in S_a} u(a,s)$.
- **Variance and standard deviation:**

$$
\sigma^2(a) = \sum_{s \in S_a} p_a(s)\,\big(u(a,s) - EU(a)\big)^2,
\qquad
\sigma(a) = \sqrt{\sigma^2(a)}.
$$

- **Probability of a bad outcome:** $P_\tau(a) = \sum_{s \,:\, u(a,s) < \tau} p_a(s)$, with threshold $\tau = 5$ by default, adjustable.

These indicators do **not** change the recommendation. They show whether an alternative wins "by consistency" or "by its tail".

---

## 5. Sensitivity analysis

Expected utility is **affine** in each weight (with proportional rescaling) and in each probability. This makes it possible to compute tipping points in **closed form**, without numerical sweeps.

### 5.1 Weight of a dimension

Fix a dimension $k$ with $w_k < 1$ and set its weight to $t \in [0,1]$, rescaling the others proportionally:

$$
w_k(t) = t, \qquad w_d(t) = (1 - t)\,\frac{w_d}{1 - w_k} \quad (d \ne k).
$$

Then

$$
EU_a(t) = t\,\bar{x}_{a,k} + (1 - t)\,R_{a,k},
\qquad
R_{a,k} = \frac{1}{1 - w_k}\sum_{d \ne k} w_d\,\bar{x}_{a,d}.
$$

Note that $EU_a(w_k) = EU(a)$. For two alternatives $a, b$, the difference

$$
\Delta_{ab}(t) = EU_a(t) - EU_b(t) = (R_{a,k} - R_{b,k}) + t\,\Big[(\bar{x}_{a,k} - \bar{x}_{b,k}) - (R_{a,k} - R_{b,k})\Big]
$$

is affine in $t$, so the order between $a$ and $b$ changes **at most once**. The **tipping point** is

$$
t^*_{ab,k} = \frac{R_{a,k} - R_{b,k}}{(R_{a,k} - R_{b,k}) - (\bar{x}_{a,k} - \bar{x}_{b,k})},
$$

which exists when the denominator is non-zero and $t^* \in [0,1]$. Otherwise no weight of $k$ reverses the order between $a$ and $b$.

### 5.2 Probability of a state

Fix an alternative $a$ and a state $j \in S_a$ with $p_a(j) < 1$, and set its probability to $q \in [0,1]$, rescaling the others:

$$
p_a(j) \mapsto q, \qquad p_a(s) \mapsto (1-q)\,\frac{p_a(s)}{1 - p_a(j)} \quad (s \ne j).
$$

Then

$$
EU_a(q) = q\,u(a,j) + (1-q)\,M_{a,j},
\qquad
M_{a,j} = \frac{1}{1 - p_a(j)}\sum_{s \ne j} p_a(s)\,u(a,s).
$$

Only $EU(a)$ changes. The value of $q$ at which $a$ ties with another alternative $b$ is

$$
q^* = \frac{EU(b) - M_{a,j}}{u(a,j) - M_{a,j}},
$$

provided $u(a,j) \ne M_{a,j}$ and $q^* \in [0,1]$.

### 5.3 A single score

$$
\frac{\partial\, EU(a)}{\partial x_{a,s,d}} = p_a(s)\,w_d.
$$

For $a$ to catch up with $b$ by changing only $x_{a,s,d}$, the required change is

$$
\delta = \frac{EU(b) - EU(a)}{p_a(s)\,w_d},
$$

which is only reachable if $x_{a,s,d} + \delta \in [0, 10]$.

### 5.4 Tornado diagram

Let $a_{(1)}$ and $a_{(2)}$ be the first and second alternatives in the baseline ranking, and $G = EU(a_{(1)}) - EU(a_{(2)})$ the gap. For each parameter $\theta$ (each weight and each state probability) the interval

$$
[\max(0,\ \theta - h),\ \min(1,\ \theta + h)], \qquad h = 0.10 \text{ by default},
$$

is explored with the rescaling of 5.1 or 5.2. By linearity, $G(\theta)$ is affine, so evaluating it **at the endpoints** is enough. Each bar shows $[\min G, \max G]$; bars are sorted by length. A bar that crosses $0$ means that parameter can change the winner. At the endpoints the full ranking is also recomputed, in case a third alternative takes first place.

---

## 6. Dominance in the expected profile

We say that $a$ **dominates** $b$ when

$$
\bar{x}_{a,d} \ge \bar{x}_{b,d} \quad \forall d \in \mathcal{D},
\qquad\text{with strict inequality for at least one } d.
$$

**Proposition.** If $a$ dominates $b$, then $EU(a) \ge EU(b)$ for **every** $w \in \Delta^{n-1}$.

*Proof.* $EU(a) - EU(b) = \sum_d w_d(\bar{x}_{a,d} - \bar{x}_{b,d})$, a sum of non-negative terms. $\square$

This result is robust: it does not depend on how the weights are set, only on probabilities and scores. The site states it explicitly when it applies.

---

## 7. Input validation

| Rule | Type |
|---|---|
| All weights $\tilde w_d \ge 0$ and $\sum_d \tilde w_d > 0$ | Error |
| All probabilities $\ge 0$ and $\sum_s p_a(s) > 0$ for each $a$ | Error |
| All scores in $[0, 10]$ | Error |
| At least 2 alternatives and 1 dimension; each alternative with at least 1 state | Error |
| $\lvert \sum_d \tilde w_d - 1 \rvert > 0.005$ (normalized, with a warning) | Warning |
| $\lvert \sum_s p_a(s) - 1 \rvert > 0.005$ (normalized, with a warning) | Warning |
| An alternative with a single state (no uncertainty) | Warning |
| A dimension with weight 0 (has no effect) | Warning |

With errors nothing is computed. With warnings the normalized values are used and both are shown.

---

## 8. Assumptions and limitations

1. **Additivity.** Requires preferential independence between dimensions. If two dimensions interact (for example, money matters much more when wellbeing is low), the model handles them poorly.
2. **Risk neutrality.** The mean of $u$ is maximized. A risk-averse decision maker may prefer an alternative with a lower $EU$ and a lower $\sigma$. The indicators in section 4 make that trade-off visible.
3. **Subjective probabilities.** They are degrees of belief (de Finetti, Savage), not frequencies. The result is only as good as their calibration.
4. **States per alternative.** Correlations between the outcomes of different alternatives are not modeled. They do not need to be, because only one is chosen.
5. **Single stage.** No sequential decisions ("decide, observe, decide again") and no value of information.
6. **False precision.** An exact number can hide deep uncertainty. Sensitivity analysis is there to check whether the recommendation survives reasonable changes to the inputs.

---

## 9. Relation to Bayesian networks and influence diagrams

The model is equivalent to a minimal **influence diagram**:

- a decision node $D$ with domain $\mathcal{A}$;
- a chance node $S$ whose conditional probability table is $P(S \mid D)$, with $P(S = s \mid D = a) = p_a(s)$;
- a utility node $U(D, S)$ with the additive form of section 2.

A full **Bayesian network** would factor $S$ into several random variables with dependencies between them,

$$
P(X_1, \dots, X_k \mid D) = \prod_{i=1}^{k} P\big(X_i \mid \mathrm{Pa}(X_i)\big),
$$

and would allow updating probabilities with evidence through Bayes' theorem. That extension is on the roadmap; the current version is the case where all uncertainty is summarized in a single chance node per alternative.

---

## 10. References

- J. von Neumann and O. Morgenstern (1944). *Theory of Games and Economic Behavior*. Princeton University Press.
- L. J. Savage (1954). *The Foundations of Statistics*. Wiley.
- B. de Finetti (1974). *Theory of Probability*. Wiley.
- R. L. Keeney and H. Raiffa (1976). *Decisions with Multiple Objectives: Preferences and Value Tradeoffs*. Wiley.
- R. A. Howard and J. E. Matheson (1984). "Influence Diagrams". In *Readings on the Principles and Applications of Decision Analysis*, vol. II. Strategic Decisions Group.
- R. T. Clemen and T. Reilly (2013). *Making Hard Decisions with DecisionTools*, 3rd ed. Cengage.
- J. Pearl (1988). *Probabilistic Reasoning in Intelligent Systems*. Morgan Kaufmann.
