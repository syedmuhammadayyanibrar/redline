import {
  Scenario,
  ComplianceRuleMeta,
  ComparisonEvaluationResponse,
  BenchmarkSummary,
  CustomEvaluationRequest,
  Conversation,
} from '../types';
import {
  FALLBACK_RULES,
  FALLBACK_SCENARIOS,
  compareLocalConversation,
  computeLocalBenchmark,
} from './fallback-data';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

async function fetchWithFallback<T>(url: string, options?: RequestInit, fallbackFn?: () => T): Promise<T> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    if (fallbackFn) {
      return fallbackFn();
    }
    throw err;
  }
}

export async function getRules(): Promise<ComplianceRuleMeta[]> {
  return fetchWithFallback<ComplianceRuleMeta[]>(
    `${API_BASE}/rules`,
    { method: 'GET' },
    () => FALLBACK_RULES
  );
}

export async function getScenarios(): Promise<Scenario[]> {
  return fetchWithFallback<Scenario[]>(
    `${API_BASE}/scenarios`,
    { method: 'GET' },
    () => FALLBACK_SCENARIOS
  );
}

export async function compareScenario(
  scenarioId: string,
  agentType: 'baseline' | 'guarded'
): Promise<ComparisonEvaluationResponse> {
  return fetchWithFallback<ComparisonEvaluationResponse>(
    `${API_BASE}/scenarios/${scenarioId}/compare?agent_type=${agentType}`,
    { method: 'POST' },
    () => {
      const scenario = FALLBACK_SCENARIOS.find((s) => s.id === scenarioId) || FALLBACK_SCENARIOS[0];
      const conv = agentType === 'baseline' ? scenario.baseline_conversation : scenario.guarded_conversation;
      return compareLocalConversation(conv);
    }
  );
}

export async function evaluateCustomTranscript(
  request: CustomEvaluationRequest
): Promise<ComparisonEvaluationResponse> {
  return fetchWithFallback<ComparisonEvaluationResponse>(
    `${API_BASE}/evaluate/custom`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
    () => {
      // Local parsing and evaluation
      const lines = request.transcript_text.trim().split('\n').filter(Boolean);
      const turns = lines.map((line, idx) => {
        const isAgent = /^agent:/i.test(line);
        const text = line.replace(/^(agent|borrower|third[\s_-]?party|spouse|roommate):\s*/i, '').trim();
        return {
          turn_id: idx + 1,
          speaker: (isAgent ? 'agent' : 'borrower') as any,
          text: text || line,
        };
      });

      const conv: Conversation = {
        id: 'CUSTOM-LOCAL',
        title: 'Custom Transcript (Offline Engine)',
        metadata: {
          call_time: request.local_time || '14:15',
          call_attempts_last_7_days: request.attempts_7_days || 1,
          is_third_party: request.is_third_party || false,
        },
        turns,
      };

      return compareLocalConversation(conv);
    }
  );
}

export async function getBenchmarkMetrics(): Promise<BenchmarkSummary> {
  return fetchWithFallback<BenchmarkSummary>(
    `${API_BASE}/benchmark`,
    { method: 'GET' },
    () => computeLocalBenchmark()
  );
}
