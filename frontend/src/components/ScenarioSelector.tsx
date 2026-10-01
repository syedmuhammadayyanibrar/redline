import React from 'react';
import { Scenario } from '../types';

interface ScenarioSelectorProps {
  scenarios: Scenario[];
  selectedScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  selectedAgent: 'baseline' | 'guarded';
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  selectedAgent,
}) => {
  return (
    <div className="bg-card border border-border-strong rounded-xl p-4 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-subtle">
        <span className="font-mono text-xs uppercase tracking-wider text-slate-400 font-semibold">
          Benchmark Scenarios
        </span>
        <span className="font-mono text-xs text-slate-500 font-medium">
          {scenarios.length} Scripted Calls
        </span>
      </div>

      <div className="space-y-2 overflow-y-auto max-h-[580px] pr-1">
        {scenarios.map((scenario, index) => {
          const isSelected = scenario.id === selectedScenarioId;
          const isBaseline = selectedAgent === 'baseline';
          const expectedStatus = isBaseline ? scenario.expected_status_naive : scenario.expected_status_guarded;

          return (
            <button
              key={scenario.id}
              onClick={() => onSelectScenario(scenario.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1.5 relative ${
                isSelected
                  ? 'bg-card-subtle border-white/40 shadow-sm'
                  : 'bg-card-subtle/50 border-border-subtle hover:bg-card-subtle hover:border-border-strong'
              }`}
            >
              {isSelected && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-white rounded-r" />
              )}

              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  SCN-00{index + 1}
                </span>

                {isBaseline ? (
                  <span className="font-mono text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-signal-red-bg text-signal-red border border-signal-red-border">
                    Flagged
                  </span>
                ) : (
                  <span className="font-mono text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-signal-teal-bg text-signal-teal border border-signal-teal-border">
                    Compliant
                  </span>
                )}
              </div>

              <div className="text-xs font-semibold text-slate-100 leading-snug">
                {scenario.title}
              </div>

              <div className="text-[11px] text-slate-400 leading-tight line-clamp-2">
                {scenario.category}
              </div>

              {scenario.context_dependent_findings.length > 0 && (
                <div className="pt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-signal-teal" />
                  <span className="text-[10px] font-mono text-signal-teal font-medium">
                    Context-dependent edge case
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
