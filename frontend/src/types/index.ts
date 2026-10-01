export type Role = 'borrower' | 'agent' | 'third_party' | 'system';

export type EvaluationMode = 'turn_level' | 'full_context';

export type Severity = 'HIGH' | 'MEDIUM' | 'LOW';

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ConversationTurn {
  turn_id: number;
  speaker: Role;
  text: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export interface ConversationMetadata {
  call_time?: string;
  call_attempts_last_7_days?: number;
  borrower_name?: string;
  recipient_relationship?: string;
  is_third_party?: boolean;
  account_balance?: number;
}

export interface Conversation {
  id?: string;
  title?: string;
  metadata: ConversationMetadata;
  turns: ConversationTurn[];
}

export interface ComplianceFinding {
  rule_id: string;
  rule_name: string;
  severity: Severity;
  turn_id: number;
  triggering_text: string;
  explanation: string;
  conversation_context?: string;
  evaluation_mode: EvaluationMode;
  confidence: Confidence;
  remediation: string;
  is_context_dependent: boolean;
  statutory_citation: string;
}

export interface TurnComparison {
  turn_id: number;
  speaker: Role;
  text: string;
  turn_level_findings: ComplianceFinding[];
  full_context_findings: ComplianceFinding[];
  has_disagreement: boolean;
  context_explanation?: string;
}

export interface EvaluationResult {
  conversation_id?: string;
  evaluation_mode: EvaluationMode;
  overall_status: 'PASS' | 'REVIEW' | 'FLAGGED';
  findings: ComplianceFinding[];
  total_issues: number;
  high_severity_count: number;
  medium_severity_count: number;
  low_severity_count: number;
  context_dependent_count: number;
  turn_comparisons?: TurnComparison[];
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  category: string;
  compliance_concepts: string[];
  expected_status_naive: string;
  expected_status_guarded: string;
  severity: Severity;
  baseline_conversation: Conversation;
  guarded_conversation: Conversation;
  expected_findings: string[];
  context_dependent_findings: string[];
}

export interface ComparisonEvaluationResponse {
  turn_level_result: EvaluationResult;
  full_context_result: EvaluationResult;
  disagreements_count: number;
  context_dependent_issues_uncovered: number;
  turn_comparisons: TurnComparison[];
}

export interface ScenarioBenchmarkItem {
  scenario_id: string;
  scenario_title: string;
  agent_type: string;
  expected_outcome: string;
  turn_level_outcome: string;
  full_context_outcome: string;
  turn_level_correct: boolean;
  full_context_correct: boolean;
  has_disagreement: boolean;
  context_dependent_issues: number;
}

export interface CustomEvaluationRequest {
  transcript_text: string;
  local_time?: string;
  attempts_7_days?: number;
  is_third_party?: boolean;
  mode?: EvaluationMode;
}

export interface BenchmarkSummary {
  total_test_cases: number;
  full_context_accuracy: number;
  turn_level_accuracy: number;
  turn_vs_full_disagreements: number;
  context_dependent_violations_caught: number;
  false_negatives_in_turn_level: number;
  benchmark_items: ScenarioBenchmarkItem[];
}

export interface ComplianceRuleMeta {
  rule_id: string;
  name: string;
  description: string;
  simplified_test_condition: string;
  severity: string;
  remediation: string;
  context_requirements: string;
  statutory_citation: string;
  is_context_dependent: boolean;
}
