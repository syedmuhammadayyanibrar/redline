# Redline

> An in-browser compliance test bench for AI debt-collection voice agents under FDCPA and CFPB Regulation F.

![Redline Compliance Test Bench](docs/screenshot.png)

Live Demo: [https://syedmuhammadayyanibrar.github.io/redline/](https://syedmuhammadayyanibrar.github.io/redline/)

---

## Run It

Redline is a zero-dependency static application built with plain HTML, CSS, and vanilla ES modules.

Serve it with any local static HTTP server:

```bash
# Python 3
python3 -m http.server 8000

# Or with Node.js
npx serve .
```

Open [http://localhost:8000](http://localhost:8000) in your browser.

### Run Tests

Execute the deterministic rules engine test suite using Node's built-in test runner:

```bash
node --test
```

---

## How It Works

Redline evaluates dialogue transcripts against deterministic operational readings of federal lending compliance mandates. It makes visible why **conversation context** matters: a turn-level safety filter judges individual utterances in isolation, missing violations whose legal meaning depends on earlier statements in the call.

### Rules Table

| Rule | Citation | What It Checks |
| :--- | :--- | :--- |
| **Calling hours** | Reg F §1006.6(b)(1) | Flags calls placed outside 8:00 AM – 9:00 PM in the borrower's local time zone. |
| **Call frequency** | Reg F §1006.14(b)(2) | Flags outreach exceeding the statutory ceiling of 7 call attempts within 7 consecutive days. |
| **Third-party disclosure** | FDCPA §805(b) | Flags any disclosure of debt details, balances, or delinquency when speaking to a third party (e.g., spouse). |
| **Missing disclosure** | FDCPA §807(11) | Flags discussing debt balances without stating that the communication is an attempt to collect a debt (Mini-Miranda). |
| **Cease communication** | FDCPA §805(c) | Flags continued payment demands after a consumer demands calls stop (*Context-dependent*). |
| **Disputed debt** | FDCPA §809(b) | Flags continued collection pressure after a dispute without offering validation notice (*Context-dependent*). |
| **Threat** | FDCPA §807(4)–(5) | Flags false or unlawful threats of wage garnishment, asset seizure, lawsuit, or arrest. |

---

## Limitations

- **Scripted Transcripts:** All scenarios use synthetic test cases designed to isolate specific regulatory edge cases.
- **Strawman Baseline:** The naive agent is a deliberate baseline unconstrained by compliance state tracking, not a commercial product.
- **Simplified Operational Rules:** The encoded rules represent simplified readings of federal statutes for engineering evaluation and do not substitute for comprehensive legal counsel or formal compliance audits.

---

## What I'd Build Next

1. **Streaming Audio Token Interceptor:** Run the compliance rules engine directly on streaming LLM generation tokens to halt audio playback before non-compliant tokens reach the voice synthesizer.
2. **State-Level Regulation Engine:** Extend the rulebook to handle state-level debt collection laws (e.g., California Rosenthal Act, NYC DCWP rules, and Massachusetts 940 CMR 7.00 frequency restrictions).
3. **Multi-Party Consent Ledger:** Integrate verifiable consumer consent records and authentication handoffs before transferring or discussing accounts with authorized third parties.

---

## Author

Built by **Syed Ayyan** as a portfolio project for [Veritus](https://www.veritus.ai/).
- GitHub: [https://github.com/syedmuhammadayyanibrar](https://github.com/syedmuhammadayyanibrar)
- Resume: [https://resume-five-flame-98.vercel.app/](https://resume-five-flame-98.vercel.app/)

## License

[MIT](LICENSE)
