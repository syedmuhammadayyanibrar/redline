'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { SummaryCards } from '../components/SummaryCards';
import { ScenarioSelector } from '../components/ScenarioSelector';
import { ConversationViewer } from '../components/ConversationViewer';
import { FindingsPanel } from '../components/FindingsPanel';
import { TurnComparisonCard } from '../components/TurnComparisonCard';
import { CustomTranscriptTester } from '../components/CustomTranscriptTester';
import { Scenario, ComparisonEvaluationResponse, EvaluationMode, BenchmarkSummary } from '../types';
import { getScenarios, compareScenario, getBenchmarkMetrics } from '../lib/api';
import { FALLBACK_SCENARIOS, computeLocalBenchmark } from '../lib/fallback-data';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<'testbench' | 'evaluation' | 'methodology'>('testbench');
  const [scenarios, setScenarios] = useState<Scenario[]>(FALLBACK_SCENARIOS);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('SCN-001');
  const [selectedAgent, setSelectedAgent] = useState<'baseline' | 'guarded'>('baseline');
  const [evaluationMode, setEvaluationMode] = useState<EvaluationMode>('full_context');
  const [comparisonResponse, setComparisonResponse] = useState<ComparisonEvaluationResponse | null>(null);
  const [selectedTurnId, setSelectedTurnId] = useState<number | null>(null);
  const [benchmarkSummary, setBenchmarkSummary] = useState<BenchmarkSummary | null>(null);
  const [loading, setLoading] = useState(false);

  // Load scenarios on mount
  useEffect(() => {
    async function loadData() {
      try {
        const scns = await getScenarios();
        if (scns && scns.length > 0) {
          setScenarios(scns);
        }
      } catch (err) {
        console.error('Error fetching scenarios:', err);
      }
    }
    loadData();
  }, []);

  // Update evaluation comparison when scenario or agent changes
  useEffect(() => {
    async function updateComparison() {
      setLoading(true);
      try {
        const comp = await compareScenario(selectedScenarioId, selectedAgent);
        setComparisonResponse(comp);
        // Default selected turn to first turn with disagreement or first turn
        const firstDisagree = comp.turn_comparisons.find((t) => t.has_disagreement);
        if (firstDisagree) {
          setSelectedTurnId(firstDisagree.turn_id);
        } else if (comp.turn_comparisons.length > 0) {
          setSelectedTurnId(comp.turn_comparisons[0].turn_id);
        }
      } catch (err) {
        console.error('Error comparing scenario:', err);
      } finally {
        setLoading(false);
      }
    }
    updateComparison();
  }, [selectedScenarioId, selectedAgent]);

  // Load benchmark summary when on evaluation tab
  useEffect(() => {
    if (activeTab === 'evaluation' && !benchmarkSummary) {
      getBenchmarkMetrics().then(setBenchmarkSummary).catch(() => {
        setBenchmarkSummary(computeLocalBenchmark());
      });
    }
  }, [activeTab, benchmarkSummary]);

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId) || scenarios[0];
  const currentConversation =
    selectedAgent === 'baseline'
      ? currentScenario.baseline_conversation
      : currentScenario.guarded_conversation;

  const currentEvaluationResult = comparisonResponse
    ? evaluationMode === 'turn_level'
      ? comparisonResponse.turn_level_result
      : comparisonResponse.full_context_result
    : {
        evaluation_mode: evaluationMode,
        overall_status: 'PASS' as const,
        findings: [],
        total_issues: 0,
        high_severity_count: 0,
        medium_severity_count: 0,
        low_severity_count: 0,
        context_dependent_count: 0,
      };

  const selectedTurnComparison = comparisonResponse?.turn_comparisons.find(
    (t) => t.turn_id === selectedTurnId
  );

  const disagreementsSet = new Set(
    comparisonResponse?.turn_comparisons
      .filter((t) => t.has_disagreement)
      .map((t) => t.turn_id) || []
  );

  const handleSelectFindingTurn = (turnId: number) => {
    setSelectedTurnId(turnId);
    const element = document.getElementById(`turn-${turnId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-slate-100">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === 'testbench' && (
        <>
          <HeroSection
            onRunTest={() => {
              const el = document.getElementById('workbench-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            onViewMethodology={() => setActiveTab('methodology')}
          />

          <main id="workbench-section" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Result Summary & Mode Toggles */}
            <SummaryCards
              evaluationResult={currentEvaluationResult}
              selectedAgent={selectedAgent}
              onSelectAgent={setSelectedAgent}
              evaluationMode={evaluationMode}
              onSelectMode={setEvaluationMode}
              disagreementsCount={comparisonResponse?.disagreements_count}
            />

            {/* Context Mode Alert Banner */}
            {evaluationMode === 'turn_level' && (
              <div className="p-3.5 rounded-lg bg-signal-amber-bg border-l-4 border-signal-amber text-xs text-slate-200 flex items-start gap-2.5">
                <span className="text-signal-amber text-base leading-none">⚠️</span>
                <div>
                  <strong className="text-signal-amber font-mono">Turn-Level Check Active (Stateless): </strong>
                  <span>
                    Each agent response is evaluated in isolation with zero memory of prior borrower disclosures. Notice how cease-contact and debt dispute violations pass undetected because the agent's single-turn payment requests appear standard in isolation.
                  </span>
                </div>
              </div>
            )}

            {/* 3-Column Main Workbench */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left: Scenario Selector (3 cols) */}
              <div className="lg:col-span-3">
                <ScenarioSelector
                  scenarios={scenarios}
                  selectedScenarioId={selectedScenarioId}
                  onSelectScenario={(id) => {
                    setSelectedScenarioId(id);
                    setSelectedTurnId(null);
                  }}
                  selectedAgent={selectedAgent}
                />
              </div>

              {/* Center: Conversation Timeline (5 cols) */}
              <div className="lg:col-span-5">
                <ConversationViewer
                  conversation={currentConversation}
                  findings={currentEvaluationResult.findings}
                  selectedTurnId={selectedTurnId}
                  onSelectTurn={setSelectedTurnId}
                  evaluationMode={evaluationMode}
                  disagreementsByTurn={disagreementsSet}
                />
              </div>

              {/* Right: Findings Panel (4 cols) */}
              <div className="lg:col-span-4">
                <FindingsPanel
                  findings={currentEvaluationResult.findings}
                  onSelectFindingTurn={handleSelectFindingTurn}
                  evaluationMode={evaluationMode}
                />
              </div>
            </div>

            {/* The Centerpiece: Turn Comparison Inspection */}
            <section aria-label="Context Comparison">
              <TurnComparisonCard
                comparison={selectedTurnComparison}
                allTurns={currentConversation.turns}
              />
            </section>

            {/* Custom Transcript Testing Sandbox */}
            <section aria-label="Custom Transcript Testing">
              <CustomTranscriptTester />
            </section>
          </main>
        </>
      )}

      {/* EVALUATION / BENCHMARK TAB */}
      {activeTab === 'evaluation' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="space-y-2 border-b border-border-subtle pb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Evaluation &amp; Benchmark Dashboard
            </h1>
            <p className="text-sm text-slate-400 max-w-3xl">
              Computed deterministically from Redline's full 16-case benchmark suite (8 scenarios across both Prototype Baseline and Prototype Guarded configurations). No fabricated percentages or synthetic estimates.
            </p>
          </div>

          {/* Benchmark Top Metrics */}
          {benchmarkSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-card border border-border-strong rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Total Test Cases</span>
                <div className="text-2xl font-mono font-bold text-white my-1">{benchmarkSummary.total_test_cases}</div>
                <span className="text-[11px] text-slate-400">8 Baseline + 8 Guarded</span>
              </div>

              <div className="bg-card border border-border-strong rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Full-Context Accuracy</span>
                <div className="text-2xl font-mono font-bold text-signal-teal my-1">{benchmarkSummary.full_context_accuracy}%</div>
                <span className="text-[11px] text-slate-400">Deterministic benchmark</span>
              </div>

              <div className="bg-card border border-border-strong rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Turn-Level Accuracy</span>
                <div className="text-2xl font-mono font-bold text-signal-amber my-1">{benchmarkSummary.turn_level_accuracy}%</div>
                <span className="text-[11px] text-slate-400">Degraded by blind spots</span>
              </div>

              <div className="bg-card border border-border-strong rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Mode Disagreements</span>
                <div className="text-2xl font-mono font-bold text-white my-1">{benchmarkSummary.turn_vs_full_disagreements}</div>
                <span className="text-[11px] text-slate-400">Turn vs. Full divergence</span>
              </div>

              <div className="bg-card border border-border-strong rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Context Violations Caught</span>
                <div className="text-2xl font-mono font-bold text-signal-teal my-1">{benchmarkSummary.context_dependent_violations_caught}</div>
                <span className="text-[11px] text-slate-400">Uncovered via state memory</span>
              </div>

              <div className="bg-card border border-border-strong rounded-xl p-3.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Turn False Negatives</span>
                <div className="text-2xl font-mono font-bold text-signal-red my-1">{benchmarkSummary.false_negatives_in_turn_level}</div>
                <span className="text-[11px] text-slate-400">Missed by stateless check</span>
              </div>
            </div>
          )}

          {/* Detailed Scenario Benchmark Table */}
          <div className="bg-card border border-border-strong rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-border-subtle flex justify-between items-center">
              <span className="font-mono text-xs uppercase tracking-wider text-slate-300 font-bold">
                Scenario-by-Scenario Evaluation Matrix
              </span>
              <span className="font-mono text-xs text-slate-500">
                16 Test Runs
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-canvas-subtle border-b border-border-subtle text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Scenario / Agent</th>
                    <th className="py-3 px-4">Expected</th>
                    <th className="py-3 px-4">Turn-Level Result</th>
                    <th className="py-3 px-4">Full-Context Result</th>
                    <th className="py-3 px-4">Disagreement</th>
                    <th className="py-3 px-4">Context Findings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {benchmarkSummary?.benchmark_items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-card-subtle/50 transition-colors">
                      <td className="py-3 px-4 font-sans text-xs font-medium text-white">
                        <div>{item.scenario_title}</div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {item.agent_type === 'baseline' ? 'Prototype Baseline' : 'Prototype Guarded'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          item.expected_outcome === 'FLAGGED' ? 'bg-signal-red-bg text-signal-red' : 'bg-signal-teal-bg text-signal-teal'
                        }`}>
                          {item.expected_outcome}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded ${
                          item.turn_level_outcome === 'FLAGGED' ? 'text-signal-red' : 'text-signal-teal'
                        }`}>
                          {item.turn_level_outcome}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          item.full_context_outcome === 'FLAGGED' ? 'text-signal-red' : 'text-signal-teal'
                        }`}>
                          {item.full_context_outcome}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {item.has_disagreement ? (
                          <span className="text-signal-amber font-bold">YES (Shift)</span>
                        ) : (
                          <span className="text-slate-500">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {item.context_dependent_issues > 0 ? (
                          <span className="text-signal-teal font-bold">{item.context_dependent_issues} caught</span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* METHODOLOGY TAB */}
      {activeTab === 'methodology' && (
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <div className="space-y-2 border-b border-border-subtle pb-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Evaluation Methodology &amp; Architecture
            </h1>
            <p className="text-sm text-slate-400">
              Technical documentation explaining the deterministic compliance testing thesis, rule abstractions, and boundary limitations.
            </p>
          </div>

          <div className="prose prose-invert max-w-none text-xs sm:text-sm space-y-6 text-slate-300 leading-relaxed font-sans">
            {/* Section 1 */}
            <div className="p-5 rounded-xl bg-card border border-border-strong space-y-2">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                1. Why the Project Exists
              </h2>
              <p>
                Voice AI agents operating in consumer lending and debt collection operate under strict statutory frameworks, primarily the Fair Debt Collection Practices Act (FDCPA, 15 U.S.C. § 1692 et seq.) and CFPB Regulation F (12 CFR Part 1006). Conventional LLM safety guardrails frequently inspect only the single current utterance. <strong>Redline</strong> is an independent engineering prototype demonstrating why multi-turn conversational context is strictly necessary to evaluate compliance.
              </p>
            </div>

            {/* Section 2 */}
            <div className="p-5 rounded-xl bg-card border border-border-strong space-y-2">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                2. What is Being Tested
              </h2>
              <p>
                Redline evaluates debt-collection dialogues against 9 deterministic compliance rules covering: verbal cease-communication requests, prohibited third-party debt disclosures, disputed debt validation pauses, permissible calling hours (8 AM – 9 PM local time), deceptive legal and garnishment threats, 7-in-7 call frequency ceilings, sensitive financial leaks, hardship disregard, and Mini-Miranda disclosure mandates.
              </p>
            </div>

            {/* Section 3 & 4 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-card border border-border-strong space-y-2">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  3. Turn-Level Evaluation
                </h3>
                <p className="text-xs text-slate-400">
                  Evaluates each agent response primarily against the current turn without conversational memory. While effective for detecting explicit profanity or overt illegal threats, it produces dangerous false negatives whenever a response's compliance depends on prior borrower statements.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border-strong space-y-2">
                <h3 className="text-sm font-bold text-white font-mono uppercase">
                  4. Full-Context Evaluation
                </h3>
                <p className="text-xs text-slate-400">
                  Maintains an accumulated state machine across all dialogue turns. When a borrower invokes a cease request or disputes debt validity, subsequent agent responses are evaluated against that active legal constraint, eliminating context-blind false passes.
                </p>
              </div>
            </div>

            {/* Section 5: Rules Used */}
            <div className="p-5 rounded-xl bg-card border border-border-strong space-y-3">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                5. Rules Tested
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded bg-canvas-subtle border border-border-subtle">
                  <div className="text-signal-red font-bold">REDLINE-001</div>
                  <div className="text-white font-sans font-semibold">Cease-Contact Request</div>
                  <div className="text-[11px] text-slate-400">15 U.S.C. § 1692c(c) · Context-dependent</div>
                </div>
                <div className="p-2.5 rounded bg-canvas-subtle border border-border-subtle">
                  <div className="text-signal-red font-bold">REDLINE-002</div>
                  <div className="text-white font-sans font-semibold">Third-Party Disclosure</div>
                  <div className="text-[11px] text-slate-400">15 U.S.C. § 1692c(b) · Third-party privacy</div>
                </div>
                <div className="p-2.5 rounded bg-canvas-subtle border border-border-subtle">
                  <div className="text-signal-red font-bold">REDLINE-003</div>
                  <div className="text-white font-sans font-semibold">Disputed Debt Validation</div>
                  <div className="text-[11px] text-slate-400">15 U.S.C. § 1692g(b) · Context-dependent</div>
                </div>
                <div className="p-2.5 rounded bg-canvas-subtle border border-border-subtle">
                  <div className="text-signal-red font-bold">REDLINE-004</div>
                  <div className="text-white font-sans font-semibold">Calling Hours Window</div>
                  <div className="text-[11px] text-slate-400">12 CFR § 1006.6(b)(1) · 8 AM – 9 PM</div>
                </div>
                <div className="p-2.5 rounded bg-canvas-subtle border border-border-subtle">
                  <div className="text-signal-red font-bold">REDLINE-005</div>
                  <div className="text-white font-sans font-semibold">Misleading Legal Threats</div>
                  <div className="text-[11px] text-slate-400">15 U.S.C. § 1692e(4)-(5) · Garnishment/lawsuit</div>
                </div>
                <div className="p-2.5 rounded bg-canvas-subtle border border-border-subtle">
                  <div className="text-signal-red font-bold">REDLINE-006</div>
                  <div className="text-white font-sans font-semibold">Repeated Contact (7-in-7)</div>
                  <div className="text-[11px] text-slate-400">12 CFR § 1006.14(b)(2) · 7 calls / 7 days</div>
                </div>
                <div className="p-2.5 rounded bg-canvas-subtle border border-border-subtle">
                  <div className="text-signal-red font-bold">REDLINE-007</div>
                  <div className="text-white font-sans font-semibold">Sensitive Financial Privacy</div>
                  <div className="text-[11px] text-slate-400">15 U.S.C. § 1692c(b) · Non-consumer leak</div>
                </div>
                <div className="p-2.5 rounded bg-canvas-subtle border border-border-subtle">
                  <div className="text-signal-red font-bold">REDLINE-008</div>
                  <div className="text-white font-sans font-semibold">Hardship Coercion</div>
                  <div className="text-[11px] text-slate-400">FDCPA § 806 / CFPB Guidance · Context-dependent</div>
                </div>
              </div>
            </div>

            {/* Section 6 & 7: Scenario Construction & Evaluation */}
            <div className="p-5 rounded-xl bg-card border border-border-strong space-y-2">
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
                6. Scenario Construction &amp; Agent Configurations
              </h2>
              <p>
                Each test scenario pairs a <strong>Prototype Baseline (Naive Agent)</strong> with a <strong>Prototype Guarded Agent</strong>. The baseline agent reflects an unconstrained conversational prompt that ignores multi-turn state. The guarded agent demonstrates stateful compliance enforcement, verifying calling hours, honoring cease requests, pausing on disputes, and providing hardship forbearance options.
              </p>
            </div>

            {/* Section 8: Limitations & Prominent Disclaimer */}
            <div className="p-5 rounded-xl bg-signal-amber-bg/30 border border-signal-amber-border space-y-2">
              <h2 className="text-base font-bold text-signal-amber font-mono uppercase tracking-wide">
                7. Limitations &amp; Disclaimers
              </h2>
              <p className="text-xs text-slate-300">
                Redline is an independent prototype built to explore conversational compliance evaluation concepts. Its rules and scenario evaluations are simplified engineering models and do not encompass the full nuance of federal or state consumer protection jurisprudence.
              </p>
              <div className="p-3 rounded bg-canvas-subtle border border-border-strong text-xs font-mono text-slate-200 mt-2">
                "Redline is an independent prototype for demonstrating conversational compliance testing. Its scenarios and rules are simplified and are not legal advice or an evaluation of Veritus's systems."
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Global Footer */}
      <footer className="border-t border-border-subtle py-6 bg-canvas text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span>Redline Compliance Engine // Context-Aware AI Voice Auditing</span>
          </div>
          <div className="text-slate-500">
            Portfolio project inspired by Veritus (YC S25)
          </div>
        </div>
      </footer>
    </div>
  );
}
