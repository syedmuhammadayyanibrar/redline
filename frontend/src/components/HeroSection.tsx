import React from 'react';

interface HeroSectionProps {
  onRunTest: () => void;
  onViewMethodology: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onRunTest, onViewMethodology }) => {
  return (
    <div className="py-8 sm:py-10 border-b border-border-subtle bg-gradient-to-b from-card-subtle/40 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-card-subtle border border-border-strong text-xs font-mono text-slate-300">
              <span className="w-2 h-2 rounded-full bg-signal-teal animate-pulse" />
              <span>Deterministic FDCPA &amp; Reg F Engine</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Redline
            </h1>

            <p className="text-lg sm:text-xl font-medium text-slate-300">
              Stress-test conversational agents for context-dependent compliance.
            </p>

            <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
              Redline evaluates collections-agent conversations using deterministic compliance checks and shows what changes when a checker considers the full conversation context.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={onRunTest}
                className="px-5 py-2.5 rounded-md bg-white hover:bg-slate-100 text-slate-950 font-semibold text-sm transition-all shadow-sm"
              >
                Run a test
              </button>
              <button
                onClick={onViewMethodology}
                className="px-5 py-2.5 rounded-md bg-card hover:bg-card-subtle text-slate-300 hover:text-white border border-border-strong font-medium text-sm transition-all"
              >
                View methodology
              </button>
            </div>
          </div>

          {/* Right Visual Comparison Example: "Same response. Different context." */}
          <div className="lg:col-span-5">
            <div className="bg-card border border-border-strong rounded-xl p-5 shadow-lg relative overflow-hidden">
              <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
                <span>The Core Thesis in Action</span>
                <span className="text-[11px] text-slate-500 font-sans">Turn 5 Example</span>
              </div>

              {/* Context preview */}
              <div className="bg-canvas-subtle border border-border-subtle rounded-md p-3 mb-3 text-xs space-y-1 font-mono">
                <div className="text-slate-500">
                  <span className="text-slate-400 font-semibold">T2 Borrower:</span> "I don't want you calling me anymore."
                </div>
                <div className="text-slate-400 pt-1 border-t border-border-subtle/50">
                  <span className="text-white font-semibold">T5 Agent:</span> "Would tomorrow afternoon work for another call?"
                </div>
              </div>

              {/* Side-by-side mode pills */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {/* Turn-Level Card */}
                <div className="rounded-lg bg-card-subtle p-3 border border-border-subtle">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    Turn-Level Check
                  </div>
                  <div className="text-signal-teal font-semibold flex items-center gap-1.5 text-xs">
                    <span>✓</span>
                    <span>No issue detected</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                    Evaluated alone, this looks like an ordinary scheduling question.
                  </p>
                </div>

                {/* Full-Context Card */}
                <div className="rounded-lg bg-signal-red-bg p-3 border border-signal-red-border">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-signal-red mb-1">
                    Full Context Check
                  </div>
                  <div className="text-signal-red font-semibold flex items-center gap-1.5 text-xs">
                    <span>⚠</span>
                    <span>Review required</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                    Context reveals earlier cease request (FDCPA § 805(c) potential violation).
                  </p>
                </div>
              </div>

              <div className="mt-3 text-center">
                <span className="font-mono text-[11px] text-slate-400 uppercase tracking-widest font-semibold">
                  "Same response. Different context."
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
