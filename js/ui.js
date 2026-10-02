import { scenarios } from './data.js';
import { check, contextOnly } from './engine.js';

// Application state
const state = {
  selectedAgent: 'naive', // 'naive' | 'guard'
  selectedScenarioIdx: 0,
  mode: 'full', // 'full' | 'turn'
  theme: 'auto', // 'auto' | 'dark' | 'light'
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
  themeAuto: document.getElementById('themeAuto'),
  themeDark: document.getElementById('themeDark'),
  themeLight: document.getElementById('themeLight'),
  colNaive: document.getElementById('colNaive'),
  naiveScoreNum: document.getElementById('naiveScoreNum'),
  naiveTicks: document.getElementById('naiveTicks'),
  colGuarded: document.getElementById('colGuarded'),
  guardedScoreNum: document.getElementById('guardedScoreNum'),
  guardedTicks: document.getElementById('guardedTicks'),
  btnModeFull: document.getElementById('btnModeFull'),
  btnModeTurn: document.getElementById('btnModeTurn'),
  modeHelper: document.getElementById('modeHelper'),
  scenarioIndex: document.getElementById('scenarioIndex'),
  recordName: document.getElementById('recordName'),
  recordDesc: document.getElementById('recordDesc'),
  btnPlay: document.getElementById('btnPlay'),
  btnSkip: document.getElementById('btnSkip'),
  tapeTrack: document.getElementById('tapeTrack'),
  tapePlayhead: document.getElementById('tapePlayhead'),
  callTicket: document.getElementById('callTicket'),
  transcriptStream: document.getElementById('transcriptStream'),
  verdictStamp: document.getElementById('verdictStamp'),
  verdictSentence: document.getElementById('verdictSentence'),
  customTextarea: document.getElementById('customTextarea'),
  customTime: document.getElementById('customTime'),
  customCalls7: document.getElementById('customCalls7'),
  customThird: document.getElementById('customThird'),
  btnRunCustom: document.getElementById('btnRunCustom'),
  btnLoadExample: document.getElementById('btnLoadExample'),
  customError: document.getElementById('customError')
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
 * Theme toggle handler: Auto / Dark / Light.
 * Remembers nothing (no localStorage).
 */
function setTheme(newTheme) {
  state.theme = newTheme;
  if (newTheme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else if (newTheme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }

  [dom.themeAuto, dom.themeDark, dom.themeLight].forEach(btn => {
    if (btn) {
      const isMatch = btn.dataset.themeVal === newTheme;
      btn.classList.toggle('active', isMatch);
      btn.setAttribute('aria-pressed', isMatch ? 'true' : 'false');
    }
  });
}

/**
 * Updates scoreboard versus strip (numeral, ticks, selected state).
 */
function renderScoreboard() {
  let naiveCleanCount = 0;
  let guardedCleanCount = 0;
  const naiveTicksData = [];
  const guardedTicksData = [];

  scenarios.forEach(sc => {
    // Naive audit
    const vNaive = check({ meta: sc.meta, lines: sc.naive }, state.mode);
    const naiveClean = vNaive.length === 0;
    if (naiveClean) naiveCleanCount++;
    naiveTicksData.push({
      name: sc.name,
      clean: naiveClean,
      count: vNaive.length
    });

    // Guarded audit
    const vGuard = check({ meta: sc.meta, lines: sc.guard }, state.mode);
    const guardClean = vGuard.length === 0;
    if (guardClean) guardedCleanCount++;
    guardedTicksData.push({
      name: sc.name,
      clean: guardClean,
      count: vGuard.length
    });
  });

  dom.naiveScoreNum.textContent = `${naiveCleanCount}/6`;
  dom.guardedScoreNum.textContent = `${guardedCleanCount}/6`;

  // Render 6 ticks for Naive
  dom.naiveTicks.innerHTML = '';
  naiveTicksData.forEach(t => {
    const tick = document.createElement('div');
    tick.className = `versus-tick ${t.clean ? 'clean' : 'flagged'}`;
    const label = `${t.name}: ${t.clean ? 'clean' : t.count + ' flagged'}`;
    tick.title = label;
    tick.setAttribute('aria-label', label);
    dom.naiveTicks.appendChild(tick);
  });

  // Render 6 ticks for Guarded
  dom.guardedTicks.innerHTML = '';
  guardedTicksData.forEach(t => {
    const tick = document.createElement('div');
    tick.className = `versus-tick ${t.clean ? 'clean' : 'flagged'}`;
    const label = `${t.name}: ${t.clean ? 'clean' : t.count + ' flagged'}`;
    tick.title = label;
    tick.setAttribute('aria-label', label);
    dom.guardedTicks.appendChild(tick);
  });

  // Selection state
  const isNaiveSelected = state.selectedAgent === 'naive';
  dom.colNaive.classList.toggle('selected', isNaiveSelected);
  dom.colNaive.setAttribute('aria-pressed', isNaiveSelected ? 'true' : 'false');

  dom.colGuarded.classList.toggle('selected', !isNaiveSelected);
  dom.colGuarded.setAttribute('aria-pressed', !isNaiveSelected ? 'true' : 'false');
}

/**
 * Renders scenario index (numbered typographic list).
 */
function renderScenarioIndex() {
  dom.scenarioIndex.innerHTML = '';

  scenarios.forEach((sc, idx) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    const isActive = !state.isCustom && idx === state.selectedScenarioIdx;
    btn.className = `scenario-row ${isActive ? 'active' : ''}`;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');

    const lines = sc[state.selectedAgent];
    const violations = check({ meta: sc.meta, lines }, state.mode);
    const isClean = violations.length === 0;

    const numStr = String(idx + 1).padStart(2, '0');

    btn.innerHTML = `
      <span class="scenario-num">${numStr}</span>
      <span class="scenario-name">${escapeHtml(sc.name)}</span>
      <span class="scenario-status ${isClean ? 'clean' : 'flagged'}">
        <span class="status-dot" aria-hidden="true"></span>
        <span>${isClean ? 'clean' : violations.length + ' flagged'}</span>
      </span>
    `;

    btn.addEventListener('click', () => {
      state.isCustom = false;
      state.selectedScenarioIdx = idx;
      stopPlayback();
      renderScenarioIndex();
      renderCallRecord();
    });

    dom.scenarioIndex.appendChild(btn);
  });
}

/**
 * Returns current scenario object.
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
 * Merges and marks spans inside a text string.
 */
function highlightOffendingPhrases(rawText, activeViolations, missedViolations) {
  // If there are no spans, return null so caller knows whether to underline whole line
  const spanRanges = [];

  activeViolations.forEach(v => {
    if (v.span && Array.isArray(v.span) && v.span.length === 2) {
      spanRanges.push({ start: v.span[0], end: v.span[1], type: 'flagged' });
    }
  });

  missedViolations.forEach(v => {
    if (v.span && Array.isArray(v.span) && v.span.length === 2) {
      spanRanges.push({ start: v.span[0], end: v.span[1], type: 'missed' });
    }
  });

  if (spanRanges.length === 0) {
    return null;
  }

  // Sort by start index
  spanRanges.sort((a, b) => a.start - b.start);

  let resultHtml = '';
  let cursor = 0;

  for (const r of spanRanges) {
    if (r.start < cursor) continue; // skip nested/overlapping for simplicity
    if (r.start > cursor) {
      resultHtml += escapeHtml(rawText.slice(cursor, r.start));
    }
    const phrase = rawText.slice(r.start, r.end);
    const cls = r.type === 'missed' ? 'missed-phrase' : 'flagged-phrase';
    resultHtml += `<mark class="${cls}">${escapeHtml(phrase)}</mark>`;
    cursor = r.end;
  }

  if (cursor < rawText.length) {
    resultHtml += escapeHtml(rawText.slice(cursor));
  }

  return resultHtml;
}

/**
 * Renders Call Tape (signature element).
 */
function renderCallTape(lines, violations) {
  // Remove existing ticks (keep playhead)
  const existingTicks = dom.tapeTrack.querySelectorAll('.tape-tick');
  existingTicks.forEach(t => t.remove());

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  lines.forEach((line, idx) => {
    const role = line[0];
    const lineV = violations.filter(v => v.i === idx);
    const hasV = lineV.length > 0;

    const tick = document.createElement('button');
    tick.type = 'button';
    tick.id = `tick-${idx}`;
    tick.dataset.index = String(idx);

    let roleCls = 'ag';
    let roleLabel = 'Agent';
    if (role === 'bo') {
      roleCls = 'bo';
      roleLabel = 'Borrower';
    } else if (role === 'sys') {
      roleCls = 'sys';
      roleLabel = 'System';
    }

    const isLit = !state.playback.isPlaying || idx <= state.playback.lineIndex || prefersReduced;

    tick.className = `tape-tick ${roleCls} ${hasV ? 'violating' : ''} ${isLit ? 'lit' : ''}`;
    tick.setAttribute('aria-label', `Line ${idx + 1}: ${roleLabel}. ${hasV ? lineV.length + ' violation(s)' : 'Clean'}.`);

    tick.innerHTML = `
      <span class="tick-dot" aria-hidden="true"></span>
      <span class="tick-bar" aria-hidden="true"></span>
      <span class="tick-label" aria-hidden="true">${idx + 1}</span>
    `;

    // Keyboard arrow navigation
    tick.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const next = document.getElementById(`tick-${idx + 1}`);
        if (next) next.focus();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prev = document.getElementById(`tick-${idx - 1}`);
        if (prev) prev.focus();
      }
    });

    // Click to scroll to line & highlight
    tick.addEventListener('click', () => {
      jumpToLine(idx);
    });

    dom.tapeTrack.appendChild(tick);
  });

  updatePlayhead();
}

/**
 * Updates playhead position on the Call Tape.
 */
function updatePlayhead() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!state.playback.isPlaying || prefersReduced || state.playback.lineIndex < 0) {
    dom.tapePlayhead.style.display = 'none';
    return;
  }

  const currentTick = document.getElementById(`tick-${state.playback.lineIndex}`);
  if (currentTick) {
    dom.tapePlayhead.style.display = 'block';
    const leftPos = currentTick.offsetLeft + (currentTick.offsetWidth / 2);
    dom.tapePlayhead.style.left = `${leftPos}px`;
  }
}

/**
 * Scrolls to a line and gives it a flash highlight.
 */
function jumpToLine(idx) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lineEl = document.getElementById(`transcriptLine-${idx}`);
  if (lineEl) {
    lineEl.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'center' });
    lineEl.classList.remove('jump-flash');
    // Trigger reflow for animation restart
    void lineEl.offsetWidth;
    lineEl.classList.add('jump-flash');
  }
}

/**
 * Renders call record details (header, tape, ticket, transcript, verdict stamp).
 */
function renderCallRecord() {
  const current = getCurrentScenario();
  const meta = current.meta || {};
  const lines = current.lines || [];

  dom.recordName.textContent = current.name;
  dom.recordDesc.textContent = current.desc;

  // Run engine
  const violations = check({ meta, lines }, state.mode);
  const ctxOnly = contextOnly({ meta, lines });

  // Update Call Tape
  renderCallTape(lines, violations);

  // Update Call Ticket
  // LOCAL TIME / ATTEMPTS IN 7 DAYS / ANSWERED BY
  const h = parseInt(String(meta.time || '').split(':')[0], 10);
  const isTimeViolation = !isNaN(h) && (h < 8 || h >= 21);
  const timeFlag = isTimeViolation ? ' (outside window)' : '';

  const calls7 = parseInt(meta.calls7, 10) || 0;
  const isCallsViolation = calls7 >= 7;
  const callsFlag = isCallsViolation ? ' (limit reached)' : '';

  const isThird = Boolean(meta.third);
  const hasThirdDisclosureViolation = isThird && violations.some(v => v.rule === 'Third-party disclosure');
  const answeredText = isThird ? 'someone else' : 'borrower';
  const thirdFlag = hasThirdDisclosureViolation ? ' (third party)' : '';

  dom.callTicket.innerHTML = `
    <span class="ticket-field ${isTimeViolation ? 'flagged' : ''}">
      LOCAL TIME ${escapeHtml(meta.time || '12:00')}${escapeHtml(timeFlag)}
    </span>
    <span class="ticket-sep" aria-hidden="true">/</span>
    <span class="ticket-field ${isCallsViolation ? 'flagged' : ''}">
      ATTEMPTS IN 7 DAYS ${calls7}${escapeHtml(callsFlag)}
    </span>
    <span class="ticket-sep" aria-hidden="true">/</span>
    <span class="ticket-field ${hasThirdDisclosureViolation ? 'flagged' : ''}">
      ANSWERED BY ${escapeHtml(answeredText)}${escapeHtml(thirdFlag)}
    </span>
  `;

  // Render Transcript lines
  dom.transcriptStream.innerHTML = '';
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  lines.forEach((line, idx) => {
    const role = line[0];
    const rawText = line[1];

    const row = document.createElement('div');
    row.id = `transcriptLine-${idx}`;
    row.className = `transcript-line ${role}`;

    // Playback reveal visibility
    if (state.playback.isPlaying && idx > state.playback.lineIndex && !prefersReduced) {
      row.style.display = 'none';
    }

    const lineV = violations.filter(v => v.i === idx);
    const lineCtx = ctxOnly.filter(v => v.i === idx);

    if (lineV.length > 0) {
      row.classList.add('violating');
    }

    // Text formatting with spans
    let textHtml = '';
    const marked = highlightOffendingPhrases(rawText, lineV, state.mode === 'turn' ? lineCtx : []);

    if (marked !== null) {
      textHtml = marked;
    } else if (lineV.length > 0) {
      // No span: underline whole line
      textHtml = `<mark class="flagged-phrase">${escapeHtml(rawText)}</mark>`;
    } else {
      textHtml = escapeHtml(rawText);
    }

    // Gutter
    let gutterHtml = '';
    if (role === 'sys') {
      gutterHtml = '';
    } else {
      const numStr = String(idx + 1).padStart(2, '0');
      const speakerStr = role === 'ag' ? 'AGENT' : 'BORROWER';
      gutterHtml = `
        <div class="line-gutter">
          <span class="line-num">${numStr}</span>
          <span class="line-speaker">${speakerStr}</span>
        </div>
      `;
    }

    // Marginalia annotations
    let marginaliaHtml = '';
    const showActive = lineV.length > 0;
    const showMissed = state.mode === 'turn' && lineCtx.length > 0;

    if (showActive || showMissed) {
      let itemsHtml = '';

      // Active violations
      lineV.forEach(v => {
        const isCtxInFull = state.mode === 'full' && lineCtx.some(c => c.rule === v.rule);
        itemsHtml += `
          <div class="marginalia-item">
            <div class="marginalia-header">
              ${isCtxInFull ? '<span class="marginalia-chip context">CONTEXT</span>' : ''}
              <span class="marginalia-cite">${escapeHtml(v.cite)}</span>
              <span class="marginalia-rule">${escapeHtml(v.rule)}</span>
            </div>
            <div class="marginalia-msg">${escapeHtml(v.msg)}</div>
          </div>
        `;
      });

      // Missed in turn mode
      if (showMissed) {
        lineCtx.forEach(v => {
          itemsHtml += `
            <div class="marginalia-item missed">
              <div class="marginalia-header">
                <span class="marginalia-chip missed">MISSED</span>
                <span class="marginalia-cite">${escapeHtml(v.cite)}</span>
                <span class="marginalia-rule">${escapeHtml(v.rule)}</span>
              </div>
              <div class="marginalia-msg">Missed by the turn-by-turn check. Needs context from earlier in the call.</div>
            </div>
          `;
        });
      }

      marginaliaHtml = `
        <div class="line-marginalia">
          <div class="marginalia-connector ${showMissed && !showActive ? 'missed' : ''}" aria-hidden="true"></div>
          <div class="marginalia-stack">
            ${itemsHtml}
          </div>
        </div>
      `;
    }

    row.innerHTML = `
      <div class="line-content-wrap">
        ${gutterHtml}
        <div class="line-body">
          ${textHtml}
        </div>
      </div>
      ${marginaliaHtml}
    `;

    dom.transcriptStream.appendChild(row);
  });

  // Render Verdict Stamp
  const totalViolations = violations.length;
  const isFailed = totalViolations > 0;

  dom.verdictStamp.className = `verdict-stamp ${isFailed ? 'flagged' : 'clean'}`;
  dom.verdictStamp.textContent = isFailed
    ? `FAILED REVIEW · ${totalViolations} VIOLATION${totalViolations === 1 ? '' : 'S'}`
    : 'CLEAR · NO VIOLATIONS';

  if (isFailed) {
    dom.verdictSentence.textContent = violations[0].msg;
  } else if (lines.length > 0 && lines[0][0] === 'sys') {
    dom.verdictSentence.textContent = 'The call was blocked before the agent spoke.';
  } else {
    dom.verdictSentence.textContent = 'The agent handled this conversation within legal boundaries.';
  }

  // Trigger stamp animation if not playing
  if (!state.playback.isPlaying) {
    dom.verdictStamp.classList.remove('stamp-animate');
    void dom.verdictStamp.offsetWidth;
    dom.verdictStamp.classList.add('stamp-animate');
  }
}

/**
 * Starts line-by-line playback (850ms per line).
 */
function startPlayback() {
  const current = getCurrentScenario();
  const lines = current.lines || [];
  if (lines.length === 0) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    stopPlayback(true);
    return;
  }

  state.playback.isPlaying = true;
  state.playback.lineIndex = 0;

  dom.btnPlay.disabled = true;
  dom.btnPlay.textContent = `Playing 1/${lines.length}`;
  dom.btnSkip.style.display = 'inline-flex';

  renderCallRecord();

  state.playback.timer = setInterval(() => {
    state.playback.lineIndex++;
    if (state.playback.lineIndex >= lines.length) {
      stopPlayback(true);
    } else {
      dom.btnPlay.textContent = `Playing ${state.playback.lineIndex + 1}/${lines.length}`;
      renderCallRecord();

      // Line reveal animation
      const lineEl = document.getElementById(`transcriptLine-${state.playback.lineIndex}`);
      if (lineEl) {
        lineEl.style.display = '';
        lineEl.classList.add('revealing');
      }
    }
  }, state.playback.speedMs);
}

/**
 * Stops playback. If skipToEnd is true, reveals full transcript.
 */
function stopPlayback(skipToEnd = false) {
  if (state.playback.timer) {
    clearInterval(state.playback.timer);
    state.playback.timer = null;
  }
  state.playback.isPlaying = false;
  state.playback.lineIndex = -1;

  dom.btnPlay.disabled = false;
  dom.btnPlay.textContent = 'Play call';
  dom.btnSkip.style.display = 'none';

  renderCallRecord();
}

/**
 * Handles custom transcript parse and audit.
 */
function handleRunCustomChecks() {
  dom.customError.style.display = 'none';
  dom.customError.textContent = '';

  const text = (dom.customTextarea.value || '').trim();
  if (!text) {
    dom.customError.textContent = 'Please enter transcript lines in the format "ag: text", "bo: text", or "sys: text".';
    dom.customError.style.display = 'block';
    return;
  }

  // Parse lines
  const rawLines = text.split('\n');
  const lines = [];

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i].trim();
    if (!raw) continue;

    const match = raw.match(/^(ag|agent|bo|borrower|sys|system)\s*:\s*(.+)$/i);
    if (!match) {
      dom.customError.textContent = `Line ${i + 1} does not match format "ag: text", "bo: text", or "sys: text".`;
      dom.customError.style.display = 'block';
      return;
    }

    let role = 'ag';
    const rLower = match[1].toLowerCase();
    if (rLower === 'bo' || rLower === 'borrower') role = 'bo';
    else if (rLower === 'sys' || rLower === 'system') role = 'sys';

    lines.push([role, match[2].trim()]);
  }

  if (lines.length === 0) {
    dom.customError.textContent = 'Please enter at least one conversation line.';
    dom.customError.style.display = 'block';
    return;
  }

  const hasAgentLine = lines.some(l => l[0] === 'ag');
  if (!hasAgentLine && lines[0][0] !== 'sys') {
    dom.customError.textContent = 'Transcript must contain at least one agent line (ag: ...) to evaluate.';
    dom.customError.style.display = 'block';
    return;
  }

  const timeVal = (dom.customTime.value || '12:00').trim();
  const calls7Val = parseInt(dom.customCalls7.value, 10) || 0;
  const thirdVal = dom.customThird.checked;

  state.isCustom = true;
  state.customScenario = {
    name: 'Custom test transcript',
    desc: `User submitted transcript · Time ${timeVal} · Prior calls: ${calls7Val} · Third-party: ${thirdVal ? 'Yes' : 'No'}`,
    meta: {
      time: timeVal,
      calls7: calls7Val,
      third: thirdVal
    },
    lines
  };

  stopPlayback(true);
  renderScenarioIndex();
  renderCallRecord();

  // Scroll to call record and set focus to title
  dom.recordName.scrollIntoView({ behavior: 'smooth', block: 'start' });
  dom.recordName.focus();
}

/**
 * Loads default example into custom test form.
 */
function handleLoadExample() {
  dom.customTextarea.value = [
    'ag: Hi, this is Sam about your $640 balance.',
    'bo: Please stop calling me.',
    "ag: If you don't pay this week we will sue you."
  ].join('\n');

  dom.customTime.value = '20:30';
  dom.customCalls7.value = '3';
  dom.customThird.checked = false;
  dom.customError.style.display = 'none';

  handleRunCustomChecks();
}

/**
 * Sets up all event listeners.
 */
function setupEvents() {
  // Theme toggle buttons (Auto / Dark / Light)
  if (dom.themeAuto) dom.themeAuto.addEventListener('click', () => setTheme('auto'));
  if (dom.themeDark) dom.themeDark.addEventListener('click', () => setTheme('dark'));
  if (dom.themeLight) dom.themeLight.addEventListener('click', () => setTheme('light'));

  // Scoreboard versus strip selection
  dom.colNaive.addEventListener('click', () => {
    if (state.selectedAgent !== 'naive') {
      state.selectedAgent = 'naive';
      state.isCustom = false;
      stopPlayback();
      renderScoreboard();
      renderScenarioIndex();
      renderCallRecord();
    }
  });

  dom.colGuarded.addEventListener('click', () => {
    if (state.selectedAgent !== 'guard') {
      state.selectedAgent = 'guard';
      state.isCustom = false;
      stopPlayback();
      renderScoreboard();
      renderScenarioIndex();
      renderCallRecord();
    }
  });

  // Mode switch
  dom.btnModeFull.addEventListener('click', () => {
    if (state.mode !== 'full') {
      state.mode = 'full';
      dom.btnModeFull.classList.add('active');
      dom.btnModeFull.setAttribute('aria-selected', 'true');
      dom.btnModeTurn.classList.remove('active');
      dom.btnModeTurn.setAttribute('aria-selected', 'false');
      dom.modeHelper.textContent = 'Each line is judged with everything said before it.';
      renderScoreboard();
      renderScenarioIndex();
      renderCallRecord();
    }
  });

  dom.btnModeTurn.addEventListener('click', () => {
    if (state.mode !== 'turn') {
      state.mode = 'turn';
      dom.btnModeTurn.classList.add('active');
      dom.btnModeTurn.setAttribute('aria-selected', 'true');
      dom.btnModeFull.classList.remove('active');
      dom.btnModeFull.setAttribute('aria-selected', 'false');
      dom.modeHelper.textContent = 'Each line is judged alone, with no memory of earlier lines.';
      renderScoreboard();
      renderScenarioIndex();
      renderCallRecord();
    }
  });

  // Play controls
  dom.btnPlay.addEventListener('click', () => {
    if (!state.playback.isPlaying) {
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
 * Initializes application.
 */
function init() {
  setupEvents();

  // Support ?theme=light or ?theme=dark query param
  const urlParams = new URLSearchParams(window.location.search);
  const paramTheme = urlParams.get('theme');
  if (paramTheme === 'light' || paramTheme === 'dark') {
    setTheme(paramTheme);
  }

  renderScoreboard();
  renderScenarioIndex();
  renderCallRecord();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
