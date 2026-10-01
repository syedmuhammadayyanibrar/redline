import re
from typing import Optional, Dict, Any
from .base import ComplianceRule
from ..models.schemas import (
    Conversation,
    ConversationTurn,
    ComplianceFinding,
    EvaluationMode,
    Severity,
    Confidence,
    Role,
)


class CeaseContactRule(ComplianceRule):
    """
    REDLINE-001: Cease-Contact Request
    FDCPA § 805(c) / 15 U.S.C. § 1692c(c)
    Context-dependent: An agent asking to schedule a follow-up or demanding payment
    is completely ordinary in isolation, but potentially violates § 805(c) if the borrower
    previously stated 'stop calling me' or requested communication cease.
    """

    def __init__(self):
        super().__init__(
            rule_id="REDLINE-001",
            name="Contact After Cease-Communication Request",
            description="Simplified test for continued collection pressure or scheduling after a consumer requests cessation of communications.",
            simplified_test_condition="Agent requests payment, proposes future contact, or pushes resolution after consumer stated 'stop calling', 'cease', or 'do not contact'.",
            severity=Severity.HIGH,
            remediation="Immediately acknowledge the cease request, log the communication preference, advise that collection phone calls will cease, and terminate the call.",
            context_requirements="Requires tracking prior borrower turns for explicit cease-communication requests across the conversation history.",
            statutory_citation="FDCPA § 805(c) / 15 U.S.C. § 1692c(c)",
            is_context_dependent=True,
        )

    def evaluate(
        self,
        turn: ConversationTurn,
        turn_index: int,
        conversation: Conversation,
        mode: EvaluationMode,
        context_state: Dict[str, Any],
    ) -> Optional[ComplianceFinding]:
        if turn.speaker != Role.AGENT:
            return None

        text_lower = turn.text.lower()

        # Turn-level check: only looks at current turn text
        if mode == EvaluationMode.TURN_LEVEL:
            # In turn-level mode, agent line alone rarely says "I know you told me to stop calling".
            # If the agent explicitly references ignoring the cease request in this exact turn:
            explicit_ignoring = bool(
                re.search(r"even though you said stop|despite your request to stop", text_lower)
            )
            if explicit_ignoring:
                return ComplianceFinding(
                    rule_id=self.rule_id,
                    rule_name=self.name,
                    severity=self.severity,
                    turn_id=turn.turn_id,
                    triggering_text=turn.text,
                    explanation="Potential violation: Agent explicitly noted a request to stop calling but continued contacting.",
                    conversation_context=None,
                    evaluation_mode=mode,
                    confidence=Confidence.HIGH,
                    remediation=self.remediation,
                    is_context_dependent=True,
                    statutory_citation=self.statutory_citation,
                )
            return None

        # Full-context mode:
        has_ceased = context_state.get("borrower_has_ceased", False)
        cease_turn_id = context_state.get("cease_turn_id")
        cease_text = context_state.get("cease_text")

        if not has_ceased:
            return None

        # Check if the agent is pushing payment, proposing a follow-up call, or refusing to cease
        is_pushing = bool(
            re.search(
                r"(call you (back|tomorrow|later)|another call|schedule|pay|payment|settle|debit|card|\$\d+|balance|owe|current|resolve this)",
                text_lower,
            )
        )
        # Check if agent is properly acknowledging and ending
        is_proper_closing = bool(
            re.search(
                r"(will not receive any further phone calls|cease all further telephone communication|marked your account to cease|no further calls|goodbye|have documented your request and immediately marked)",
                text_lower,
            )
        )

        if is_pushing and not is_proper_closing:
            return ComplianceFinding(
                rule_id=self.rule_id,
                rule_name=self.name,
                severity=self.severity,
                turn_id=turn.turn_id,
                triggering_text=turn.text,
                explanation="Potential violation: Agent continued demanding payment or proposing follow-up communication after consumer explicitly invoked their statutory right to cease phone contact.",
                conversation_context=f"In Turn {cease_turn_id}, borrower stated: \"{cease_text}\".",
                evaluation_mode=mode,
                confidence=Confidence.HIGH,
                remediation=self.remediation,
                is_context_dependent=True,
                statutory_citation=self.statutory_citation,
            )

        return None


class ThirdPartyDisclosureRule(ComplianceRule):
    """
    REDLINE-002: Third-Party Disclosure
    FDCPA § 805(b) / 15 U.S.C. § 1692c(b)
    Disclosing debt details, balance, or collection purpose to someone other than borrower.
    """

    def __init__(self):
        super().__init__(
            rule_id="REDLINE-002",
            name="Prohibited Third-Party Disclosure",
            description="Simplified test for disclosing debt existence, balance, or collection details to an unauthorized third party.",
            simplified_test_condition="Agent reveals overdue balance, account delinquency, or debt collection purpose to someone identified as a spouse, roommate, or third party.",
            severity=Severity.HIGH,
            remediation="When speaking with a third party, confirm location information only or request a neutral callback without revealing the existence of a debt.",
            context_requirements="Requires recipient identity context (metadata or earlier turn identifying respondent as non-borrower).",
            statutory_citation="FDCPA § 805(b) / 15 U.S.C. § 1692c(b)",
            is_context_dependent=True,
        )

    def evaluate(
        self,
        turn: ConversationTurn,
        turn_index: int,
        conversation: Conversation,
        mode: EvaluationMode,
        context_state: Dict[str, Any],
    ) -> Optional[ComplianceFinding]:
        if turn.speaker != Role.AGENT:
            return None

        text_lower = turn.text.lower()
        reveals_debt = bool(
            re.search(
                r"(debt|balance|\$\d+|past[- ]due|delinquent|overdue|collections|owe|visa|credit card|loan|medical bill)",
                text_lower,
            )
        )

        if not reveals_debt:
            return None

        if mode == EvaluationMode.TURN_LEVEL:
            # Turn-level: can only flag if current turn text explicitly acknowledges third party
            explicit_third_party = bool(
                re.search(r"(tell your husband|tell your wife|as his spouse|since you're his|tell him he owes)", text_lower)
            )
            if explicit_third_party:
                return ComplianceFinding(
                    rule_id=self.rule_id,
                    rule_name=self.name,
                    severity=self.severity,
                    turn_id=turn.turn_id,
                    triggering_text=turn.text,
                    explanation="Potential violation: Agent disclosed debt details to a third party within this turn.",
                    conversation_context=None,
                    evaluation_mode=mode,
                    confidence=Confidence.HIGH,
                    remediation=self.remediation,
                    is_context_dependent=False,
                    statutory_citation=self.statutory_citation,
                )
            return None

        # Full context mode:
        is_third_party = (
            context_state.get("is_third_party", False)
            or conversation.metadata.is_third_party
            or (conversation.metadata.recipient_relationship and conversation.metadata.recipient_relationship.lower() != "borrower")
        )

        if is_third_party:
            third_party_info = context_state.get("third_party_identifier", "third party")
            return ComplianceFinding(
                rule_id=self.rule_id,
                rule_name=self.name,
                severity=self.severity,
                turn_id=turn.turn_id,
                triggering_text=turn.text,
                explanation="Potential violation: Agent disclosed delinquent debt details to a third party without verified consumer consent.",
                conversation_context=f"Call recipient identified as {third_party_info} earlier in conversation or call metadata.",
                evaluation_mode=mode,
                confidence=Confidence.HIGH,
                remediation=self.remediation,
                is_context_dependent=True,
                statutory_citation=self.statutory_citation,
            )

        return None


class DisputedDebtRule(ComplianceRule):
    """
    REDLINE-003: Disputed Debt Validation Pause
    FDCPA § 809(b) / 15 U.S.C. § 1692g(b)
    Context-dependent: Demanding payment after a dispute without pausing and offering verification.
    """

    def __init__(self):
        super().__init__(
            rule_id="REDLINE-003",
            name="Collection Continuance on Disputed Debt",
            description="Simplified test for continuing payment demands after consumer disputes the debt without offering validation notice.",
            simplified_test_condition="Agent insists on payment or threatens penalties after consumer disputes debt validity, without pausing collection.",
            severity=Severity.HIGH,
            remediation="Log the dispute, halt all immediate payment demands, and advise that written debt validation will be mailed.",
            context_requirements="Requires tracking prior borrower turns for debt dispute or claim of billing/insurance error.",
            statutory_citation="FDCPA § 809(b) / 15 U.S.C. § 1692g(b)",
            is_context_dependent=True,
        )

    def evaluate(
        self,
        turn: ConversationTurn,
        turn_index: int,
        conversation: Conversation,
        mode: EvaluationMode,
        context_state: Dict[str, Any],
    ) -> Optional[ComplianceFinding]:
        if turn.speaker != Role.AGENT:
            return None

        text_lower = turn.text.lower()

        if mode == EvaluationMode.TURN_LEVEL:
            # Turn level check: isolated payment demand without context cannot be identified as a dispute violation
            return None

        # Full context mode:
        has_disputed = context_state.get("borrower_has_disputed", False)
        if not has_disputed:
            return None

        dispute_turn_id = context_state.get("dispute_turn_id")
        dispute_text = context_state.get("dispute_text")

        offers_validation = bool(
            re.search(
                r"(validation|verification|pause|pausing|investigat|mail you proof|itemized|packet)",
                text_lower,
            )
        )
        demands_payment = bool(
            re.search(
                r"(pay|payment|settle|balance|liable|\$\d+|card|due today|penalty|accrue)",
                text_lower,
            )
        )

        if demands_payment and not offers_validation:
            return ComplianceFinding(
                rule_id=self.rule_id,
                rule_name=self.name,
                severity=self.severity,
                turn_id=turn.turn_id,
                triggering_text=turn.text,
                explanation="Potential violation: Agent continued demanding payment on an actively disputed debt without pausing collection or providing validation notices.",
                conversation_context=f"In Turn {dispute_turn_id}, borrower stated: \"{dispute_text}\".",
                evaluation_mode=mode,
                confidence=Confidence.HIGH,
                remediation=self.remediation,
                is_context_dependent=True,
                statutory_citation=self.statutory_citation,
            )

        return None


class CallingTimeRestrictionRule(ComplianceRule):
    """
    REDLINE-004: Calling-Time Restriction
    Regulation F 12 CFR § 1006.6(b)(1)
    Outside 8:00 AM – 9:00 PM borrower local time.
    """

    def __init__(self):
        super().__init__(
            rule_id="REDLINE-004",
            name="Calling-Time Restriction",
            description="Simplified test for placing collection calls outside the permissible window of 8:00 AM – 9:00 PM local time.",
            simplified_test_condition="Call placed before 8:00 AM or after 9:00 PM at the consumer's local time.",
            severity=Severity.HIGH,
            remediation="Implement pre-dial timezone verification and suppress outbound calls outside permissible local hours.",
            context_requirements="Requires call local time metadata.",
            statutory_citation="12 CFR § 1006.6(b)(1)",
            is_context_dependent=False,
        )

    def evaluate(
        self,
        turn: ConversationTurn,
        turn_index: int,
        conversation: Conversation,
        mode: EvaluationMode,
        context_state: Dict[str, Any],
    ) -> Optional[ComplianceFinding]:
        # Only evaluate on the first agent turn or turn_index <= 1
        if turn_index > 1 or turn.speaker != Role.AGENT:
            return None

        local_time_str = conversation.metadata.call_time or "14:15"
        mins = self._parse_minutes(local_time_str)

        # 8:00 AM = 480, 9:00 PM = 1260
        if mins < 480 or mins > 1260:
            return ComplianceFinding(
                rule_id=self.rule_id,
                rule_name=self.name,
                severity=self.severity,
                turn_id=turn.turn_id,
                triggering_text=f"Call initiated at {local_time_str} local time: '{turn.text[:60]}...'",
                explanation=f"Potential violation: Outbound call conducted at {local_time_str} borrower local time, outside statutory calling window (8:00 AM – 9:00 PM).",
                conversation_context=f"Call metadata indicates borrower local time is {local_time_str}.",
                evaluation_mode=mode,
                confidence=Confidence.HIGH,
                remediation=self.remediation,
                is_context_dependent=False,
                statutory_citation=self.statutory_citation,
            )

        return None

    def _parse_minutes(self, t_str: str) -> int:
        match = re.search(r"(\d+):(\d+)\s*(AM|PM)?", t_str.strip().upper())
        if match:
            h = int(match.group(1))
            m = int(match.group(2))
            ampm = match.group(3)
            if ampm == "PM" and h < 12:
                h += 12
            elif ampm == "AM" and h == 12:
                h = 0
            return h * 60 + m
        return 720


class MisleadingLegalThreatRule(ComplianceRule):
    """
    REDLINE-005: Misleading Representation & False Threats
    FDCPA § 807(4)-(5) / 15 U.S.C. § 1692e(4)-(5)
    Threatening immediate lawsuit, wage garnishment, bank seizure, or arrest without court order.
    """

    def __init__(self):
        super().__init__(
            rule_id="REDLINE-005",
            name="Deceptive & Misleading Legal Threats",
            description="Simplified test for unlawful or deceptive threats of legal action, wage garnishment, or asset seizure.",
            simplified_test_condition="Agent threatens immediate lawsuit, wage garnishment, asset seizure, or process server dispatch without court judgment.",
            severity=Severity.HIGH,
            remediation="Refrain from threatening legal remedies that cannot legally be taken or that the collector does not have authority to initiate.",
            context_requirements="Turn-level textual content containing prohibited legal threat keywords.",
            statutory_citation="FDCPA § 807(4)-(5) / 15 U.S.C. § 1692e(4)-(5)",
            is_context_dependent=False,
        )

    def evaluate(
        self,
        turn: ConversationTurn,
        turn_index: int,
        conversation: Conversation,
        mode: EvaluationMode,
        context_state: Dict[str, Any],
    ) -> Optional[ComplianceFinding]:
        if turn.speaker != Role.AGENT:
            return None

        text_lower = turn.text.lower()
        threat_match = re.search(
            r"(garnish|wage garnishment|lawsuit|file a lawsuit|process server|seize your|seizure|legal department will send|take you to court|arrest|jail)",
            text_lower,
        )

        if threat_match:
            return ComplianceFinding(
                rule_id=self.rule_id,
                rule_name=self.name,
                severity=self.severity,
                turn_id=turn.turn_id,
                triggering_text=turn.text,
                explanation="Potential violation: Agent threatened immediate legal proceedings, wage garnishment, or process server dispatch without verified court judgment or statutory authority.",
                conversation_context=None,
                evaluation_mode=mode,
                confidence=Confidence.HIGH,
                remediation=self.remediation,
                is_context_dependent=False,
                statutory_citation=self.statutory_citation,
            )

        return None


class RepeatedContactRule(ComplianceRule):
    """
    REDLINE-006: Repeated Contact & Call Frequency (7-in-7 Rule)
    Regulation F 12 CFR § 1006.14(b)(2)
    Placing more than 7 calls in 7 consecutive days.
    """

    def __init__(self):
        super().__init__(
            rule_id="REDLINE-006",
            name="Repeated Contact / Frequency Capping",
            description="Simplified test for exceeding statutory call frequency limits (more than 7 attempts in 7 rolling days).",
            simplified_test_condition="Call frequency metadata reflects more than 7 attempts within a 7-day rolling window.",
            severity=Severity.HIGH,
            remediation="Implement automated dialer frequency caps ensuring no more than 7 outbound attempts per 7 consecutive days.",
            context_requirements="Requires 7-day call history metadata.",
            statutory_citation="12 CFR § 1006.14(b)(2)",
            is_context_dependent=False,
        )

    def evaluate(
        self,
        turn: ConversationTurn,
        turn_index: int,
        conversation: Conversation,
        mode: EvaluationMode,
        context_state: Dict[str, Any],
    ) -> Optional[ComplianceFinding]:
        if turn_index > 1 or turn.speaker != Role.AGENT:
            return None

        attempts = conversation.metadata.call_attempts_last_7_days or 1
        if attempts > 7:
            return ComplianceFinding(
                rule_id=self.rule_id,
                rule_name=self.name,
                severity=self.severity,
                turn_id=turn.turn_id,
                triggering_text=f"Attempt #{attempts} in 7 days: '{turn.text[:60]}...'",
                explanation=f"Potential violation: {attempts} call attempts in 7 days exceeds the statutory ceiling of 7 telephone calls within 7 consecutive days.",
                conversation_context=f"Dialer attempt count is {attempts} in rolling 7-day window.",
                evaluation_mode=mode,
                confidence=Confidence.HIGH,
                remediation=self.remediation,
                is_context_dependent=False,
                statutory_citation=self.statutory_citation,
            )

        return None


class SensitiveDataThirdPartyRule(ComplianceRule):
    """
    REDLINE-007: Sensitive Information Disclosed to Third Party
    FDCPA § 805(b) & CFPB Privacy Guidelines
    Disclosing specific debt amounts, card numbers, or medical/loan details to third party.
    """

    def __init__(self):
        super().__init__(
            rule_id="REDLINE-007",
            name="Sensitive Financial Disclosure to Non-Consumer",
            description="Simplified test for disclosing exact account balances, card identifiers, or medical details to an unverified third party.",
            simplified_test_condition="Agent discloses exact financial figures or account numbers after recipient identifies as non-consumer.",
            severity=Severity.HIGH,
            remediation="Never disclose specific dollar balances, card suffixes, or creditor names to non-consumers.",
            context_requirements="Recipient identity context and explicit account disclosure patterns.",
            statutory_citation="FDCPA § 805(b) / 15 U.S.C. § 1692c(b)",
            is_context_dependent=True,
        )

    def evaluate(
        self,
        turn: ConversationTurn,
        turn_index: int,
        conversation: Conversation,
        mode: EvaluationMode,
        context_state: Dict[str, Any],
    ) -> Optional[ComplianceFinding]:
        if turn.speaker != Role.AGENT:
            return None

        text_lower = turn.text.lower()
        has_specific_data = bool(re.search(r"(\$\d[\d,]*|ending in \d{4}|visa|mastercard|delinquent \d+ days)", text_lower))

        if not has_specific_data:
            return None

        if mode == EvaluationMode.TURN_LEVEL:
            return None

        is_third_party = (
            context_state.get("is_third_party", False)
            or conversation.metadata.is_third_party
        )

        if is_third_party:
            return ComplianceFinding(
                rule_id=self.rule_id,
                rule_name=self.name,
                severity=self.severity,
                turn_id=turn.turn_id,
                triggering_text=turn.text,
                explanation="Potential violation: Agent disclosed sensitive account numbers and specific dollar amounts to a third party.",
                conversation_context="Recipient confirmed as non-borrower in earlier turns.",
                evaluation_mode=mode,
                confidence=Confidence.HIGH,
                remediation=self.remediation,
                is_context_dependent=True,
                statutory_citation=self.statutory_citation,
            )

        return None


class HardshipDisregardRule(ComplianceRule):
    """
    REDLINE-008: Hardship Disregard / Inability-to-Pay Coercion
    CFPB Unfair & Abusive Practices / FDCPA § 806
    When consumer explicitly discloses severe hardship (job loss, medical emergency),
    agent refuses hardship forbearance and coercively demands immediate payment under penalty of escalation.
    """

    def __init__(self):
        super().__init__(
            rule_id="REDLINE-008",
            name="Inability-to-Pay Coercion / Hardship Disregard",
            description="Simplified test for refusing hardship options and coercively demanding payment after consumer expresses total inability to pay.",
            simplified_test_condition="Agent rejects consumer's stated job loss or severe hardship and presses for immediate settlement under threat of escalation.",
            severity=Severity.HIGH,
            remediation="Provide hardship program information or pause collection attempts when consumer demonstrates temporary catastrophic insolvency.",
            context_requirements="Requires prior borrower turn indicating job loss or severe financial insolvency.",
            statutory_citation="FDCPA § 806 / CFPB Examination Procedures",
            is_context_dependent=True,
        )

    def evaluate(
        self,
        turn: ConversationTurn,
        turn_index: int,
        conversation: Conversation,
        mode: EvaluationMode,
        context_state: Dict[str, Any],
    ) -> Optional[ComplianceFinding]:
        if turn.speaker != Role.AGENT:
            return None

        text_lower = turn.text.lower()

        if mode == EvaluationMode.TURN_LEVEL:
            return None

        has_hardship = context_state.get("borrower_has_hardship", False)
        if not has_hardship:
            return None

        hardship_turn_id = context_state.get("hardship_turn_id")
        hardship_text = context_state.get("hardship_text")

        offers_relief = bool(re.search(r"(hardship|forbearance|assistance|options|help you|pause|hold)", text_lower))
        pushes_payment = bool(re.search(r"(pay|payment|settle|must pay|need \$|\$\d+|today|card|penalty|default)", text_lower))

        if pushes_payment and not offers_relief:
            return ComplianceFinding(
                rule_id=self.rule_id,
                rule_name=self.name,
                severity=self.severity,
                turn_id=turn.turn_id,
                triggering_text=turn.text,
                explanation="Potential violation: Agent dismissed stated unemployment or severe hardship and coerced immediate payment without offering standard forbearance options.",
                conversation_context=f"In Turn {hardship_turn_id}, borrower stated: \"{hardship_text}\".",
                evaluation_mode=mode,
                confidence=Confidence.MEDIUM,
                remediation=self.remediation,
                is_context_dependent=True,
                statutory_citation=self.statutory_citation,
            )

        return None


class MiniMirandaRule(ComplianceRule):
    """
    REDLINE-009: Mini-Miranda Disclosure Omission
    FDCPA § 807(11) / 15 U.S.C. § 1692e(11)
    Initial communication must disclose that caller is attempting to collect a debt.
    Only applies to the initial agent turn.
    """

    def __init__(self):
        super().__init__(
            rule_id="REDLINE-009",
            name="Mini-Miranda Statutory Disclosure Omission",
            description="Simplified test for omitting the mandatory statutory disclosure in initial collection communication.",
            simplified_test_condition="Agent discusses account balance or demands payment in opening statement without stating 'attempt to collect a debt'.",
            severity=Severity.HIGH,
            remediation="State the mandatory statutory disclosure in the opening statement of the initial collection conversation.",
            context_requirements="Initial agent turn in call.",
            statutory_citation="FDCPA § 807(11) / 15 U.S.C. § 1692e(11)",
            is_context_dependent=False,
        )

    def evaluate(
        self,
        turn: ConversationTurn,
        turn_index: int,
        conversation: Conversation,
        mode: EvaluationMode,
        context_state: Dict[str, Any],
    ) -> Optional[ComplianceFinding]:
        if turn.speaker != Role.AGENT:
            return None

        # Mini-Miranda is required in the INITIAL communication turn by the agent
        # Find index of first agent turn in conversation
        first_agent_turn_id = next(
            (t.turn_id for t in conversation.turns if t.speaker == Role.AGENT), None
        )
        if turn.turn_id != first_agent_turn_id:
            return None

        text_lower = turn.text.lower()
        discusses_debt = bool(re.search(r"(debt|balance|past[- ]due|delinquent|unpaid|account|pay|payment|settle|\$\d+)", text_lower))

        if not discusses_debt:
            return None

        has_disclosure_in_this_turn = bool(
            re.search(r"(attempt to collect a debt|debt collector|information obtained will be used for that purpose)", text_lower)
        )

        is_third_party = (
            context_state.get("is_third_party", False)
            or conversation.metadata.is_third_party
        )

        if not has_disclosure_in_this_turn and not is_third_party:
            return ComplianceFinding(
                rule_id=self.rule_id,
                rule_name=self.name,
                severity=self.severity,
                turn_id=turn.turn_id,
                triggering_text=turn.text,
                explanation="Potential violation: Agent discussed debt balance or requested payment in opening turn without providing the mandatory Mini-Miranda disclosure.",
                conversation_context=None,
                evaluation_mode=mode,
                confidence=Confidence.HIGH,
                remediation=self.remediation,
                is_context_dependent=False,
                statutory_citation=self.statutory_citation,
            )

        return None
