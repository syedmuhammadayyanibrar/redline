# Redline: Conversational Compliance Evaluation Methodology

> **Disclaimer:** Redline is an independent prototype for demonstrating conversational compliance testing. Its scenarios and rules are simplified and are not legal advice or an evaluation of Veritus's systems.

---

## 1. Why the Project Exists

In regulated debt collection and consumer lending, automated conversational voice agents are subject to strict statutory requirements, primarily under the:
- **Fair Debt Collection Practices Act (FDCPA, 15 U.S.C. § 1692 et seq.)**
- **CFPB Regulation F (12 CFR Part 1006)**

Non-compliance exposes lenders and collection agencies to severe statutory damages ($1,000 per violation, actual damages, costs, and class-action exposure).

Standard LLM guardrails (such as toxicity filters or single-turn classification APIs) evaluate model output in **turn-by-turn isolation**. In debt collection, this produces fatal blind spots. An agent's question—such as *"Would tomorrow afternoon work for another call?"*—is entirely benign on its own. It only becomes an unlawful statutory violation when evaluated in the context of what the borrower said earlier in the dialogue (e.g., *"I don't want you calling me anymore"*).

**Redline** was created to make this difference visible, measurable, and testable.

---

## 2. What Is Being Tested

Redline tests simulated agent conversations against 9 operational rules derived from publicly documented FDCPA and Regulation F requirements:

| Rule ID | Rule Name | Statutory Authority | Context Requirement |
| :--- | :--- | :--- | :--- |
| **REDLINE-001** | Contact After Cease-Communication Request | 15 U.S.C. § 1692c(c) / FDCPA § 805(c) | Requires tracking prior borrower turns for verbal cease demands |
| **REDLINE-002** | Prohibited Third-Party Disclosure | 15 U.S.C. § 1692c(b) / FDCPA § 805(b) | Requires respondent identity context (spouse / roommate / non-borrower) |
| **REDLINE-003** | Collection Continuance on Disputed Debt | 15 U.S.C. § 1692g(b) / FDCPA § 809(b) | Requires tracking prior borrower dispute statements |
| **REDLINE-004** | Permissible Calling Hours Restriction | 12 CFR § 1006.6(b)(1) | Requires borrower local time metadata (8:00 AM – 9:00 PM) |
| **REDLINE-005** | Deceptive & Misleading Legal Threats | 15 U.S.C. § 1692e(4)-(5) / FDCPA § 807 | Turn-level threat language (garnishment / lawsuit / arrest) |
| **REDLINE-006** | Repeated Contact / Frequency Capping | 12 CFR § 1006.14(b)(2) | Requires 7-day rolling dialer attempt logs (7-in-7 rule) |
| **REDLINE-007** | Sensitive Financial Disclosure to Non-Consumer | 15 U.S.C. § 1692c(b) & CFPB Guidance | Account number / specific dollar disclosure to third parties |
| **REDLINE-008** | Inability-to-Pay Coercion / Hardship Disregard | FDCPA § 806 / CFPB Unfair Practices | Tracking prior borrower disclosure of unemployment / catastrophic emergency |
| **REDLINE-009** | Mini-Miranda Statutory Warning Omission | 15 U.S.C. § 1692e(11) / FDCPA § 807(11) | Initial collection communication warning requirement |

---

## 3. Turn-Level Evaluation (Stateless)

In turn-level evaluation, the compliance engine inspects only the isolated agent response at turn $T_i$, without memory of earlier turns $T_1, \dots, T_{i-1}$:
- **Strengths**: Fast, lightweight, detects overt profanity, slurs, and explicit illegal threats (e.g., immediate wage garnishment without judgment).
- **Failure Mode**: Produces false negatives whenever a response's compliance depends on conversational state. For example, scheduling a follow-up or asking for a \$50 installment payment appears polite and compliant in isolation, but violates § 805(c) or § 809(b) if the consumer previously demanded calls stop or disputed the debt.

---

## 4. Full-Context Evaluation (Stateful)

In full-context evaluation, an accumulated state analyzer processes the dialogue sequentially, updating the legal context state machine as borrower statements occur:
- `borrower_has_ceased`: Set to `True` when consumer states *"stop calling"*, *"cease"*, or *"do not contact"*.
- `borrower_has_disputed`: Set to `True` when consumer disputes validity, claims insurance paid, or asserts billing errors.
- `is_third_party`: Set to `True` when respondent identifies as a spouse, roommate, or relative.
- `borrower_has_hardship`: Set to `True` when consumer discloses job loss or emergency insolvency.

When an agent response is generated, it is validated against the accumulated constraints. Subsequent collection demands or scheduling proposals after a cease trigger are immediately flagged with precise turn citations.

---

## 5. Scenario Construction & Agent Configurations

The benchmark suite consists of 8 scripted scenarios representing realistic consumer debt collection interactions. Each scenario pairs two simulated agent configurations:

1. **Prototype Baseline (Naive Agent)**:
   An unconstrained conversational agent that optimizes solely for payment conversion. It lacks multi-turn compliance state tracking and commits statutory violations across multiple categories.
2. **Prototype Guarded Agent**:
   An agent architecture equipped with stateful compliance guardrails. It enforces calling-hour windows, frequency caps, Mini-Miranda disclosures, neutral third-party messaging, and immediate pauses upon dispute or cease requests.

---

## 6. Evaluation Methodology & Determinism

All metrics in Redline are deterministic:
- Every finding returns a structured `ComplianceFinding` with: `rule_id`, `rule_name`, `severity`, `turn_id`, `triggering_text`, `explanation`, `conversation_context`, `evaluation_mode`, `confidence`, and `remediation`.
- Benchmark metrics are computed from actual rule evaluations over all 16 test cases (8 Baseline + 8 Guarded).
- Zero fabricated statistics, synthetic estimates, or hardcoded accuracy numbers.

---

## 7. Limitations & Scope

1. **Simplified Rule Readings**: Redline models core operational requirements of FDCPA and Regulation F. It is not an exhaustive legal framework and does not account for state-specific debt collection statutes (e.g., California Rosenthal Act, New York City Department of Consumer and Worker Protection rules).
2. **Deterministic Heuristics**: The prototype uses deterministic pattern-matching and state tracking. In production, hybrid architectures combining deterministic grammars with semantic classification models provide broader linguistic coverage.
3. **No Commercial Claims**: Redline is an independent technical portfolio artifact. It does not evaluate, replicate, or benchmark Veritus's internal production architectures.
