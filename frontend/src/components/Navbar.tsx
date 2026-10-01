import React from 'react';
import Link from 'next/link';

interface NavbarProps {
  activeTab: 'testbench' | 'evaluation' | 'methodology';
  setActiveTab?: (tab: 'testbench' | 'evaluation' | 'methodology') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  return (
    <header className="border-b border-border-subtle bg-canvas sticky top-0 z-50 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded bg-slate-900 border border-border-strong flex items-center justify-center font-mono font-bold text-sm text-slate-100 relative overflow-hidden shadow-inner">
              RL
              <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-signal-red -rotate-12 transform" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-100 group-hover:text-white transition-colors">
                  REDLINE
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-card-subtle text-slate-400 border border-border-subtle">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono tracking-tight hidden sm:block">
                Conversational Compliance Testing Bench
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2">
          {setActiveTab ? (
            <>
              <button
                onClick={() => setActiveTab('testbench')}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'testbench'
                    ? 'bg-card text-white border border-border-strong shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-card-subtle'
                }`}
              >
                Test Bench
              </button>
              <button
                onClick={() => setActiveTab('evaluation')}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'evaluation'
                    ? 'bg-card text-white border border-border-strong shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-card-subtle'
                }`}
              >
                Evaluation Benchmark
              </button>
              <button
                onClick={() => setActiveTab('methodology')}
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'methodology'
                    ? 'bg-card text-white border border-border-strong shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-card-subtle'
                }`}
              >
                Methodology
              </button>
            </>
          ) : (
            <>
              <Link
                href="/"
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'testbench'
                    ? 'bg-card text-white border border-border-strong shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-card-subtle'
                }`}
              >
                Test Bench
              </Link>
              <Link
                href="/evaluation"
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'evaluation'
                    ? 'bg-card text-white border border-border-strong shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-card-subtle'
                }`}
              >
                Evaluation Benchmark
              </Link>
              <Link
                href="/methodology"
                className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  activeTab === 'methodology'
                    ? 'bg-card text-white border border-border-strong shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-card-subtle'
                }`}
              >
                Methodology
              </Link>
            </>
          )}
        </nav>

        {/* Pitch Context Pill */}
        <div className="hidden lg:flex items-center">
          <span className="font-mono text-[11px] px-2.5 py-1 rounded bg-card-subtle text-slate-300 border border-border-subtle">
            Independent Prototype · Inspired by Veritus Problem Space
          </span>
        </div>
      </div>
    </header>
  );
};
