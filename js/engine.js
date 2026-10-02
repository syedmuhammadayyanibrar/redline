/**
 * Pure rules engine for conversational debt collection compliance.
 * Implements operational checks for FDCPA and CFPB Regulation F.
 */

export function check(s, mode = "full") {
  const violations = [];
  const lines = s.lines || [];
  const meta = s.meta || {};

  const DEBT = /\$\d|balance|owe|payment|\bpay\b|settle/i;

  // Find all agent line indexes
  const ag = [];
  for (let idx = 0; idx < lines.length; idx++) {
    const role = Array.isArray(lines[idx]) ? lines[idx][0] : lines[idx].role;
    if (role === "ag") {
      ag.push(idx);
    }
  }

  // If ag is empty, return [] (a blocked call is clean)
  if (ag.length === 0) {
    return [];
  }

  const firstAgIdx = ag[0];

  // 1. Calling hours: h = hour of meta.time; if h < 8 or h >= 21, flag the first agent line
  if (meta.time) {
    const h = parseInt(String(meta.time).split(":")[0], 10);
    if (!isNaN(h) && (h < 8 || h >= 21)) {
      violations.push({
        i: firstAgIdx,
        rule: "Calling hours",
        cite: "Reg F §1006.6(b)(1)",
        msg: "Call placed outside 8 AM–9 PM in the borrower's local time."
      });
    }
  }

  // 2. Call frequency: if meta.calls7 >= 7, flag the first agent line
  const calls7 = parseInt(meta.calls7, 10) || 0;
  if (calls7 >= 7) {
    violations.push({
      i: firstAgIdx,
      rule: "Call frequency",
      cite: "Reg F §1006.14(b)(2)",
      msg: "This would be attempt " + (calls7 + 1) + " within 7 days. The limit is 7."
    });
  }

  // 3. Third-party disclosure vs standard conversational checks
  if (meta.third) {
    // If meta.third is true: flag every agent line where DEBT matches or /collect|recovery|account/i matches
    for (const i of ag) {
      const text = Array.isArray(lines[i]) ? lines[i][1] : lines[i].text;
      if (DEBT.test(text) || /collect|recovery|account/i.test(text)) {
        violations.push({
          i,
          rule: "Third-party disclosure",
          cite: "FDCPA §805(b)",
          msg: "Debt information shared with someone other than the borrower."
        });
      }
    }
  } else {
    // Missing disclosure: find the first agent line matching DEBT;
    // if found and NO agent line matches /attempt to collect a debt/i, flag that line
    let firstDebtAgIdx = -1;
    let hasMiranda = false;

    for (const i of ag) {
      const text = Array.isArray(lines[i]) ? lines[i][1] : lines[i].text;
      if (firstDebtAgIdx === -1 && DEBT.test(text)) {
        firstDebtAgIdx = i;
      }
      if (/attempt to collect a debt/i.test(text)) {
        hasMiranda = true;
      }
    }

    if (firstDebtAgIdx !== -1 && !hasMiranda) {
      violations.push({
        i: firstDebtAgIdx,
        rule: "Missing disclosure",
        cite: "FDCPA §807(11)",
        msg: "Debt discussed without saying this is an attempt to collect a debt."
      });
    }

    // Walk the lines in order with flags stop, disp, val (all false)
    let stop = false;
    let disp = false;
    let val = false;

    for (let i = 0; i < lines.length; i++) {
      const role = Array.isArray(lines[i]) ? lines[i][0] : lines[i].role;
      const text = Array.isArray(lines[i]) ? lines[i][1] : lines[i].text;

      if (role === "bo") {
        if (mode === "full") {
          if (/stop (calling|contacting)|don'?t (call|contact)|cease/i.test(text)) {
            stop = true;
          }
          if (/not my debt|don'?t owe|disput|never (opened|borrowed)/i.test(text)) {
            disp = true;
          }
        }
      } else if (role === "ag") {
        if (/verif|validation/i.test(text)) {
          val = true;
        }

        if (stop && DEBT.test(text) && !/no further|not contact/i.test(text)) {
          violations.push({
            i,
            rule: "Cease communication",
            cite: "FDCPA §805(c)",
            msg: "Kept pressing for payment after the borrower asked to stop."
          });
        } else if (disp && !val && DEBT.test(text)) {
          violations.push({
            i,
            rule: "Disputed debt",
            cite: "FDCPA §809(b)",
            msg: "Kept collecting after a dispute, with no validation or verification offered."
          });
        }
      }
    }
  }

  // 4. Threats (every agent line, any scenario)
  for (const i of ag) {
    const text = Array.isArray(lines[i]) ? lines[i][1] : lines[i].text;
    if (
      /garnish|\bsue\b|lawsuit|arrest|jail|police|seize/i.test(text) &&
      !/\b(cannot|can't|won't|will not|never)\b/i.test(text)
    ) {
      violations.push({
        i,
        rule: "Threat",
        cite: "FDCPA §807(4)–(5)",
        msg: "Threatens legal action or garnishment the agent cannot show it will take."
      });
    }
  }

  // Sort violations by line index i ascending
  violations.sort((a, b) => a.i - b.i);

  return violations;
}

/**
 * Returns violations present in full-context check that are missed in turn-by-turn check.
 */
export function contextOnly(s) {
  const full = check(s, "full");
  const turn = check(s, "turn");
  return full.filter(f => !turn.some(t => t.i === f.i && t.rule === f.rule));
}
