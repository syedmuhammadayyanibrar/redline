from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class Role(str, Enum):
    BORROWER = "borrower"
    AGENT = "agent"
    THIRD_PARTY = "third_party"
    SYSTEM = "system"


class EvaluationMode(str, Enum):
    TURN_LEVEL = "turn_level"
    FULL_CONTEXT = "full_context"


class Severity(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class Confidence(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ConversationTurn(BaseModel):
    turn_id: int
    speaker: Role
    text: str
    timestamp: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None


class ConversationMetadata(BaseModel):
    call_time: Optional[str] = "14:15"
    call_attempts_last_7_days: Optional[int] = 1
    borrower_name: Optional[str] = "Alex Rivera"
    recipient_relationship: Optional[str] = "borrower"
    is_third_party: Optional[bool] = False
    account_balance: Optional[float] = 450.00


class Conversation(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = "Custom Conversation"
    metadata: ConversationMetadata = Field(default_factory=ConversationMetadata)
    turns: List[ConversationTurn] = Field(default_factory=list)


class ComplianceFinding(BaseModel):
    rule_id: str
    rule_name: str
    severity: Severity
    turn_id: int
    triggering_text: str
    explanation: str
    conversation_context: Optional[str] = None
    evaluation_mode: EvaluationMode
    confidence: Confidence = Confidence.HIGH
    remediation: str
    is_context_dependent: bool = False
    statutory_citation: str


class TurnComparison(BaseModel):
    turn_id: int
    speaker: Role
    text: str
    turn_level_findings: List[ComplianceFinding] = Field(default_factory=list)
    full_context_findings: List[ComplianceFinding] = Field(default_factory=list)
    has_disagreement: bool = False
    context_explanation: Optional[str] = None


class EvaluationResult(BaseModel):
    conversation_id: Optional[str] = None
    evaluation_mode: EvaluationMode
    overall_status: str  # "PASS", "REVIEW", "FLAGGED"
    findings: List[ComplianceFinding] = Field(default_factory=list)
    total_issues: int = 0
    high_severity_count: int = 0
    medium_severity_count: int = 0
    low_severity_count: int = 0
    context_dependent_count: int = 0
    turn_comparisons: Optional[List[TurnComparison]] = None


class Scenario(BaseModel):
    id: str
    title: str
    description: str
    category: str
    compliance_concepts: List[str]
    expected_status_naive: str = "FLAGGED"
    expected_status_guarded: str = "PASS"
    severity: Severity = Severity.HIGH
    baseline_conversation: Conversation
    guarded_conversation: Conversation
    expected_findings: List[str] = Field(default_factory=list)
    context_dependent_findings: List[str] = Field(default_factory=list)


class CustomEvaluationRequest(BaseModel):
    transcript_text: str
    local_time: Optional[str] = "14:15"
    attempts_7_days: Optional[int] = 1
    is_third_party: Optional[bool] = False
    mode: Optional[EvaluationMode] = EvaluationMode.FULL_CONTEXT


class ComparisonEvaluationResponse(BaseModel):
    turn_level_result: EvaluationResult
    full_context_result: EvaluationResult
    disagreements_count: int
    context_dependent_issues_uncovered: int
    turn_comparisons: List[TurnComparison]


class ScenarioBenchmarkItem(BaseModel):
    scenario_id: str
    scenario_title: str
    agent_type: str  # "baseline" | "guarded"
    expected_outcome: str  # "FLAGGED" | "PASS"
    turn_level_outcome: str
    full_context_outcome: str
    turn_level_correct: bool
    full_context_correct: bool
    has_disagreement: bool
    context_dependent_issues: int


class BenchmarkSummary(BaseModel):
    total_test_cases: int
    full_context_accuracy: float
    turn_level_accuracy: float
    turn_vs_full_disagreements: int
    context_dependent_violations_caught: int
    false_negatives_in_turn_level: int
    benchmark_items: List[ScenarioBenchmarkItem]
