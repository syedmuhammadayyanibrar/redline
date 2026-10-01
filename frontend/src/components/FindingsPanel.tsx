import React from 'react';
import { ComplianceFinding } from '../types';

interface FindingsPanelProps {
  findings: ComplianceFinding[];
  onSelectFindingTurn: (turnId: number) => void;
  evaluationMode: 'turn_level' | 'full_context';
}

export const FindingsPanel: React.FC<FindingsPanelProps> = ({
  findings,
  onSelectFindingTurn,
  evaluationMode,
}) => {
  return (
    <div className="bg-card border border-border-strong rounded-xl p-4 shadow-sm flex flex-col h-full space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
        <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-semibold">
          Compliance Findings
        </span>
        <span className="font-mono text-xs text-slate-500 font-medium">
          {findings.length} {findings.length === 1 ? 'Issue' : 'Issues'} Detected
        </span>
      </div>

      {findings.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center my-auto space-y-2">
          <div className="w-10 h-10 rounded-full bg-signal-teal-bg text-signal-teal border border-signal-teal-border flex items-center justify-center text-lg font-bold">
            ✓
          </div>
          <div className="text-sm font-semibold text-white">No Potential Violations Detected</div>
          <p className="text-xs text-slate-400 max-w-xs">
            {evaluationMode === 'turn_level'
              ? 'Turn-level check detected no immediate single-utterance issues. (Tip: Switch to full-conversation mode to verify multi-turn context).'
              : 'All turns adhere to evaluated FDCPA and Regulation F operational rules.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1">
          {findings.map((finding, idx) => (
            <div
              key={idx}
              onClick={() => onSelectFindingTurn(finding.turn_id)}
              className="p-3.5 rounded-lg bg-card-subtle border border-border-strong hover:border-white/50 transition-all cursor-pointer flex flex-col gap-2 shadow-sm group"
            >
              {/* Finding Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-signal-red">
                    {finding.rule_id}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-signal-red-bg text-signal-red border border-signal-red-border font-semibold uppercase">
                    {finding.severity}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-400 group-hover:text-white transition-colors underline">
                  Jump to Turn {finding.turn_id} →
                </span>
              </div>

              {/* Rule Name & Citation */}
              <div>
                <div className="text-xs font-bold text-white leading-tight">
                  {finding.rule_name}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {finding.statutory_citation}
                </div>
              </div>

              {/* Triggering Text */}
              <div className="p-2 rounded bg-canvas-subtle border border-border-subtle text-xs text-slate-300 font-mono italic">
                "{finding.triggering_text}"
              </div>

              {/* Explanation */}
              <div className="text-xs text-slate-300 leading-snug">
                {finding.explanation}
              </div>

              {/* Conversation Context (if context-dependent) */}
              {finding.conversation_context && (
                <div className="p-2 rounded bg-signal-amber-bg/40 border border-signal-amber-border text-xs text-slate-200 space-y-1">
                  <div className="font-mono text-[10px] uppercase font-bold text-signal-amber">
                    Context Contributing to Finding:
                  </div>
                  <div className="text-[11px] leading-tight text-slate-300">
                    {finding.conversation_context}
                  </div>
                </div>
              )}

              {/* Suggested Remediation */}
              <div className="pt-2 border-t border-border-subtle/60 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">Suggested Remediation: </span>
                {finding.remediation}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
