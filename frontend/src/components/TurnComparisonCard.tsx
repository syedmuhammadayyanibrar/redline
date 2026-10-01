import React from 'react';
import { TurnComparison, ConversationTurn } from '../types';

interface TurnComparisonCardProps {
  comparison?: TurnComparison;
  allTurns: ConversationTurn[];
}

export const TurnComparisonCard: React.FC<TurnComparisonCardProps> = ({ comparison, allTurns }) => {
  if (!comparison) {
    return (
      <div className="bg-card border border-border-strong rounded-xl p-5 text-center text-xs text-slate-400">
        Click any conversation turn above to inspect its Turn-Level vs. Full-Context comparison breakdown.
      </div>
    );
  }

  const { turn_id, speaker, text, turn_level_findings, full_context_findings, has_disagreement, context_explanation } =
    comparison;

  // Retrieve prior turns for context display
  const priorTurns = allTurns.filter((t) => t.turn_id < turn_id);

  return (
    <div className="bg-card border-2 border-border-strong rounded-xl p-5 shadow-lg space-y-5 relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
            Context Comparison Inspection
          </span>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-card-subtle text-white font-semibold">
            Turn {turn_id} ({speaker === 'agent' ? 'Agent' : 'Borrower'})
          </span>
        </div>

        {has_disagreement ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-signal-amber-bg text-signal-amber border border-signal-amber-border text-xs font-mono font-bold">
            <span>⚠</span>
            <span>Context-Dependent Compliance Issue</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-card-subtle text-slate-400 border border-border-subtle text-xs font-mono font-semibold">
            <span>✓</span>
            <span>Modes Agree</span>
          </div>
        )}
      </div>

      {/* Main Breakdown Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Turn & Context (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Previous Context Box */}
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Prior Conversation History ({priorTurns.length} earlier {priorTurns.length === 1 ? 'turn' : 'turns'})
            </span>
            <div className="p-3 rounded-lg bg-canvas-subtle border border-border-subtle max-h-36 overflow-y-auto space-y-1.5 text-xs font-mono">
              {priorTurns.length === 0 ? (
                <span className="text-slate-500 italic">No prior turns (opening turn).</span>
              ) : (
                priorTurns.map((pt) => (
                  <div key={pt.turn_id} className="text-slate-300">
                    <span className="text-slate-500 font-bold uppercase">{pt.speaker === 'agent' ? 'Agent' : 'Borrower'}: </span>
                    <span>"{pt.text}"</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Current Turn Box */}
          <div className="space-y-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-white font-bold">
              Current Turn {turn_id} Response
            </span>
            <div className="p-3 rounded-lg bg-card-subtle border border-border-strong text-sm text-slate-100 font-medium">
              "{text}"
            </div>
          </div>
        </div>

        {/* Right Column: Turn-Level vs Full-Context Side-by-Side (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Turn-Level Result */}
          <div className="rounded-xl bg-canvas-subtle border border-border-strong p-4 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                Turn-Level Evaluation
              </div>
              <div className="text-xs text-slate-400 font-mono mb-2">Evaluates turn in isolation</div>

              {turn_level_findings.length === 0 ? (
                <div className="p-2.5 rounded bg-signal-teal-bg text-signal-teal border border-signal-teal-border font-semibold text-xs flex items-center gap-1.5">
                  <span>✓</span>
                  <span>No issue detected</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {turn_level_findings.map((f, i) => (
                    <div key={i} className="p-2 rounded bg-signal-red-bg text-signal-red border border-signal-red-border text-xs font-mono">
                      <div className="font-bold">[{f.rule_id}] Flagged</div>
                      <div className="text-[11px] text-slate-200 font-sans mt-0.5">{f.explanation}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-3 pt-2 border-t border-border-subtle">
              Single-turn stateless scanner
            </div>
          </div>

          {/* Full-Context Result */}
          <div className={`rounded-xl border p-4 flex flex-col justify-between ${
            has_disagreement
              ? 'bg-signal-red-bg/30 border-signal-red-border'
              : 'bg-canvas-subtle border-border-strong'
          }`}>
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold mb-1">
                Full-Conversation Evaluation
              </div>
              <div className="text-xs text-slate-400 font-mono mb-2">Evaluates with complete memory</div>

              {full_context_findings.length === 0 ? (
                <div className="p-2.5 rounded bg-signal-teal-bg text-signal-teal border border-signal-teal-border font-semibold text-xs flex items-center gap-1.5">
                  <span>✓</span>
                  <span>No issue detected</span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {full_context_findings.map((f, i) => (
                    <div key={i} className="p-2 rounded bg-signal-red-bg text-signal-red border border-signal-red-border text-xs font-mono">
                      <div className="font-bold flex items-center justify-between">
                        <span>[{f.rule_id}] Flagged</span>
                        {f.is_context_dependent && (
                          <span className="text-[9px] px-1 rounded bg-signal-amber text-slate-950 font-bold uppercase">
                            Context-Dependent
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-200 font-sans mt-0.5">{f.explanation}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-3 pt-2 border-t border-border-subtle">
              Multi-turn stateful compliance engine
            </div>
          </div>
        </div>
      </div>

      {/* WHY THE RESULT CHANGED EXPLANATION CALLOUT */}
      {has_disagreement && context_explanation && (
        <div className="p-3.5 rounded-lg bg-signal-amber-bg border-l-4 border-signal-amber text-xs text-slate-200 space-y-1.5">
          <div className="flex items-center gap-2 text-signal-amber font-mono font-bold uppercase tracking-wider text-[11px]">
            <span>💡 Why the evaluation changed with context</span>
          </div>
          <p className="text-slate-200 leading-relaxed font-sans text-xs">
            {context_explanation}
          </p>
        </div>
      )}
    </div>
  );
};
