import { scenarios } from './data.js';
import { check, contextOnly } from './engine.js';

// Application state
const state = {
  selectedAgent: 'naive', // 'naive' | 'guard'
  selectedScenarioIdx: 0,
  mode: 'full', // 'full' | 'turn'
  theme: 'auto', // 'auto' | 'light' | 'dark'
  isCustom: false,
  customScenario: null,
  playback: {
    isPlaying: false,
    lineIndex: -1, // -1 means all revealed
    timer: null,
    speedMs: 850
  }
};

// Cached DOM references
const dom = {
  themeToggle: document.getElementById('themeToggle'),
  themeToggleLabel: document.getElementById('themeToggleLabel'),
  scoreboardModeMeta: document.getElementById('scoreboardModeMeta'),
  cardNaive: document.getElementById('cardNaive'),
  naiveScoreNum: document.getElementById('naiveScoreNum'),
  naiveSegments: document.getElementById('naiveSegments'),
  cardGuarded: document.getElementById('cardGuarded'),
  guardedScoreNum: document.getElementById('guardedScoreNum'),
  guardedSegments: document.getElementById('guardedSegments'),
  btnModeFull: document.getElementById('btnModeFull'),
  btnModeTurn: document.getElementById('btnModeTurn'),
  modeHelperText: document.getElementById('modeHelperText'),
  scenarioList: document.getElementById('scenarioList'),
  scenarioTitle: document.getElementById('scenarioTitle'),
  scenarioDesc: document.getElementById('scenarioDesc'),
  btnPlay: document.getElementById('btnPlay'),
  btnSkip: document.getElementById('btnSkip'),
  playLabel: document.getElementById('playLabel'),
  ticketCellTime: document.getElementById('ticketCellTime'),
  ticketValTime: document.getElementById('ticketValTime'),
  ticketFlagTime: document.getElementById('ticketFlagTime'),
  ticketCellCalls: document.getElementById('ticketCellCalls'),
  ticketValCalls: document.getElementById('ticketValCalls'),
  ticketFlagCalls: document.getElementById('ticketFlagCalls'),
  ticketCellAnswered: document.getElementById('ticketCellAnswered'),
  ticketValAnswered: document.getElementById('ticketValAnswered'),
  ticketFlagAnswered: document.getElementById('ticketFlagAnswered'),
  mobileCountChip: document.getElementById('mobileCountChip'),
  transcriptStream: document.getElementById('transcriptStream'),
  marginList: document.getElementById('marginList'),
  verdictBar: document.getElementById('verdictBar'),
  verdictHeading: document.getElementById('verdictHeading'),
  verdictDetail: document.getElementById('verdictDetail'),
  customTextarea: document.getElementById('customTextarea'),
  customInlineMsg: document.getElementById('customInlineMsg'),
  customTime: document.getElementById('customTime'),
  customCalls7: document.getElementById('customCalls7'),
  customThird: document.getElementById('customThird'),
  btnRunCustom: document.getElementById('btnRunCustom'),
  btnLoadExample: document.getElementById('btnLoadExample')
};

/**
 * Escapes HTML entities.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Theme toggle handler: Auto -> Light -> Dark -> Auto.
 * Remembers nothing (no localStorage).
 */
function handleThemeToggle() {
  if (state.theme === 'auto') {
    state.theme = 'light';
    document.documentElement.setAttribute('data-theme', 'light');
    dom.themeToggleLabel.textContent = 'Theme: Light';
  } else if (state.theme === 'light') {
    state.theme = 'dark';
    document.documentElement.setAttribute('data-theme', 'dark');
    dom.themeToggleLabel.textContent = 'Theme: Dark';
  } else {
    state.theme = 'auto';
    document.documentElement.removeAttribute('data-theme');
    dom.themeToggleLabel.textContent = 'Theme: Auto';
  }
}

/**
 * Updates scoreboard cards and 6-segment breakdown bars.
 */
function renderScoreboard() {
  let naiveCleanCount = 0;
  let guardedCleanCount = 0;
  const naiveSegmentsData = [];
  const guardedSegmentsData = [];

  scenarios.forEach((sc, idx) => {
    // Audit naive
    const vNaive = check({ meta: sc.meta, lines: sc.naive }, state.mode);
    const naiveClean = vNaive.length === 0;
    if (naiveClean) naiveCleanCount++;
    naiveSegmentsData.push({
      name: sc.name,
      count: vNaive.length,
      clean: naiveClean
    });

    // Audit guard
    const vGuard = check({ meta: sc.meta, lines: sc.guard }, state.mode);
    const guardClean = vGuard.length === 0;
    if (guardClean) guardedCleanCount++;
    guardedSegmentsData.push({
      name: sc.name,
      count: vGuard.length,
      clean: guardClean
    });
  });

  // Big numbers
  dom.naiveScoreNum.textContent = `${naiveCleanCount}/6`;
  dom.guardedScoreNum.textContent = `${guardedCleanCount}/6`;

  // Render naive segments
  dom.naiveSegments.innerHTML = '';
  naiveSegmentsData.forEach(s => {
    const seg = document.createElement('div');
    seg.className = `score-segment ${s.clean ? 'clean' : 'flagged'}`;
    const label = `${s.name}: ${s.clean ? 'clean' : s.count + ' flagged'}`;
    seg.title = label;
    seg.setAttribute('aria-label', label);
    dom.naiveSegments.appendChild(seg);
  });

  // Render guarded segments
  dom.guardedSegments.innerHTML = '';
  guardedSegmentsData.forEach(s => {
    const seg = document.createElement('div');
    seg.className = `score-segment ${s.clean ? 'clean' : 'flagged'}`;
    const label = `${s.name}: ${s.clean ? 'clean' : s.count + ' flagged'}`;
    seg.title = label;
    seg.setAttribute('aria-label', label);
    dom.guardedSegments.appendChild(seg);
  });

  // Selected card styles
  if (state.selectedAgent === 'naive') {
    dom.cardNaive.classList.add('selected');
    dom.cardNaive.setAttribute('aria-pressed', 'true');
    dom.cardGuarded.classList.remove('selected');
    dom.cardGuarded.setAttribute('aria-pressed', 'false');
  } else {
    dom.cardGuarded.classList.add('selected');
    dom.cardGuarded.setAttribute('aria-pressed', 'true');
    dom.cardNaive.classList.remove('selected');
    dom.cardNaive.setAttribute('aria-pressed', 'false');
  }

  // Header meta
  dom.scoreboardModeMeta.textContent = state.mode === 'full' ? 'MODE: FULL CONVERSATION' : 'MODE: TURN BY TURN';
}

/**
 * Renders scenario list on left.
 */
function renderScenarioList() {
  dom.scenarioList.innerHTML = '';

  scenarios.forEach((sc, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isActive = !state.isCustom && idx === state.selectedScenarioIdx;
    btn.className = `scenario-item-btn ${isActive ? 'active' : ''}`;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-current', isActive ? 'true' : 'false');

    const lines = sc[state.selectedAgent];
    const violations = check({ meta: sc.meta, lines }, state.mode);
    const isClean = violations.length === 0;

    btn.innerHTML = `
      <span class="scenario-item-name">${escapeHtml(sc.name)}</span>
      <span class="status-pill ${isClean ? 'clean' : 'flagged'}">
        ${isClean ? 'clean' : violations.length + ' flagged'}
      </span>
    `;

    btn.addEventListener('click', () => {
      state.isCustom = false;
      state.selectedScenarioIdx = idx;
      stopPlayback();
      renderScenarioList();
      renderReviewPanel();
    });

    dom.scenarioList.appendChild(btn);
  });
}

/**
 * Gets currently active scenario.
 */
function getCurrentScenario() {
  if (state.isCustom && state.customScenario) {
    return state.customScenario;
  }
  const sc = scenarios[state.selectedScenarioIdx];
  return {
    name: sc.name,
    desc: sc.desc,
    meta: sc.meta,
    lines: sc[state.selectedAgent]
  };
}

/**
 * Renders call review panel.
 */
function renderReviewPanel() {
  const current = getCurrentScenario();
  const meta = current.meta || {};
  const lines = current.lines || [];

  dom.scenarioTitle.textContent = current.name;
  dom.scenarioDesc.textContent = current.desc;

  // Run audit
  const violations = check({ meta, lines }, state.mode);
  const ctxOnly = contextOnly({ meta, lines });

  // 1. Call Ticket Strip
  // Time window: outside 08:00 to 20:59 (h < 8 || h >= 21)
  const h = parseInt(String(meta.time || '').split(':')[0], 10);
  const isTimeViolation = !isNaN(h) && (h < 8 || h >= 21);
  dom.ticketValTime.textContent = meta.time || '12:00';
  if (isTimeViolation) {
    dom.ticketCellTime.classList.add('violation');
    dom.ticketFlagTime.style.display = 'inline-flex';
  } else {
    dom.ticketCellTime.classList.remove('violation');
    dom.ticketFlagTime.style.display = 'none';
  }

  // Call frequency limit: calls7 >= 7
  const calls7 = parseInt(meta.calls7, 10) || 0;
  const isCallsViolation = calls7 >= 7;
  dom.ticketValCalls.textContent = String(calls7);
  if (isCallsViolation) {
    dom.ticketCellCalls.classList.add('violation');
    dom.ticketFlagCalls.style.display = 'inline-flex';
  } else {
    dom.ticketCellCalls.classList.remove('violation');
    dom.ticketFlagCalls.style.display = 'none';
  }

  // Answered by: Borrower or Someone else
  const isThird = Boolean(meta.third);
  dom.ticketValAnswered.textContent = isThird ? 'Someone else' : 'Borrower';
  const hasThirdDisclosureViolation = isThird && violations.some(v => v.rule === 'Third-party disclosure');
  if (hasThirdDisclosureViolation) {
    dom.ticketCellAnswered.classList.add('violation');
    dom.ticketFlagAnswered.style.display = 'inline-flex';
  } else {
    dom.ticketCellAnswered.classList.remove('violation');
    dom.ticketFlagAnswered.style.display = 'none';
  }

  // 2. Transcript Lines
  dom.transcriptStream.innerHTML = '';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  lines.forEach((line, idx) => {
    const role = line[0];
    const text = line[1];

    const row = document.createElement('div');
    row.id = `transcriptRow-${idx}`;
    row.className = `transcript-row ${role}`;

    // If playback is active, hide lines past current index
    if (state.playback.isPlaying && idx > state.playback.lineIndex && !prefersReduced) {
      row.style.display = 'none';
    }

    const lineV = violations.filter(v => v.i === idx);
    const lineCtx = ctxOnly.filter(v => v.i === idx);

    if (lineV.length > 0) {
      row.classList.add('violating');
    }

    // Turn mode missed annotation styling
    if (state.mode === 'turn' && lineCtx.length > 0) {
      row.classList.add('missed-turn');
    }

    // Gutter text
    let gutterText = '';
    if (role === 'sys') {
      gutterText = 'SYSTEM';
    } else {
      const lineNum = String(idx + 1).padStart(2, '0');
      gutterText = `${lineNum} ${role === 'ag' ? 'AGENT' : 'BORROWER'}`;
    }

    // Annotations HTML
    let annotationsHtml = '';
    if (lineV.length > 0 || (state.mode === 'turn' && lineCtx.length > 0)) {
      annotationsHtml += '<div class="annotations-container">';

      // Active violations
      lineV.forEach(v => {
        const isContextDependent = state.mode === 'full' && lineCtx.some(c => c.rule === v.rule);
        annotationsHtml += `
          <div class="annotation-row">
            <span class="annotation-chip">${escapeHtml(v.cite)}</span>
            <span class="annotation-rule-name">${escapeHtml(v.rule)}</span>
            ${isContextDependent ? '<span class="context-tag">CONTEXT</span>' : ''}
            <span class="annotation-message">${escapeHtml(v.msg)}</span>
          </div>
        `;
      });

      // Missed in turn mode
      if (state.mode === 'turn') {
        lineCtx.forEach(() => {
          annotationsHtml += `
            <div class="missed-annotation">
              <span class="missed-chip">MISSED</span>
              <span>Not caught by the turn-by-turn check. Needs context from earlier in the call.</span>
            </div>
          `;
        });
      }

      annotationsHtml += '</div>';
    }

    row.innerHTML = `
      <div class="gutter-meta">${escapeHtml(gutterText)}</div>
      <div class="row-text-content">
        <span class="row-text-body">${escapeHtml(text)}</span>
        ${annotationsHtml}
      </div>
    `;

    dom.transcriptStream.appendChild(row);
  });

  // 3. Desktop Sticky Margin Summary (>= 1000px)
  dom.marginList.innerHTML = '';
  if (violations.length === 0) {
    dom.marginList.innerHTML = '<div class="margin-clean-note">No violations found</div>';
  } else {
    violations.forEach(v => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'margin-row-btn';
      btn.innerHTML = `
        <span class="margin-row-meta">${escapeHtml(v.cite)} · Line ${v.i + 1}</span>
        <span class="margin-row-title">${escapeHtml(v.rule)}</span>
      `;

      btn.addEventListener('click', () => {
        const targetRow = document.getElementById(`transcriptRow-${v.i}`);
        if (targetRow) {
          targetRow.scrollIntoView({
            behavior: prefersReduced ? 'auto' : 'smooth',
            block: 'center'
          });
          if (!prefersReduced) {
            targetRow.classList.add('line-flash');
            setTimeout(() => targetRow.classList.remove('line-flash'), 600);
          }
        }
      });

      dom.marginList.appendChild(btn);
    });
  }

  // 4. Mobile Count Chip (< 1000px)
  if (violations.length > 0) {
    dom.mobileCountChip.classList.add('visible');
    dom.mobileCountChip.textContent = `${violations.length} violation(s) flagged`;
  } else {
    dom.mobileCountChip.classList.remove('visible');
    dom.mobileCountChip.textContent = '';
  }

  // 5. Verdict Bar
  // Show verdict when not playing, or when playback has revealed all lines
  const isFinished = !state.playback.isPlaying || state.playback.lineIndex >= lines.length - 1;
  if (isFinished) {
    dom.verdictBar.style.display = 'flex';
    const isBlocked = lines.length === 1 && lines[0][0] === 'sys';

    if (isBlocked) {
      dom.verdictBar.className = 'verdict-bar clean';
      dom.verdictHeading.textContent = 'No violations found. The call was blocked before the agent spoke.';
      dom.verdictDetail.textContent = '';
    } else if (violations.length === 0) {
      dom.verdictBar.className = 'verdict-bar clean';
      dom.verdictHeading.textContent = 'No violations found.';
      dom.verdictDetail.textContent = '';
    } else {
      dom.verdictBar.className = 'verdict-bar flagged';
      dom.verdictHeading.textContent = `${violations.length} violation(s) found. This call would fail review.`;
      dom.verdictDetail.textContent = violations[0].msg;
    }
  } else {
    dom.verdictBar.style.display = 'none';
  }
}

/**
 * Playback handlers.
 */
function startPlayback() {
  const current = getCurrentScenario();
  const totalLines = (current.lines || []).length;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    state.playback.isPlaying = false;
    state.playback.lineIndex = totalLines;
    renderReviewPanel();
    return;
  }

  state.playback.isPlaying = true;
  state.playback.lineIndex = 0;
  dom.btnPlay.disabled = true;
  dom.playLabel.textContent = `Playing 1/${totalLines}`;
  dom.btnSkip.classList.add('visible');

  renderReviewPanel();

  state.playback.timer = setInterval(() => {
    state.playback.lineIndex++;
    if (state.playback.lineIndex >= totalLines) {
      stopPlayback(true);
    } else {
      dom.playLabel.textContent = `Playing ${state.playback.lineIndex + 1}/${totalLines}`;
      renderReviewPanel();
    }
  }, state.playback.speedMs);
}

function stopPlayback(completed = false) {
  if (state.playback.timer) {
    clearInterval(state.playback.timer);
    state.playback.timer = null;
  }
  state.playback.isPlaying = false;
  dom.btnPlay.disabled = false;
  dom.playLabel.textContent = completed ? 'Replay call' : 'Play call';
  dom.btnSkip.classList.remove('visible');

  if (completed) {
    state.playback.lineIndex = 999;
  }
  renderReviewPanel();
}

/**
 * Custom transcript parsing and runner.
 * Lines starting with agent: or ag: become "ag".
 * Lines starting with borrower:, customer: or consumer: become "bo".
 * Everything else ignored.
 */
function parseCustomTranscript(text) {
  const rawLines = text.split('\n');
  const lines = [];

  for (const raw of rawLines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const agMatch = trimmed.match(/^(?:agent|ag):\s*(.*)$/i);
    if (agMatch) {
      lines.push(['ag', agMatch[1].trim()]);
      continue;
    }

    const boMatch = trimmed.match(/^(?:borrower|customer|consumer|bo):\s*(.*)$/i);
    if (boMatch) {
      lines.push(['bo', boMatch[1].trim()]);
      continue;
    }
  }

  return lines;
}

function handleRunCustomChecks() {
  const text = dom.customTextarea.value;
  const lines = parseCustomTranscript(text);

  const hasAgentLine = lines.some(l => l[0] === 'ag');
  if (!hasAgentLine) {
    dom.customInlineMsg.classList.add('visible');
    return;
  }

  dom.customInlineMsg.classList.remove('visible');

  const timeVal = dom.customTime.value || '20:30';
  const calls7Val = parseInt(dom.customCalls7.value, 10) || 0;
  const thirdVal = dom.customThird.checked;

  state.customScenario = {
    name: 'Your transcript',
    desc: 'Custom conversation evaluated live against deterministic FDCPA & Reg F rules.',
    meta: {
      time: timeVal,
      calls7: calls7Val,
      third: thirdVal
    },
    lines
  };

  state.isCustom = true;
  stopPlayback();
  renderScenarioList();
  renderReviewPanel();

  // Move focus to result heading
  dom.scenarioTitle.setAttribute('tabindex', '-1');
  dom.scenarioTitle.focus();
  dom.scenarioTitle.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleLoadExample() {
  dom.customTextarea.value = `Agent: Hi, this is Sam about your $640 balance.\nBorrower: Please stop calling me.\nAgent: If you don't pay this week we will sue you.`;
  dom.customTime.value = '20:30';
  dom.customCalls7.value = 3;
  dom.customThird.checked = false;
  dom.customInlineMsg.classList.remove('visible');
  handleRunCustomChecks();
}

/**
 * Event listeners setup.
 */
function setupEvents() {
  // Theme toggle
  dom.themeToggle.addEventListener('click', handleThemeToggle);

  // Scoreboard cards selection
  dom.cardNaive.addEventListener('click', () => {
    if (state.selectedAgent !== 'naive') {
      state.selectedAgent = 'naive';
      state.isCustom = false;
      stopPlayback();
      renderScoreboard();
      renderScenarioList();
      renderReviewPanel();
    }
  });

  dom.cardGuarded.addEventListener('click', () => {
    if (state.selectedAgent !== 'guard') {
      state.selectedAgent = 'guard';
      state.isCustom = false;
      stopPlayback();
      renderScoreboard();
      renderScenarioList();
      renderReviewPanel();
    }
  });

  // Mode segmented toggle
  dom.btnModeFull.addEventListener('click', () => {
    if (state.mode !== 'full') {
      state.mode = 'full';
      dom.btnModeFull.classList.add('active');
      dom.btnModeFull.setAttribute('aria-pressed', 'true');
      dom.btnModeTurn.classList.remove('active');
      dom.btnModeTurn.setAttribute('aria-pressed', 'false');
      dom.modeHelperText.textContent = 'Each line is judged with everything said before it.';
      renderScoreboard();
      renderScenarioList();
      renderReviewPanel();
    }
  });

  dom.btnModeTurn.addEventListener('click', () => {
    if (state.mode !== 'turn') {
      state.mode = 'turn';
      dom.btnModeTurn.classList.add('active');
      dom.btnModeTurn.setAttribute('aria-pressed', 'true');
      dom.btnModeFull.classList.remove('active');
      dom.btnModeFull.setAttribute('aria-pressed', 'false');
      dom.modeHelperText.textContent = 'Each line is judged alone, with no memory of earlier lines.';
      renderScoreboard();
      renderScenarioList();
      renderReviewPanel();
    }
  });

  // Playback
  dom.btnPlay.addEventListener('click', () => {
    if (state.playback.isPlaying) {
      stopPlayback(false);
    } else {
      startPlayback();
    }
  });

  dom.btnSkip.addEventListener('click', () => {
    stopPlayback(true);
  });

  // Custom transcript form
  dom.btnRunCustom.addEventListener('click', handleRunCustomChecks);
  dom.btnLoadExample.addEventListener('click', handleLoadExample);
}

/**
 * App initialization.
 */
function init() {
  setupEvents();
  renderScoreboard();
  renderScenarioList();
  renderReviewPanel();
}

// Bootstrap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
