import React from 'react';
import { Conversation, ComplianceFinding, Role } from '../types';

interface ConversationViewerProps {
  conversation: Conversation;
  findings: ComplianceFinding[];
  selectedTurnId: number | null;
  onSelectTurn: (turnId: number) => void;
  evaluationMode: 'turn_level' | 'full_context';
  disagreementsByTurn?: Set<number>;
}

export const ConversationViewer: React.FC<ConversationViewerProps> = ({
  conversation,
  findings,
  selectedTurnId,
  onSelectTurn,
  evaluationMode,
  disagreementsByTurn = new Set(),
}) => {
  const { metadata, turns } = conversation;

  return (
    <div className="bg-card border border-border-strong rounded-xl p-4 shadow-sm flex flex-col h-full space-y-4">
      {/* Call Metadata Strip */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-2.5 rounded-lg bg-canvas-subtle border border-border-subtle text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 uppercase">Local Time:</span>
          <span className={`font-semibold ${metadata.call_time && (parseInt(metadata.call_time) >= 21 || parseInt(metadata.call_time) < 8) ? 'text-signal-red' : 'text-slate-200'}`}>
            {metadata.call_time || '14:15'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 uppercase">7-Day Attempts:</span>
          <span className={`font-semibold ${(metadata.call_attempts_last_7_days || 1) > 7 ? 'text-signal-red' : 'text-slate-200'}`}>
            {metadata.call_attempts_last_7_days || 1} / 7 max
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 uppercase">Recipient:</span>
          <span className={`font-semibold ${metadata.is_third_party ? 'text-signal-amber' : 'text-slate-200'}`}>
            {metadata.borrower_name || 'Borrower'} {metadata.is_third_party ? `(${metadata.recipient_relationship || 'Third Party'})` : ''}
          </span>
        </div>
      </div>

      {/* Conversation Timeline */}
      <div className="space-y-3 overflow-y-auto max-h-[520px] pr-1">
        {turns.map((turn) => {
          const isAgent = turn.speaker === 'agent';
          const turnFindings = findings.filter((f) => f.turn_id === turn.turn_id);
          const hasViolation = turnFindings.length > 0;
          const isSelected = selectedTurnId === turn.turn_id;
          const hasDisagreement = disagreementsByTurn.has(turn.turn_id);

          return (
            <div
              key={turn.turn_id}
              id={`turn-${turn.turn_id}`}
              onClick={() => onSelectTurn(turn.turn_id)}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer relative ${
                isSelected
                  ? 'ring-2 ring-white/60 shadow-md'
                  : 'hover:border-border-strong'
              } ${
                hasViolation
                  ? 'bg-signal-red-bg border-signal-red-border'
                  : hasDisagreement
                  ? 'bg-signal-amber-bg/50 border-signal-amber-border/70'
                  : isAgent
                  ? 'bg-card-subtle/80 border-border-subtle'
                  : 'bg-canvas-subtle border-border-subtle/60'
              }`}
            >
              {/* Turn Header */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      isAgent
                        ? 'bg-slate-800 text-slate-200 border border-slate-700'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {isAgent ? '🤖 Agent' : turn.speaker === 'third_party' ? '👥 Third Party' : '👤 Borrower'}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    Turn {turn.turn_id}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {hasDisagreement && (
                    <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-signal-amber text-slate-950">
                      Context Shift
                    </span>
                  )}
                  {hasViolation && (
                    <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-signal-red text-white">
                      {turnFindings.length} {turnFindings.length === 1 ? 'Flag' : 'Flags'}
                    </span>
                  )}
                </div>
              </div>

              {/* Turn Text */}
              <div
                className={`text-sm leading-relaxed ${
                  hasViolation
                    ? 'text-white font-medium'
                    : isAgent
                    ? 'text-slate-100'
                    : 'text-slate-300'
                }`}
              >
                {turn.text}
              </div>

              {/* Inline Callout for Flagged turns */}
              {hasViolation && (
                <div className="mt-2.5 pt-2 border-t border-signal-red-border/60 space-y-1">
                  {turnFindings.map((finding, idx) => (
                    <div key={idx} className="text-xs text-signal-red flex items-start gap-1.5">
                      <span className="font-mono font-bold">[{finding.rule_id}]</span>
                      <span className="text-slate-200">{finding.explanation}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Hint when turn is selected */}
              {isSelected && (
                <div className="mt-2 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                  <span>Selected Turn {turn.turn_id}</span>
                  <span className="text-white underline">Inspecting Turn-Level vs Full-Context</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
