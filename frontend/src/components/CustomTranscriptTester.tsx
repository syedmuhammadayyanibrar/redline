import React, { useState } from 'react';
import { ComparisonEvaluationResponse } from '../types';
import { evaluateCustomTranscript } from '../lib/api';

interface CustomTranscriptTesterProps {
  onEvaluationComplete?: (response: ComparisonEvaluationResponse) => void;
}

const PRESET_CONVERSATIONS = [
  {
    name: 'Cease-Contact Follow-up',
    text: `AGENT: Hello, this is Apex Financial on a recorded line. This is an attempt to collect a debt.
BORROWER: I don't want you calling me anymore. Please stop contacting this number.
AGENT: I understand, Michael. We are just trying to help resolve your delinquent loan balance of $480.
BORROWER: I said stop calling me!
AGENT: Would tomorrow afternoon work for another call?`,
    time: '14:15',
    attempts: 1,
    thirdParty: false,
  },
  {
    name: 'Disputed Debt Continuance',
    text: `AGENT: Hello, this is Premier Collections on a recorded line. This is an attempt to collect a debt.
BORROWER: I dispute this debt. Insurance already covered that hospital bill in full.
AGENT: Our system shows an unpaid balance of $1,250. Can you pay the balance in full today with a debit card?
BORROWER: No, send me written verification of the debt.
AGENT: We can send documents later, but you need to settle the $1,250 today or late fees will be applied.`,
    time: '15:20',
    attempts: 1,
    thirdParty: false,
  },
  {
    name: 'Third-Party Disclosure',
    text: `AGENT: Hello, may I speak with David?
BORROWER: Hi, this is Sarah, David's wife. He's at work right now.
AGENT: Hi Sarah, this is Apex Collections regarding David's past-due credit card balance of $1,840. We need him to pay today.
BORROWER: What credit card?`,
    time: '11:30',
    attempts: 2,
    thirdParty: true,
  },
  {
    name: 'Compliant Forbearance Resolution',
    text: `AGENT: Hello, this is Apex Financial on a recorded line. This is an attempt to collect a debt and any information obtained will be used for that purpose.
BORROWER: I lost my job last month and have zero income. I cannot pay anything right now.
AGENT: I am sorry to hear about your job loss. We can place your account on a 60-day hardship hold with zero interest and no late fees while you search for work. Would you like to enroll today?
BORROWER: Yes, please. That would help immensely.
AGENT: You are all set. We will mail written confirmation and pause outreach for 60 days.`,
    time: '10:00',
    attempts: 2,
    thirdParty: false,
  },
];

export const CustomTranscriptTester: React.FC<CustomTranscriptTesterProps> = () => {
  const [transcriptText, setTranscriptText] = useState(PRESET_CONVERSATIONS[0].text);
  const [localTime, setLocalTime] = useState(PRESET_CONVERSATIONS[0].time);
  const [attempts7Days, setAttempts7Days] = useState(PRESET_CONVERSATIONS[0].attempts);
  const [isThirdParty, setIsThirdParty] = useState(PRESET_CONVERSATIONS[0].thirdParty);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonEvaluationResponse | null>(null);
  const [activeMode, setActiveMode] = useState<'turn_level' | 'full_context'>('full_context');

  const handleRunTest = async () => {
    if (!transcriptText.trim()) return;
    setLoading(true);
    try {
      const response = await evaluateCustomTranscript({
        transcript_text: transcriptText,
        local_time: localTime,
        attempts_7_days: attempts7Days,
        is_third_party: isThirdParty,
      });
      setResult(response);
    } catch (err) {
      console.error('Custom evaluation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (preset: (typeof PRESET_CONVERSATIONS)[0]) => {
    setTranscriptText(preset.text);
    setLocalTime(preset.time);
    setAttempts7Days(preset.attempts);
    setIsThirdParty(preset.thirdParty);
    setResult(null);
  };

  const currentResult = result ? (activeMode === 'turn_level' ? result.turn_level_result : result.full_context_result) : null;

  return (
    <div className="bg-card border border-border-strong rounded-xl p-5 shadow-sm space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border-subtle">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Custom Transcript Testing Sandbox
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Paste any dialogue formatted with <code className="font-mono text-slate-300">BORROWER:</code> and <code className="font-mono text-slate-300">AGENT:</code> tags to test against deterministic compliance rules.
          </p>
        </div>

        {/* Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono uppercase text-slate-500 font-semibold">Load Preset:</span>
          {PRESET_CONVERSATIONS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => loadPreset(preset)}
              className="text-xs font-mono px-2.5 py-1 rounded bg-card-subtle hover:bg-card-hover border border-border-strong text-slate-300 transition-colors"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Editor & Metadata Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Textarea (8 cols) */}
        <div className="lg:col-span-8 space-y-1.5">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex justify-between">
            <span>Conversation Dialogue</span>
            <span className="text-slate-500 font-normal">Format: AGENT: ... / BORROWER: ...</span>
          </label>
          <textarea
            value={transcriptText}
            onChange={(e) => setTranscriptText(e.target.value)}
            rows={10}
            className="w-full bg-canvas-subtle border border-border-strong rounded-lg p-3 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-white resize-y"
            placeholder={`AGENT: Hello, this is Apex Financial. This is an attempt to collect a debt.\nBORROWER: Please stop calling me.\nAGENT: Can you pay $50 today?`}
          />
        </div>

        {/* Metadata Controls (4 cols) */}
        <div className="lg:col-span-4 bg-canvas-subtle p-4 rounded-lg border border-border-subtle flex flex-col justify-between space-y-4">
          <div className="space-y-3.5">
            <span className="text-xs font-mono uppercase tracking-wider text-white font-bold">
              Call Metadata Controls
            </span>

            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                Borrower Local Time
              </label>
              <input
                type="text"
                value={localTime}
                onChange={(e) => setLocalTime(e.target.value)}
                className="w-full bg-card border border-border-strong rounded px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-white"
                placeholder="14:15 or 9:40 PM"
              />
              <span className="text-[10px] text-slate-500">Permissible: 8:00 AM – 9:00 PM</span>
            </div>

            <div>
              <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                Call Attempts in Last 7 Days
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={attempts7Days}
                onChange={(e) => setAttempts7Days(parseInt(e.target.value) || 1)}
                className="w-full bg-card border border-border-strong rounded px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-white"
              />
              <span className="text-[10px] text-slate-500">Reg F 7-in-7 ceiling: max 7</span>
            </div>

            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={isThirdParty}
                  onChange={(e) => setIsThirdParty(e.target.checked)}
                  className="rounded bg-card border-border-strong text-white focus:ring-0"
                />
                <span>Someone other than borrower answered (Third party)</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleRunTest}
            disabled={loading}
            className="w-full py-2.5 rounded bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow"
          >
            {loading ? (
              <span>Evaluating...</span>
            ) : (
              <>
                <span>▶ Run Compliance Test</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results View */}
      {result && currentResult && (
        <div className="pt-4 border-t border-border-subtle space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-bold text-white">Custom Evaluation Findings</h3>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                {currentResult.overall_status === 'PASS' ? (
                  <span className="px-2 py-0.5 rounded bg-signal-teal-bg text-signal-teal border border-signal-teal-border font-bold">
                    ✓ PASS (0 Issues)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-signal-red-bg text-signal-red border border-signal-red-border font-bold">
                    ✕ {currentResult.overall_status} ({currentResult.total_issues} {currentResult.total_issues === 1 ? 'Issue' : 'Issues'})
                  </span>
                )}
              </div>
            </div>

            {/* Mode switch */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">View Mode:</span>
              <div className="inline-flex rounded p-0.5 bg-canvas-subtle border border-border-subtle text-xs">
                <button
                  onClick={() => setActiveMode('turn_level')}
                  className={`px-2.5 py-1 rounded font-mono ${
                    activeMode === 'turn_level' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Turn-level
                </button>
                <button
                  onClick={() => setActiveMode('full_context')}
                  className={`px-2.5 py-1 rounded font-mono ${
                    activeMode === 'full_context' ? 'bg-white text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Full conversation
                </button>
              </div>
            </div>
          </div>

          {/* Context Disagreement Notice */}
          {result.disagreements_count > 0 && (
            <div className="p-3 rounded-lg bg-signal-amber-bg border-l-4 border-signal-amber text-xs text-slate-200">
              <strong className="text-signal-amber font-mono">⚠️ Context-Dependent Shift: </strong>
              <span>
                {result.context_dependent_issues_uncovered} issue(s) were missed in Turn-Level mode but uncovered when evaluating with full conversation context.
              </span>
            </div>
          )}

          {/* Findings List */}
          {currentResult.findings.length === 0 ? (
            <div className="p-6 text-center bg-canvas-subtle rounded-lg border border-border-subtle text-xs text-signal-teal">
              ✓ No potential violations detected in {activeMode === 'turn_level' ? 'turn-level' : 'full-context'} mode.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentResult.findings.map((f, i) => (
                <div key={i} className="p-3.5 rounded-lg bg-card-subtle border border-border-strong text-xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-signal-red">{f.rule_id}</span>
                    <span className="font-mono text-[10px] uppercase font-bold text-slate-400">Turn {f.turn_id}</span>
                  </div>
                  <div className="font-bold text-white text-xs">{f.rule_name}</div>
                  <div className="text-slate-300">{f.explanation}</div>
                  {f.conversation_context && (
                    <div className="p-2 rounded bg-signal-amber-bg/30 border border-signal-amber-border text-[11px] text-slate-300">
                      <strong className="text-signal-amber font-mono">Context: </strong>{f.conversation_context}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400 pt-1 border-t border-border-subtle">
                    <span className="font-semibold text-slate-300">Remediation: </span>{f.remediation}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
