from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from ..models.schemas import (
    Conversation,
    ConversationTurn,
    ComplianceFinding,
    EvaluationMode,
    Severity,
    Confidence,
)


class ComplianceRule(ABC):
    """
    Base class for a deterministic, simplified compliance rule.
    Each rule provides explicit metadata, context requirements, and a check method.
    """

    def __init__(
        self,
        rule_id: str,
        name: str,
        description: str,
        simplified_test_condition: str,
        severity: Severity,
        remediation: str,
        context_requirements: str,
        statutory_citation: str,
        is_context_dependent: bool = False,
    ):
        self.rule_id = rule_id
        self.name = name
        self.description = description
        self.simplified_test_condition = simplified_test_condition
        self.severity = severity
        self.remediation = remediation
        self.context_requirements = context_requirements
        self.statutory_citation = statutory_citation
        self.is_context_dependent = is_context_dependent

    @abstractmethod
    def evaluate(
        self,
        turn: ConversationTurn,
        turn_index: int,
        conversation: Conversation,
        mode: EvaluationMode,
        context_state: Dict[str, Any],
    ) -> Optional[ComplianceFinding]:
        """
        Evaluate a single turn under the specified evaluation mode.
        Returns a ComplianceFinding if a potential violation is detected, else None.
        """
        pass

    def to_dict(self) -> Dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "name": self.name,
            "description": self.description,
            "simplified_test_condition": self.simplified_test_condition,
            "severity": self.severity.value,
            "remediation": self.remediation,
            "context_requirements": self.context_requirements,
            "statutory_citation": self.statutory_citation,
            "is_context_dependent": self.is_context_dependent,
        }
