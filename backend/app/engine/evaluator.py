from typing import List, Optional, Dict, Any
from ..models.schemas import (
    Conversation,
    ConversationTurn,
    ComplianceFinding,
    EvaluationMode,
    Severity,
    EvaluationResult,
    TurnComparison,
    ComparisonEvaluationResponse,
)
from ..rules.rules_registry import rules_registry
from .context_analyzer import ContextAnalyzer


class ComplianceEvaluator:
    """
    Deterministic evaluation engine executing compliance rules across conversation turns.
    Supports both Turn-Level (isolated) and Full-Context (stateful) evaluation modes.
    """

    def __init__(self):
        self.rules = rules_registry.get_all_rules()

    def evaluate_conversation(
        self,
        conversation: Conversation,
        mode: EvaluationMode = EvaluationMode.FULL_CONTEXT,
    ) -> EvaluationResult:
        analyzer = ContextAnalyzer(conversation.metadata)
        all_findings: List[ComplianceFinding] = []

        for idx, turn in enumerate(conversation.turns):
            # In turn-level mode, context state is empty / stateless
            if mode == EvaluationMode.TURN_LEVEL:
                context_state: Dict[str, Any] = {
                    "is_third_party": bool(conversation.metadata.is_third_party)
                }
            else:
                # In full-context mode, accumulate state as dialogue progresses
                context_state = analyzer.process_turn(turn)

            # Evaluate each active compliance rule
            for rule in self.rules:
                finding = rule.evaluate(
                    turn=turn,
                    turn_index=idx,
                    conversation=conversation,
                    mode=mode,
                    context_state=context_state,
                )
                if finding:
                    all_findings.append(finding)

        # Calculate severity and category counts
        high_count = sum(1 for f in all_findings if f.severity == Severity.HIGH)
        med_count = sum(1 for f in all_findings if f.severity == Severity.MEDIUM)
        low_count = sum(1 for f in all_findings if f.severity == Severity.LOW)
        context_dep_count = sum(1 for f in all_findings if f.is_context_dependent)

        if high_count > 0:
            overall_status = "FLAGGED"
        elif med_count > 0 or low_count > 0:
            overall_status = "REVIEW"
        else:
            overall_status = "PASS"

        return EvaluationResult(
            conversation_id=conversation.id,
            evaluation_mode=mode,
            overall_status=overall_status,
            findings=all_findings,
            total_issues=len(all_findings),
            high_severity_count=high_count,
            medium_severity_count=med_count,
            low_severity_count=low_count,
            context_dependent_count=context_dep_count,
        )

    def compare_modes(self, conversation: Conversation) -> ComparisonEvaluationResponse:
        """
        Runs both Turn-Level and Full-Context evaluations side-by-side,
        generating granular per-turn comparisons and explicit explanations of
        why context changed the evaluation outcome.
        """
        turn_result = self.evaluate_conversation(conversation, mode=EvaluationMode.TURN_LEVEL)
        full_result = self.evaluate_conversation(conversation, mode=EvaluationMode.FULL_CONTEXT)

        comparisons: List[TurnComparison] = []
        disagreements = 0
        context_dependent_uncovered = 0

        for turn in conversation.turns:
            t_findings = [f for f in turn_result.findings if f.turn_id == turn.turn_id]
            f_findings = [f for f in full_result.findings if f.turn_id == turn.turn_id]

            t_rule_ids = set(f.rule_id for f in t_findings)
            f_rule_ids = set(f.rule_id for f in f_findings)

            has_disagreement = (t_rule_ids != f_rule_ids)
            context_explanation = None

            if has_disagreement:
                disagreements += 1
                # Find findings that exist in full context but not in turn-level
                uncovered = [f for f in f_findings if f.rule_id not in t_rule_ids]
                if uncovered:
                    context_dependent_uncovered += len(uncovered)
                    rules_str = ", ".join(f"{f.rule_id} ({f.rule_name})" for f in uncovered)
                    context_notes = " ".join(f.conversation_context or "" for f in uncovered)
                    context_explanation = (
                        f"Context-dependent compliance issue detected: Evaluated in isolation (turn-level), "
                        f"this turn appeared ordinary or compliant. However, accounting for prior conversation context "
                        f"({context_notes.strip()}), this response triggered {rules_str}."
                    )

            comparisons.append(
                TurnComparison(
                    turn_id=turn.turn_id,
                    speaker=turn.speaker,
                    text=turn.text,
                    turn_level_findings=t_findings,
                    full_context_findings=f_findings,
                    has_disagreement=has_disagreement,
                    context_explanation=context_explanation,
                )
            )

        turn_result.turn_comparisons = comparisons
        full_result.turn_comparisons = comparisons

        return ComparisonEvaluationResponse(
            turn_level_result=turn_result,
            full_context_result=full_result,
            disagreements_count=disagreements,
            context_dependent_issues_uncovered=context_dependent_uncovered,
            turn_comparisons=comparisons,
        )


# Global singleton evaluator
evaluator = ComplianceEvaluator()
