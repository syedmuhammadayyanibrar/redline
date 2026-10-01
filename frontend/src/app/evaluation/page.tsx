'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '../../components/Navbar';
import { BenchmarkSummary } from '../../types';
import { getBenchmarkMetrics } from '../../lib/api';
import { computeLocalBenchmark } from '../../lib/fallback-data';

export default function EvaluationPage() {
  const [benchmarkSummary, setBenchmarkSummary] = useState<BenchmarkSummary | null>(null);

  useEffect(() => {
    getBenchmarkMetrics()
      .then(setBenchmarkSummary)
      .catch(() => setBenchmarkSummary(computeLocalBenchmark()));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-slate-100">
      <Navbar activeTab="evaluation" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="space-y-2 border-b border-border-subtle pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Evaluation &amp; Benchmark Dashboard
          </h1>
          <p className="text-sm text-slate-400 max-w-3xl">
            Computed deterministically from Redline's full 16-case benchmark suite (8 scenarios across both Prototype Baseline and Prototype Guarded configurations). No fabricated percentages or synthetic estimates.
          </p>
        </div>

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

        <div className="bg-card border border-border-strong rounded-xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-border-subtle flex justify-between items-center">
            <span className="font-mono text-xs uppercase tracking-wider text-slate-300 font-bold">
              Scenario-by-Scenario Evaluation Matrix
            </span>
            <span className="font-mono text-xs text-slate-500">16 Test Runs</span>
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
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          item.expected_outcome === 'FLAGGED'
                            ? 'bg-signal-red-bg text-signal-red'
                            : 'bg-signal-teal-bg text-signal-teal'
                        }`}
                      >
                        {item.expected_outcome}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          item.turn_level_outcome === 'FLAGGED' ? 'text-signal-red' : 'text-signal-teal'
                        }`}
                      >
                        {item.turn_level_outcome}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          item.full_context_outcome === 'FLAGGED' ? 'text-signal-red' : 'text-signal-teal'
                        }`}
                      >
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

      <footer className="border-t border-border-subtle py-6 bg-canvas text-xs text-slate-400 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>Redline Compliance Engine // Context-Aware AI Voice Auditing</div>
          <div className="text-slate-500">Portfolio project inspired by Veritus (YC S25)</div>
        </div>
      </footer>
    </div>
  );
}
