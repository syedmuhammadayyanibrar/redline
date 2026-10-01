import React from 'react';
import { EvaluationResult, EvaluationMode } from '../types';

interface SummaryCardsProps {
  evaluationResult: EvaluationResult;
  selectedAgent: 'baseline' | 'guarded';
  onSelectAgent: (agent: 'baseline' | 'guarded') => void;
  evaluationMode: EvaluationMode;
  onSelectMode: (mode: EvaluationMode) => void;
  disagreementsCount?: number;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  evaluationResult,
  selectedAgent,
  onSelectAgent,
  evaluationMode,
  onSelectMode,
  disagreementsCount = 0,
}) => {
  const { overall_status, total_issues, high_severity_count, medium_severity_count, low_severity_count, context_dependent_count } =
    evaluationResult;

  const getStatusBadge = () => {
    switch (overall_status) {
      case 'PASS':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-signal-teal-bg text-signal-teal border border-signal-teal-border font-mono font-bold text-sm">
            <span>✓</span>
            <span>PASS</span>
          </div>
        );
      case 'REVIEW':
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-signal-amber-bg text-signal-amber border border-signal-amber-border font-mono font-bold text-sm">
            <span>⚠</span>
            <span>REVIEW REQUIRED</span>
          </div>
        );
      case 'FLAGGED':
      default:
        return (
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-signal-red-bg text-signal-red border border-signal-red-border font-mono font-bold text-sm">
            <span>✕</span>
            <span>FLAGGED</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Configuration Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-card border border-border-strong shadow-sm">
        {/* Agent Configuration Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Agent Configuration:</span>
          <div className="inline-flex rounded-lg p-1 bg-canvas-subtle border border-border-subtle" role="group">
            <button
              onClick={() => onSelectAgent('baseline')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                selectedAgent === 'baseline'
                  ? 'bg-card text-white border border-border-strong shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Prototype baseline
            </button>
            <button
              onClick={() => onSelectAgent('guarded')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                selectedAgent === 'guarded'
                  ? 'bg-card text-white border border-border-strong shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Prototype guarded agent
            </button>
          </div>
        </div>

        {/* Most Important Feature: Context Mode Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Compliance Check Mode:</span>
          <div className="inline-flex rounded-lg p-1 bg-canvas-subtle border border-border-subtle" role="group">
            <button
              onClick={() => onSelectMode('turn_level')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                evaluationMode === 'turn_level'
                  ? 'bg-white text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Turn-level</span>
              <span className="text-[10px] opacity-75 font-mono">(Stateless)</span>
            </button>
            <button
              onClick={() => onSelectMode('full_context')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
                evaluationMode === 'full_context'
                  ? 'bg-white text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Full conversation</span>
              <span className="text-[10px] opacity-75 font-mono">(Stateful)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Overall Result */}
        <div className="bg-card border border-border-strong rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Overall Result</span>
          <div className="my-1.5">{getStatusBadge()}</div>
          <span className="text-[11px] text-slate-400 font-mono">
            Mode: {evaluationMode === 'turn_level' ? 'Turn-Level' : 'Full Context'}
          </span>
        </div>

        {/* Potential Issues */}
        <div className="bg-card border border-border-strong rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Potential Issues</span>
          <div className="text-2xl font-mono font-bold text-white my-1">{total_issues}</div>
          <span className="text-[11px] text-slate-400">Total detected flags</span>
        </div>

        {/* High Severity */}
        <div className="bg-card border border-border-strong rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">High Severity</span>
          <div className="text-2xl font-mono font-bold text-signal-red my-1">{high_severity_count}</div>
          <span className="text-[11px] text-slate-400">Statutory / direct violations</span>
        </div>

        {/* Medium Severity */}
        <div className="bg-card border border-border-strong rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Medium Severity</span>
          <div className="text-2xl font-mono font-bold text-signal-amber my-1">{medium_severity_count}</div>
          <span className="text-[11px] text-slate-400">Requires operational review</span>
        </div>

        {/* Low Severity */}
        <div className="bg-card border border-border-strong rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Low Severity</span>
          <div className="text-2xl font-mono font-bold text-slate-300 my-1">{low_severity_count}</div>
          <span className="text-[11px] text-slate-400">Informational advisory</span>
        </div>

        {/* Context-Dependent Findings */}
        <div className="bg-card border border-border-strong rounded-xl p-3.5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-signal-teal/5 rounded-full blur-xl pointer-events-none" />
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center justify-between">
            <span>Context-Dependent</span>
            <span className="text-[9px] px-1 rounded bg-card-subtle text-slate-300">Key</span>
          </span>
          <div className="text-2xl font-mono font-bold text-signal-teal my-1">{context_dependent_count}</div>
          <span className="text-[11px] text-slate-400">
            {evaluationMode === 'turn_level' ? 'Hidden without history' : 'Uncovered via context'}
          </span>
        </div>
      </div>
    </div>
  );
};
