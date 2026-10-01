import pytest
from ..models.schemas import (
    Conversation,
    ConversationTurn,
    ConversationMetadata,
    Role,
    EvaluationMode,
    Severity,
)
from ..engine.evaluator import ComplianceEvaluator
from ..engine.context_analyzer import ContextAnalyzer


@pytest.fixture
def evaluator():
    return ComplianceEvaluator()


def test_cease_contact_rule_context_dependence(evaluator):
    """
    Test REDLINE-001: Asking for a follow-up call after a cease request.
    In turn-level mode, "Would tomorrow afternoon work for another call?" appears compliant.
    In full-context mode, it is flagged as a cease-contact violation.
    """
    conv = Conversation(
        metadata=ConversationMetadata(),
        turns=[
            ConversationTurn(
                turn_id=1,
                speaker=Role.AGENT,
                text="Hello, this is Premier Financial. This is an attempt to collect a debt.",
            ),
            ConversationTurn(
                turn_id=2,
                speaker=Role.BORROWER,
                text="I don't want you calling me anymore. Stop calling.",
            ),
            ConversationTurn(
                turn_id=3,
                speaker=Role.AGENT,
                text="I understand.",
            ),
            ConversationTurn(
                turn_id=4,
                speaker=Role.AGENT,
                text="Would tomorrow afternoon work for another call?",
            ),
        ],
    )

    # 1. Turn-level evaluation
    turn_res = evaluator.evaluate_conversation(conv, mode=EvaluationMode.TURN_LEVEL)
    turn_4_findings = [f for f in turn_res.findings if f.turn_id == 4]
    assert len(turn_4_findings) == 0, "Turn-level check should miss Turn 4 because the question is isolated."

    # 2. Full-context evaluation
    full_res = evaluator.evaluate_conversation(conv, mode=EvaluationMode.FULL_CONTEXT)
    full_4_findings = [f for f in full_res.findings if f.turn_id == 4 and f.rule_id == "REDLINE-001"]
    assert len(full_4_findings) == 1, "Full-context check must catch Turn 4 cease-contact violation."
    assert full_4_findings[0].is_context_dependent is True
    assert "In Turn 2" in full_4_findings[0].conversation_context


def test_disputed_debt_rule_context_dependence(evaluator):
    """
    Test REDLINE-003: Demanding payment after an active dispute.
    In turn-level mode, asking for payment is standard.
    In full-context mode, it violates the validation pause requirement.
    """
    conv = Conversation(
        metadata=ConversationMetadata(),
        turns=[
            ConversationTurn(
                turn_id=1,
                speaker=Role.AGENT,
                text="Hello, this is an attempt to collect a debt.",
            ),
            ConversationTurn(
                turn_id=2,
                speaker=Role.BORROWER,
                text="I dispute this debt. Insurance already covered it.",
            ),
            ConversationTurn(
                turn_id=3,
                speaker=Role.AGENT,
                text="Can you pay the balance in full today with a debit card?",
            ),
        ],
    )

    turn_res = evaluator.evaluate_conversation(conv, mode=EvaluationMode.TURN_LEVEL)
    assert len(turn_res.findings) == 0, "Turn-level check misses dispute continuance without memory."

    full_res = evaluator.evaluate_conversation(conv, mode=EvaluationMode.FULL_CONTEXT)
    dispute_findings = [f for f in full_res.findings if f.rule_id == "REDLINE-003"]
    assert len(dispute_findings) == 1, "Full-context check flags continued payment demand on disputed debt."


def test_calling_time_rule(evaluator):
    """
    Test REDLINE-004: Permissible calling hours window (8:00 AM – 9:00 PM).
    """
    # 9:40 PM -> 21:40 (outside window)
    conv_bad = Conversation(
        metadata=ConversationMetadata(call_time="21:40"),
        turns=[ConversationTurn(turn_id=1, speaker=Role.AGENT, text="This is an attempt to collect a debt.")],
    )
    res_bad = evaluator.evaluate_conversation(conv_bad, mode=EvaluationMode.FULL_CONTEXT)
    assert any(f.rule_id == "REDLINE-004" for f in res_bad.findings)

    # 2:15 PM -> 14:15 (inside window)
    conv_good = Conversation(
        metadata=ConversationMetadata(call_time="14:15"),
        turns=[ConversationTurn(turn_id=1, speaker=Role.AGENT, text="This is an attempt to collect a debt.")],
    )
    res_good = evaluator.evaluate_conversation(conv_good, mode=EvaluationMode.FULL_CONTEXT)
    assert not any(f.rule_id == "REDLINE-004" for f in res_good.findings)


def test_repeated_contact_rule(evaluator):
    """
    Test REDLINE-006: 7-in-7 call frequency presumption rule.
    """
    conv_8 = Conversation(
        metadata=ConversationMetadata(call_attempts_last_7_days=8),
        turns=[ConversationTurn(turn_id=1, speaker=Role.AGENT, text="This is an attempt to collect a debt.")],
    )
    res_8 = evaluator.evaluate_conversation(conv_8, mode=EvaluationMode.FULL_CONTEXT)
    assert any(f.rule_id == "REDLINE-006" for f in res_8.findings)

    conv_4 = Conversation(
        metadata=ConversationMetadata(call_attempts_last_7_days=4),
        turns=[ConversationTurn(turn_id=1, speaker=Role.AGENT, text="This is an attempt to collect a debt.")],
    )
    res_4 = evaluator.evaluate_conversation(conv_4, mode=EvaluationMode.FULL_CONTEXT)
    assert not any(f.rule_id == "REDLINE-006" for f in res_4.findings)


def test_misleading_legal_threat_rule(evaluator):
    """
    Test REDLINE-005: Unlawful threat of immediate garnishment or lawsuit.
    """
    conv = Conversation(
        metadata=ConversationMetadata(),
        turns=[
            ConversationTurn(
                turn_id=1,
                speaker=Role.AGENT,
                text="This is an attempt to collect a debt. We will immediately file a lawsuit and garnish your wages tomorrow.",
            )
        ],
    )
    res = evaluator.evaluate_conversation(conv, mode=EvaluationMode.TURN_LEVEL)
    assert any(f.rule_id == "REDLINE-005" for f in res.findings)


def test_context_analyzer_state_progression():
    """
    Test that ContextAnalyzer correctly accumulates state through multiple turns.
    """
    meta = ConversationMetadata(is_third_party=False)
    analyzer = ContextAnalyzer(meta)

    # Turn 1
    t1 = ConversationTurn(turn_id=1, speaker=Role.AGENT, text="This is an attempt to collect a debt.")
    s1 = analyzer.process_turn(t1)
    assert s1["mini_miranda_disclosed"] is True
    assert s1["borrower_has_ceased"] is False

    # Turn 2
    t2 = ConversationTurn(turn_id=2, speaker=Role.BORROWER, text="Please stop calling me.")
    s2 = analyzer.process_turn(t2)
    assert s2["borrower_has_ceased"] is True
    assert s2["cease_turn_id"] == 2
