import pytest
from ..models.schemas import EvaluationMode
from ..scenarios.data import load_all_scenarios
from ..engine.evaluator import ComplianceEvaluator


@pytest.fixture
def evaluator():
    return ComplianceEvaluator()


def test_all_scenarios_baseline_vs_guarded(evaluator):
    """
    Test that across all 8 scenarios:
    - Prototype baseline is FLAGGED in full-context mode.
    - Prototype guarded agent passes with 0 violations (status 'PASS').
    """
    scenarios = load_all_scenarios()
    assert len(scenarios) >= 8, f"Expected at least 8 scenarios, found {len(scenarios)}"

    for scenario in scenarios:
        # 1. Baseline agent in full-context mode must be FLAGGED
        base_res = evaluator.evaluate_conversation(
            scenario.baseline_conversation, mode=EvaluationMode.FULL_CONTEXT
        )
        assert (
            base_res.overall_status == "FLAGGED"
        ), f"Scenario '{scenario.id}' baseline should be FLAGGED in full-context, got {base_res.overall_status}"
        assert (
            base_res.total_issues > 0
        ), f"Scenario '{scenario.id}' baseline should have at least 1 finding."

        # 2. Guarded agent in full-context mode must PASS
        guard_res = evaluator.evaluate_conversation(
            scenario.guarded_conversation, mode=EvaluationMode.FULL_CONTEXT
        )
        assert (
            guard_res.overall_status == "PASS"
        ), f"Scenario '{scenario.id}' guarded should PASS in full-context, got {guard_res.overall_status}. Issues: {[f.rule_id for f in guard_res.findings]}"
        assert guard_res.total_issues == 0


def test_context_dependent_scenarios_show_disagreement(evaluator):
    """
    Scenarios 1 (Cease), 3 (Dispute), and 8 (Hardship) must demonstrate disagreements
    between turn-level and full-context modes due to context dependence.
    """
    context_dep_ids = ["SCN-001", "SCN-003", "SCN-008"]
    scenarios = {s.id: s for s in load_all_scenarios()}

    for s_id in context_dep_ids:
        scenario = scenarios[s_id]
        comparison = evaluator.compare_modes(scenario.baseline_conversation)
        assert (
            comparison.disagreements_count > 0
        ), f"Scenario {s_id} must have at least 1 turn-level vs full-context disagreement."
        assert (
            comparison.context_dependent_issues_uncovered > 0
        ), f"Scenario {s_id} must uncover context-dependent issues."
