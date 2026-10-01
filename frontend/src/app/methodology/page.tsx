'use client';

import React from 'react';
import { Navbar } from '../../components/Navbar';
import Link from 'next/link';

export default function MethodologyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-canvas text-slate-100">
      <Navbar activeTab="methodology" />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="space-y-2 border-b border-border-subtle pb-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-xs font-mono text-slate-400 hover:text-white transition-colors">
              ← Back to Test Bench
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Compliance Evaluation Methodology
          </h1>
          <p className="text-sm text-slate-400">
            Design principles, statutory readings, and evaluation architecture behind Redline's deterministic compliance engine.
          </p>
        </div>

        <div className="space-y-6 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
          {/* 1. Why the project exists */}
          <div className="p-5 rounded-xl bg-card border border-border-strong space-y-2.5">
            <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
              1. Why the Project Exists
            </h2>
            <p>
              In regulated debt collection and consumer lending, automated conversational voice agents are subject to strict federal statutes—primarily the Fair Debt Collection Practices Act (FDCPA, 15 U.S.C. § 1692 et seq.) and CFPB Regulation F (12 CFR Part 1006). Violations carry statutory civil liabilities of up to $1,000 per violation, actual damages, and class-action exposure.
            </p>
            <p>
              Existing LLM guardrails and prompt safety wrappers often evaluate utterances in complete isolation (turn-by-turn). This creates catastrophic blind spots: a response that appears polite and standard on its own can constitute an egregious statutory violation when evaluated in the context of what the consumer said earlier. <strong>Redline</strong> was built as an independent engineering prototype to demonstrate why conversational context is non-negotiable for compliance testing.
            </p>
          </div>

          {/* 2. What is being tested */}
          <div className="p-5 rounded-xl bg-card border border-border-strong space-y-2.5">
            <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
              2. What is Being Tested
            </h2>
            <p>
              Redline tests conversational agents against 9 explicit compliance rules derived from public FDCPA and Regulation F concepts:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-300 text-xs">
              <li><strong>Cease-contact requests (15 U.S.C. § 1692c(c)):</strong> Prohibiting outreach after consumer demands communication stop.</li>
              <li><strong>Third-party disclosures (15 U.S.C. § 1692c(b)):</strong> Forbidding disclosure of debt existence or balances to non-consumers.</li>
              <li><strong>Disputed debt validation (15 U.S.C. § 1692g(b)):</strong> Mandating immediate suspension of collection demands until written validation is mailed.</li>
              <li><strong>Permissible calling hours (12 CFR § 1006.6(b)(1)):</strong> Enforcing the 8:00 AM – 9:00 PM borrower local time calling window.</li>
              <li><strong>Deceptive &amp; false threats (15 U.S.C. § 1692e(4)-(5)):</strong> Prohibiting unlawful threats of wage garnishment, asset seizure, or process servers.</li>
              <li><strong>Call frequency capping (12 CFR § 1006.14(b)(2)):</strong> Enforcing the statutory 7-calls-in-7-days presumption ceiling.</li>
              <li><strong>Sensitive financial disclosures:</strong> Guarding specific dollar amounts and account suffixes when non-consumers answer.</li>
              <li><strong>Hardship disregard &amp; coercion (FDCPA § 806):</strong> Identifying coercive payment demands when a consumer reports catastrophic job loss or medical insolvency.</li>
              <li><strong>Mini-Miranda disclosures (15 U.S.C. § 1692e(11)):</strong> Requiring clear initial disclosure of the debt collection purpose.</li>
            </ul>
          </div>

          {/* 3 & 4. Turn-Level vs Full-Context */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-card border border-border-strong space-y-2">
              <h3 className="text-sm font-bold text-white font-mono uppercase">
                3. Turn-Level Evaluation (Stateless)
              </h3>
              <p className="text-xs text-slate-400">
                In turn-level evaluation, each agent response is evaluated solely against the immediately available turn. While effective for detecting overt profanity or unprovoked illegal threats (e.g., immediate garnishment threats), it cannot determine whether an otherwise benign question—such as <em>"Would tomorrow afternoon work for another call?"</em>—violates a prior cease-communication request.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border-strong space-y-2">
              <h3 className="text-sm font-bold text-white font-mono uppercase">
                4. Full-Context Evaluation (Stateful)
              </h3>
              <p className="text-xs text-slate-400">
                In full-context evaluation, an accumulated state analyzer tracks prior consumer disclosures, dispute statements, identity verifications, and cease demands. When an agent speaks, the rules engine checks the response against the entire conversation history, uncovering context-dependent compliance issues that stateless checkers miss.
              </p>
            </div>
          </div>

          {/* 5. Scenario Construction */}
          <div className="p-5 rounded-xl bg-card border border-border-strong space-y-2.5">
            <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
              5. Scenario Construction &amp; Agent Configurations
            </h2>
            <p>
              To ensure objective evaluation, Redline defines 8 scripted benchmark scenarios across key debt collection situations. Each scenario features two simulated agent configurations:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 rounded bg-canvas-subtle border border-border-subtle">
                <span className="font-bold text-white block mb-1">Prototype Baseline (Naive Agent)</span>
                <p className="text-slate-400">
                  Represents an unconstrained conversational prompt that optimizes solely for payment conversion without multi-turn regulatory guardrails.
                </p>
              </div>
              <div className="p-3 rounded bg-canvas-subtle border border-border-subtle">
                <span className="font-bold text-white block mb-1">Prototype Guarded Agent</span>
                <p className="text-slate-400">
                  Implements stateful guardrails: honors cease requests, pauses upon dispute, leaves neutral third-party messages, and offers hardship forbearance.
                </p>
              </div>
            </div>
          </div>

          {/* 6. Evaluation Methodology */}
          <div className="p-5 rounded-xl bg-card border border-border-strong space-y-2.5">
            <h2 className="text-base font-bold text-white font-mono uppercase tracking-wide">
              6. Evaluation Methodology &amp; Determinism
            </h2>
            <p>
              All metrics reported in Redline are deterministic: they are computed directly from rule executions against structured test cases. There are no stochastic hallucinations, synthetic accuracy estimates, or fabricated percentages. Every finding includes the triggering text, rule citation, context source, confidence score, and specific remediation advice.
            </p>
          </div>

          {/* 7. Limitations & Disclaimers */}
          <div className="p-5 rounded-xl bg-signal-amber-bg/30 border border-signal-amber-border space-y-2.5">
            <h2 className="text-base font-bold text-signal-amber font-mono uppercase tracking-wide">
              7. Limitations &amp; Legal Disclaimers
            </h2>
            <p className="text-xs text-slate-300">
              Redline is a prototype demonstration tool. The rules implemented are simplified engineering tests and do not constitute legal advice or exhaustive regulatory compliance frameworks. The prototype configurations do not replicate or benchmark any commercial vendor system.
            </p>
            <div className="p-3 rounded bg-canvas-subtle border border-border-strong text-xs font-mono text-slate-200">
              "Redline is an independent prototype for demonstrating conversational compliance testing. Its scenarios and rules are simplified and are not legal advice or an evaluation of Veritus's systems."
            </div>
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
