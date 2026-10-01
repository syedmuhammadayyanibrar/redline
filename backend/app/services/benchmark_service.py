from typing import List
from ..models.schemas import (
    ScenarioBenchmarkItem,
    BenchmarkSummary,
    EvaluationMode,
)
from ..scenarios.data import load_all_scenarios
from ..engine.evaluator import evaluator


class BenchmarkService:
    """
    Computes rigorous, deterministic evaluation metrics over the complete benchmark scenario suite.
    Zero fabricated statistics: all numbers are computed from actual rule evaluations on scripted cases.
    """

    def run_full_benchmark(self) -> BenchmarkSummary:
        scenarios = load_all_scenarios()
        items: List[ScenarioBenchmarkItem] = []

        total_cases = 0
        turn_correct_count = 0
        full_correct_count = 0
        disagreements = 0
        context_dep_caught = 0
        false_negatives_in_turn = 0

        for scenario in scenarios:
            # 1. Evaluate Prototype Baseline (Naive Agent)
            base_conv = scenario.baseline_conversation
            base_turn = evaluator.evaluate_conversation(base_conv, mode=EvaluationMode.TURN_LEVEL)
            base_full = evaluator.evaluate_conversation(base_conv, mode=EvaluationMode.FULL_CONTEXT)

            expected_base = scenario.expected_status_naive  # Usually "FLAGGED"
            turn_ok_base = (base_turn.overall_status == expected_base)
            full_ok_base = (base_full.overall_status == expected_base)

            disagree_base = (base_turn.overall_status != base_full.overall_status)
            if disagree_base:
                disagreements += 1

            # Check if turn-level had a false negative (reported PASS when it should have been FLAGGED)
            if expected_base == "FLAGGED" and base_turn.overall_status == "PASS":
                false_negatives_in_turn += 1

            context_dep_base = base_full.context_dependent_count
            context_dep_caught += context_dep_base

            if turn_ok_base:
                turn_correct_count += 1
            if full_ok_base:
                full_correct_count += 1
            total_cases += 1

            items.append(
                ScenarioBenchmarkItem(
                    scenario_id=f"{scenario.id}-baseline",
                    scenario_title=f"{scenario.title} (Prototype Baseline)",
                    agent_type="baseline",
                    expected_outcome=expected_base,
                    turn_level_outcome=base_turn.overall_status,
                    full_context_outcome=base_full.overall_status,
                    turn_level_correct=turn_ok_base,
                    full_context_correct=full_ok_base,
                    has_disagreement=disagree_base,
                    context_dependent_issues=context_dep_base,
                )
            )

            # 2. Evaluate Prototype Guarded Agent
            guard_conv = scenario.guarded_conversation
            guard_turn = evaluator.evaluate_conversation(guard_conv, mode=EvaluationMode.TURN_LEVEL)
            guard_full = evaluator.evaluate_conversation(guard_conv, mode=EvaluationMode.FULL_CONTEXT)

            expected_guard = scenario.expected_status_guarded  # Usually "PASS"
            turn_ok_guard = (guard_turn.overall_status == expected_guard)
            full_ok_guard = (guard_full.overall_status == expected_guard)

            disagree_guard = (guard_turn.overall_status != guard_full.overall_status)
            if disagree_guard:
                disagreements += 1

            if turn_ok_guard:
                turn_correct_count += 1
            if full_ok_guard:
                full_correct_count += 1
            total_cases += 1

            items.append(
                ScenarioBenchmarkItem(
                    scenario_id=f"{scenario.id}-guarded",
                    scenario_title=f"{scenario.title} (Prototype Guarded)",
                    agent_type="guarded",
                    expected_outcome=expected_guard,
                    turn_level_outcome=guard_turn.overall_status,
                    full_context_outcome=guard_full.overall_status,
                    turn_level_correct=turn_ok_guard,
                    full_context_correct=full_ok_guard,
                    has_disagreement=disagree_guard,
                    context_dependent_issues=guard_full.context_dependent_count,
                )
            )

        full_accuracy = round((full_correct_count / total_cases) * 100, 1) if total_cases > 0 else 0.0
        turn_accuracy = round((turn_correct_count / total_cases) * 100, 1) if total_cases > 0 else 0.0

        return BenchmarkSummary(
            total_test_cases=total_cases,
            full_context_accuracy=full_accuracy,
            turn_level_accuracy=turn_accuracy,
            turn_vs_full_disagreements=disagreements,
            context_dependent_violations_caught=context_dep_caught,
            false_negatives_in_turn_level=false_negatives_in_turn,
            benchmark_items=items,
        )


benchmark_service = BenchmarkService()
