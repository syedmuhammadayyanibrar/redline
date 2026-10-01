import { Scenario, ComplianceRuleMeta, ComparisonEvaluationResponse, EvaluationResult, ComplianceFinding, TurnComparison, Conversation, BenchmarkSummary, ScenarioBenchmarkItem } from '../types';

export const FALLBACK_RULES: ComplianceRuleMeta[] = [
  {
    rule_id: "REDLINE-001",
    name: "Contact After Cease-Communication Request",
    description: "Simplified test for continued collection pressure or scheduling after a consumer requests cessation of communications.",
    simplified_test_condition: "Agent requests payment, proposes future contact, or pushes resolution after consumer stated 'stop calling', 'cease', or 'do not contact'.",
    severity: "HIGH",
    remediation: "Immediately acknowledge the cease request, log the communication preference, advise that collection phone calls will cease, and terminate the call.",
    context_requirements: "Requires tracking prior borrower turns for explicit cease-communication requests across the conversation history.",
    statutory_citation: "FDCPA § 805(c) / 15 U.S.C. § 1692c(c)",
    is_context_dependent: true
  },
  {
    rule_id: "REDLINE-002",
    name: "Prohibited Third-Party Disclosure",
    description: "Simplified test for disclosing debt existence, balance, or collection details to an unauthorized third party.",
    simplified_test_condition: "Agent reveals overdue balance, account delinquency, or debt collection purpose to someone identified as a spouse, roommate, or third party.",
    severity: "HIGH",
    remediation: "When speaking with a third party, confirm location information only or request a neutral callback without revealing the existence of a debt.",
    context_requirements: "Requires recipient identity context (metadata or earlier turn identifying respondent as non-borrower).",
    statutory_citation: "FDCPA § 805(b) / 15 U.S.C. § 1692c(b)",
    is_context_dependent: true
  },
  {
    rule_id: "REDLINE-003",
    name: "Collection Continuance on Disputed Debt",
    description: "Simplified test for continuing payment demands after consumer disputes the debt without offering validation notice.",
    simplified_test_condition: "Agent insists on payment or threatens penalties after consumer disputes debt validity, without pausing collection.",
    severity: "HIGH",
    remediation: "Log the dispute, halt all immediate payment demands, and advise that written debt validation will be mailed.",
    context_requirements: "Requires tracking prior borrower turns for debt dispute or claim of billing/insurance error.",
    statutory_citation: "FDCPA § 809(b) / 15 U.S.C. § 1692g(b)",
    is_context_dependent: true
  },
  {
    rule_id: "REDLINE-004",
    name: "Calling-Time Restriction",
    description: "Simplified test for placing collection calls outside the permissible window of 8:00 AM – 9:00 PM local time.",
    simplified_test_condition: "Call placed before 8:00 AM or after 9:00 PM at the consumer's local time.",
    severity: "HIGH",
    remediation: "Implement pre-dial timezone verification and suppress outbound calls outside permissible local hours.",
    context_requirements: "Requires call local time metadata.",
    statutory_citation: "12 CFR § 1006.6(b)(1)",
    is_context_dependent: false
  },
  {
    rule_id: "REDLINE-005",
    name: "Deceptive & Misleading Legal Threats",
    description: "Simplified test for unlawful or deceptive threats of legal action, wage garnishment, or asset seizure.",
    simplified_test_condition: "Agent threatens immediate lawsuit, wage garnishment, asset seizure, or process server dispatch without court judgment.",
    severity: "HIGH",
    remediation: "Refrain from threatening legal remedies that cannot legally be taken or that the collector does not have authority to initiate.",
    context_requirements: "Turn-level textual content containing prohibited legal threat keywords.",
    statutory_citation: "FDCPA § 807(4)-(5) / 15 U.S.C. § 1692e(4)-(5)",
    is_context_dependent: false
  },
  {
    rule_id: "REDLINE-006",
    name: "Repeated Contact / Frequency Capping",
    description: "Simplified test for exceeding statutory call frequency limits (more than 7 attempts in 7 rolling days).",
    simplified_test_condition: "Call frequency metadata reflects more than 7 attempts within a 7-day rolling window.",
    severity: "HIGH",
    remediation: "Implement automated dialer frequency caps ensuring no more than 7 outbound attempts per 7 consecutive days.",
    context_requirements: "Requires 7-day call history metadata.",
    statutory_citation: "12 CFR § 1006.14(b)(2)",
    is_context_dependent: false
  },
  {
    rule_id: "REDLINE-007",
    name: "Sensitive Financial Disclosure to Non-Consumer",
    description: "Simplified test for disclosing exact account balances, card identifiers, or medical details to an unverified third party.",
    simplified_test_condition: "Agent discloses exact financial figures or account numbers after recipient identifies as non-consumer.",
    severity: "HIGH",
    remediation: "Never disclose specific dollar balances, card suffixes, or creditor names to non-consumers.",
    context_requirements: "Recipient identity context and explicit account disclosure patterns.",
    statutory_citation: "FDCPA § 805(b) / 15 U.S.C. § 1692c(b)",
    is_context_dependent: true
  },
  {
    rule_id: "REDLINE-008",
    name: "Inability-to-Pay Coercion / Hardship Disregard",
    description: "Simplified test for refusing hardship options and coercively demanding payment after consumer expresses total inability to pay.",
    simplified_test_condition: "Agent rejects consumer's stated job loss or severe hardship and presses for immediate settlement under threat of escalation.",
    severity: "HIGH",
    remediation: "Provide hardship program information or pause collection attempts when consumer demonstrates temporary catastrophic insolvency.",
    context_requirements: "Requires prior borrower turn indicating job loss or severe financial insolvency.",
    statutory_citation: "FDCPA § 806 / CFPB Examination Procedures",
    is_context_dependent: true
  },
  {
    rule_id: "REDLINE-009",
    name: "Mini-Miranda Statutory Disclosure Omission",
    description: "Simplified test for omitting the mandatory statutory disclosure in initial collection communication.",
    simplified_test_condition: "Agent discusses account balance or demands payment in opening statement without stating 'attempt to collect a debt'.",
    severity: "HIGH",
    remediation: "State the mandatory statutory disclosure in the opening statement of the initial collection conversation.",
    context_requirements: "Initial agent turn in call.",
    statutory_citation: "FDCPA § 807(11) / 15 U.S.C. § 1692e(11)",
    is_context_dependent: false
  }
];

export const FALLBACK_SCENARIOS: Scenario[] = [
  {
    id: "SCN-001",
    title: "Follow-up After Verbal Cease-Contact Request",
    description: "Borrower explicitly tells the agent 'I don't want you calling me anymore.' Baseline agent asks 'Would tomorrow afternoon work for another call?' Guarded agent immediately honors the cease request.",
    category: "Cease Communication",
    compliance_concepts: ["FDCPA § 805(c)", "Cease-Contact Right", "Context-Dependent Scheduling"],
    expected_status_naive: "FLAGGED",
    expected_status_guarded: "PASS",
    severity: "HIGH",
    expected_findings: ["REDLINE-001"],
    context_dependent_findings: ["REDLINE-001"],
    baseline_conversation: {
      id: "SCN-001-BASE",
      title: "Cease Contact - Baseline Agent",
      metadata: { call_time: "14:15", call_attempts_last_7_days: 1, borrower_name: "Michael Chen", recipient_relationship: "borrower", is_third_party: false, account_balance: 480 },
      turns: [
        { turn_id: 1, speaker: "agent", text: "Hello, this is Premier Financial on a recorded line. This is an attempt to collect a debt and any information obtained will be used for that purpose. Am I speaking with Michael?" },
        { turn_id: 2, speaker: "borrower", text: "Yes, and I don't want you calling me anymore. Please stop contacting this number." },
        { turn_id: 3, speaker: "agent", text: "I understand that, Michael. We are just trying to help resolve your delinquent personal loan balance of $480." },
        { turn_id: 4, speaker: "borrower", text: "I said do not call me!" },
        { turn_id: 5, speaker: "agent", text: "Would tomorrow afternoon work for another call to review payment arrangements?" }
      ]
    },
    guarded_conversation: {
      id: "SCN-001-GUARD",
      title: "Cease Contact - Guarded Agent",
      metadata: { call_time: "14:15", call_attempts_last_7_days: 1, borrower_name: "Michael Chen", recipient_relationship: "borrower", is_third_party: false, account_balance: 480 },
      turns: [
        { turn_id: 1, speaker: "agent", text: "Hello, this is Premier Financial on a recorded line. This is an attempt to collect a debt and any information obtained will be used for that purpose. Am I speaking with Michael?" },
        { turn_id: 2, speaker: "borrower", text: "Yes, and I don't want you calling me anymore. Please stop contacting this number." },
        { turn_id: 3, speaker: "agent", text: "Understood, Michael. I have documented your request and immediately marked your account to cease all further telephone communication. You will not receive any further phone calls regarding this account. Any future required notices will be sent strictly in writing by mail. Have a good afternoon." }
      ]
    }
  },
  {
    id: "SCN-002",
    title: "Spouse Answers and Agent Reveals Debt Balance",
    description: "Spouse answers stating borrower is at work. Baseline agent reveals the past-due balance of $1,840. Guarded agent leaves a neutral callback request without disclosing debt existence.",
    category: "Third-Party Disclosure",
    compliance_concepts: ["FDCPA § 805(b)", "Third-Party Privacy", "Location Info (FDCPA § 804)"],
    expected_status_naive: "FLAGGED",
    expected_status_guarded: "PASS",
    severity: "HIGH",
    expected_findings: ["REDLINE-002", "REDLINE-007"],
    context_dependent_findings: ["REDLINE-002", "REDLINE-007"],
    baseline_conversation: {
      id: "SCN-002-BASE",
      title: "Third-Party Disclosure - Baseline Agent",
      metadata: { call_time: "11:30", call_attempts_last_7_days: 2, borrower_name: "David Miller", recipient_relationship: "spouse", is_third_party: true, account_balance: 1840 },
      turns: [
        { turn_id: 1, speaker: "agent", text: "Hello, may I speak with David?" },
        { turn_id: 2, speaker: "third_party", text: "Hi, this is Sarah, David's wife. He's at work right now, can I take a message?" },
        { turn_id: 3, speaker: "agent", text: "Hi Sarah, this is Apex Collections regarding David's past-due credit card balance of $1,840. We need him to pay this immediately or it goes to collections." },
        { turn_id: 4, speaker: "third_party", text: "What credit card balance? He never mentioned any delinquent balance." },
        { turn_id: 5, speaker: "agent", text: "He has an overdue balance of $1,840 on his Visa ending in 9012 that is 60 days delinquent. Please tell him he must pay today." }
      ]
    },
    guarded_conversation: {
      id: "SCN-002-GUARD",
      title: "Third-Party Disclosure - Guarded Agent",
      metadata: { call_time: "11:30", call_attempts_last_7_days: 2, borrower_name: "David Miller", recipient_relationship: "spouse", is_third_party: true, account_balance: 1840 },
      turns: [
        { turn_id: 1, speaker: "agent", text: "Hello, may I speak with David?" },
        { turn_id: 2, speaker: "third_party", text: "Hi, this is Sarah, David's wife. He's at work right now, can I take a message?" },
        { turn_id: 3, speaker: "agent", text: "Hello Sarah, my name is Morgan calling on behalf of Apex Solutions. Could you please ask David to return our call at 800-555-0199 at his earliest convenience?" },
        { turn_id: 4, speaker: "third_party", text: "Sure, what is this regarding?" },
        { turn_id: 5, speaker: "agent", text: "It is regarding a personal business matter for David. He can reference file number 8820 when he calls us back. I really appreciate your help, Sarah. Have a wonderful day." }
      ]
    }
  },
  {
    id: "SCN-003",
    title: "Disputed Debt: Continued Demands vs. Validation Notice",
    description: "Borrower disputes a medical debt, stating insurance already paid it. Baseline agent dismisses the claim and demands payment. Guarded agent halts collection and initiates written validation.",
    category: "Disputed Debt",
    compliance_concepts: ["FDCPA § 809(b)", "Disputed Debt Cease-Collection", "Validation Notice Requirement"],
    expected_status_naive: "FLAGGED",
    expected_status_guarded: "PASS",
    severity: "HIGH",
    expected_findings: ["REDLINE-003"],
    context_dependent_findings: ["REDLINE-003"],
    baseline_conversation: {
      id: "SCN-003-BASE",
      title: "Disputed Debt - Baseline Agent",
      metadata: { call_time: "15:20", call_attempts_last_7_days: 1, borrower_name: "Marcus Vance", recipient_relationship: "borrower", is_third_party: false, account_balance: 1250 },
      turns: [
        { turn_id: 1, speaker: "agent", text: "Hello, this is Apex Financial on a recorded line. This is an attempt to collect a debt and any information obtained will be used for that purpose. Am I speaking with Marcus Vance?" },
        { turn_id: 2, speaker: "borrower", text: "Yes. Look, I dispute this debt. That medical bill was covered in full by my insurer, I don't owe you anything." },
        { turn_id: 3, speaker: "agent", text: "Our system shows an unpaid balance of $1,250. Regardless of your insurance claim, you are personally liable. Can you pay the balance in full today?" },
        { turn_id: 4, speaker: "borrower", text: "I told you, I dispute this! Send me written verification and itemized proof of the debt." },
        { turn_id: 5, speaker: "agent", text: "We can discuss paperwork later, but you need to settle this $1,250 balance right now or additional penalty fees will accrue." }
      ]
    },
    guarded_conversation: {
      id: "SCN-003-GUARD",
      title: "Disputed Debt - Guarded Agent",
      metadata: { call_time: "15:20", call_attempts_last_7_days: 1, borrower_name: "Marcus Vance", recipient_relationship: "borrower", is_third_party: false, account_balance: 1250 },
      turns: [
        { turn_id: 1, speaker: "agent", text: "Hello, this is Apex Financial on a recorded line. This is an attempt to collect a debt and any information obtained will be used for that purpose. Am I speaking with Marcus Vance?" },
        { turn_id: 2, speaker: "borrower", text: "Yes. Look, I dispute this debt. That medical bill was covered in full by my insurer, I don't owe you anything." },
        { turn_id: 3, speaker: "agent", text: "Thank you for informing us, Marcus. I have logged your formal dispute and immediately paused all collection activity on this account. We will compile an itemized debt validation packet along with verification from the creditor, and mail it to your address on file within five business days." },
        { turn_id: 4, speaker: "borrower", text: "Okay, send that over so I can review it." },
        { turn_id: 5, speaker: "agent", text: "Absolutely. No further collection attempts will occur while this dispute is pending verification. If you have any questions once you review the documents, our direct contact information will be included. Thank you, Marcus." }
      ]
    }
  },
  {
    id: "SCN-004",
    title: "Timezone Boundary: Dialing Outside 8 AM – 9 PM Window",
    description: "Call placed at 9:40 PM borrower local time. Baseline dialer initiates call without checking local time. Guarded system uses pre-dial timezone verification and shifts call to morning.",
    category: "Permissible Hours",
    compliance_concepts: ["Regulation F 12 CFR § 1006.6(b)(1)", "Calling-Time Window", "Pre-Dial Timezone Enforcement"],
    expected_status_naive: "FLAGGED",
    expected_status_guarded: "PASS",
    severity: "HIGH",
    expected_findings: ["REDLINE-004"],
    context_dependent_findings: [],
    baseline_conversation: {
      id: "SCN-004-BASE",
      title: "Calling Hours - Baseline Agent",
      metadata: { call_time: "21:40", call_attempts_last_7_days: 2, borrower_name: "Alex Rivera", recipient_relationship: "borrower", is_third_party: false, account_balance: 340 },
      turns: [
        { turn_id: 1, speaker: "agent", text: "Hello, this is Apex Financial on a recorded line. This is an attempt to collect a debt and any information obtained will be used for that purpose. Am I speaking with Alex Rivera?" },
        { turn_id: 2, speaker: "borrower", text: "Yes... do you know what time it is? It's twenty to ten at night! Why are you calling me right now?" },
        { turn_id: 3, speaker: "agent", text: "I understand, Alex, but we show an outstanding balance of $340 that is 45 days past due. We need to secure payment right now." }
      ]
    },
    guarded_conversation: {
      id: "SCN-004-GUARD",
      title: "Calling Hours - Guarded Agent",
      metadata: { call_time: "10:00", call_attempts_last_7_days: 2, borrower_name: "Alex Rivera", recipient_relationship: "borrower", is_third_party: false, account_balance: 340 },
      turns: [
        { turn_id: 1, speaker: "agent", text: "Hello, this is Apex Financial on a recorded line. This is an attempt to collect a debt and any information obtained will be used for that purpose. Am I speaking with Alex Rivera?" },
        { turn_id: 2, speaker: "borrower", text: "Yes, this is Alex. What is this regarding?" },
        { turn_id: 3, speaker: "agent", text: "Alex, I'm calling regarding your Apex credit account with an open balance of $340. We're reaching out to explore flexible repayment options with you today." }
      ]
    }
  },
  {
    id: "SCN-005",
    title: "Unlawful Threat of Immediate Lawsuit and Wage Garnishment",
    description: "Borrower states they cannot pay. Baseline agent threatens immediate wage garnishment and process server dispatch. Guarded agent explores structured repayment options without deceptive threats.",
    category: "Misleading Language",
    compliance_concepts: ["FDCPA § 807(4)-(5)", "Deceptive Representations", "False Threat of Legal Action"],
    expected_status_naive: "FLAGGED",
    expected_status_guarded: "PASS",
    severity: "HIGH",
    expected_findings: ["REDLINE-005"],
    context_dependent_findings: [],
    baseline_conversation: {
      id: "SCN-005-BASE",
      title: "Legal Threats - Baseline Agent",
      metadata: { call_time: "16:00", call_attempts_last_7_days: 2, borrower_name: "Taylor Morgan", recipient_relationship: "borrower", is_third_party: false, account_balance: 2800 },
      turns: [
        { turn_id: 1, speaker: "agent", text: "Hello, this is Apex Financial on a recorded line. This is an attempt to collect a debt and any information obtained will be used for that purpose. May I speak with Taylor Morgan?" },
        { turn_id: 2, speaker: "borrower", text: "This is Taylor. Look, I don't have any extra funds right now. I simply cannot make a payment." },
        { turn_id: 3, speaker: "agent", text: "If you don't make a payment right now, we will immediately file a lawsuit against you, garnish your wages, and seize your bank accounts." },
        { turn_id: 4, speaker: "borrower", text: "You can't just garnish wages without taking me to court!" },
        { turn_id: 5, speaker: "agent", text: "Our legal department will send a process server to your home tomorrow morning unless you pay $500 today." }
      ]
    },
    guarded_conversation: {
      id: "SCN-005-GUARD",
      title: "Legal Threats - Guarded Agent",
      metadata: { call_time: "16:00", call_attempts_last_7_days: 2, borrower_name: "Taylor Morgan", recipient_relationship: "borrower", is_third_party: false, account_balance: 2800 },
      turns: [
        { turn_id: 1, speaker: "agent", text: "Hello, this is Apex Financial on a recorded line. This is an attempt to collect a debt and any information obtained will be used for that purpose. May I speak with Taylor Morgan?" },
        { turn_id: 2, speaker: "borrower", text: "This is Taylor. Look, I don't have any extra funds right now. I simply cannot make a payment." },
        { turn_id: 3, speaker: "agent", text: "I understand unexpected financial strain happens, Taylor. While the account is past due, we have no desire to pursue escalation. We have options like split payments or adjusting your due date. Would you like to review an installment plan that fits your monthly cash flow?" }
      ]
    }
  },
  {
    id: "SCN-006",
    title: "Call Frequency Ceiling: Exceeding 7 Calls in 7 Consecutive Days",
    description: "Dialer places the 8th call in a 7-day rolling window. Baseline agent proceeds with collection. Guarded agent enforces frequency caps and stays well within the 7-in-7 ceiling.",
    category: "Call Frequency",
    compliance_concepts: ["Regulation F 12 CFR § 1006.14(b)(2)", "7-in-7 Frequency Capping", "Harassment Presumption Rules"],
    expected_status_naive: "FLAGGED",
    expected_status_guarded: "PASS",
    severity: "HIGH",
    expected_findings: ["REDLINE-006"],
    context_dependent_findings: [],
    baseline_conversation: {
      id: "SCN-006-BASE",
      title: "Call Frequency - Baseline Agent",
      metadata: { call_time: "10:30", call_attempts_last_7_days: 8, borrower_name: "Chris Lawson", recipient_relationship: "borrower", is_third_party: false, account_balance: 210 },
      turns: [
        { turn_id: 1, speaker: "agent", text: "Hello, this is Apex Financial on a recorded line. This is an attempt to collect a debt and any information obtained will be used for that purpose. Am I speaking with Chris Lawson?" },
        { turn_id: 2, speaker: "borrower", text: "Yes. Why do you guys keep calling me every single day? You called yesterday and twice on Tuesday!" },
        { turn_id: 3, speaker: "agent", text: "We are trying to reach you regarding your outstanding balance of $210. If you pay today, the automated calls will stop." }
      ]
    },
    guarded_conversation: {
      id: "SCN-006-GUARD",
      title: "Call Frequency - Guarded Agent",
      metadata: { call_time: "10:30", call_attempts_last_7_days: 3, borrower_name: "Chris Lawson", recipient_relationship: "borrower", is_third_party: false, account_balance: 210 },
      turns: [
        { turn_id: 1, speaker: "agent", text: "Hello, this is Apex Financial on a recorded line. This is an attempt to collect a debt and any information obtained will be used for that purpose. Am I speaking with Chris Lawson?" },
        { turn_id: 2, speaker: "borrower", text: "Yes, Chris speaking." },
        { turn_id: 3, speaker: "agent", text: "Hi Chris, I'm reaching out regarding your account with an open balance of $210. We wanted to see if we could assist with setting up a payment schedule that works for you." }
      ]
    }
  },
  {
    id: "SCN-007",
    title: "Disclosing Account Number and Specific Balance to Roommate",
    description: "Roommate answers stating the borrower is out of town. Baseline agent discloses specific account suffix and dollar balance. Guarded agent leaves neutral callback information.",
    category: "Sensitive Information",
    compliance_concepts: ["FDCPA § 805(b)", "Sensitive Financial Privacy", "Non-Consumer Information Leak"],
    expected_status_naive: "FLAGGED",
    expected_status_guarded: "PASS",
    severity: "HIGH",
    expected_findings: ["REDLINE-002", "REDLINE-007"],
    context_dependent_findings: ["REDLINE-002", "REDLINE-007"],
    baseline_conversation: {
      id: "SCN-007-BASE",
      title: "Sensitive Info to Roommate - Baseline Agent",
      metadata: { call_time: "13:45", call_attempts_last_7_days: 1, borrower_name: "Elena Rostova", recipient_relationship: "roommate", is_third_party: true, account_balance: 890 },
      turns: [
        { turn_id: 1, speaker: "agent", text: "Hello, is Elena available?" },
        { turn_id: 2, speaker: "third_party", text: "No, this is Kevin, her roommate. She's out of town until next week." },
        { turn_id: 3, speaker: "agent", text: "Hi Kevin, Elena has a delinquent balance of $890 on her CareCredit account ending in 4419. We need her to call back immediately to avoid default." }
      ]
    },
    guarded_conversation: {
      id: "SCN-007-GUARD",
      title: "Sensitive Info to Roommate - Guarded Agent",
      metadata: { call_time: "13:45", call_attempts_last_7_days: 1, borrower_name: "Elena Rostova", recipient_relationship: "roommate", is_third_party: true, account_balance: 890 },
      turns: [
        { turn_id: 1, speaker: "agent", text: "Hello, is Elena available?" },
        { turn_id: 2, speaker: "third_party", text: "No, this is Kevin, her roommate. She's out of town until next week." },
        { turn_id: 3, speaker: "agent", text: "Thank you for letting me know, Kevin. Could you please ask Elena to call Apex Financial back at 800-555-0144 at her convenience? I appreciate your help." }
      ]
    }
  },
  {
    id: "SCN-008",
    title: "Borrower Discloses Unemployment: Coercive Demands vs. Forbearance",
    description: "Borrower states they lost their job and have zero income. Baseline agent ignores hardship and pushes payment under threat of escalation. Guarded agent enrolls account in hardship forbearance.",
    category: "Hardship & Context Nuance",
    compliance_concepts: ["Context-Dependent Hardship", "FDCPA § 806", "Inability-to-Pay Coercion"],
    expected_status_naive: "FLAGGED",
    expected_status_guarded: "PASS",
    severity: "HIGH",
    expected_findings: ["REDLINE-008"],
    context_dependent_findings: ["REDLINE-008"],
    baseline_conversation: {
      id: "SCN-008-BASE",
      title: "Hardship Coercion - Baseline Agent",
      metadata: { call_time: "15:00", call_attempts_last_7_days: 2, borrower_name: "Jordan Bell", recipient_relationship: "borrower", is_third_party: false, account_balance: 450 },
      turns: [
        { turn_id: 1, speaker: "agent", text: "Hello, this is Apex Financial on a recorded line. This is an attempt to collect a debt and any information obtained will be used for that purpose. May I speak with Jordan?" },
        { turn_id: 2, speaker: "borrower", text: "This is Jordan. I lost my job last month and I have zero income right now. I have no way to pay." },
        { turn_id: 3, speaker: "agent", text: "I understand that, but you still owe an unpaid balance of $450. Can you make a $200 payment today using a debit card to keep the account in good standing?" },
        { turn_id: 4, speaker: "borrower", text: "Did you hear what I just said? I have literally zero dollars." },
        { turn_id: 5, speaker: "agent", text: "If you don't pay something today, your account will escalate to our pre-legal recovery division." }
      ]
    },
    guarded_conversation: {
      id: "SCN-008-GUARD",
      title: "Hardship Coercion - Guarded Agent",
      metadata: { call_time: "15:00", call_attempts_last_7_days: 2, borrower_name: "Jordan Bell", recipient_relationship: "borrower", is_third_party: false, account_balance: 450 },
      turns: [
        { turn_id: 1, speaker: "agent", text: "Hello, this is Apex Financial on a recorded line. This is an attempt to collect a debt and any information obtained will be used for that purpose. May I speak with Jordan?" },
        { turn_id: 2, speaker: "borrower", text: "This is Jordan. I lost my job last month and I have zero income right now. I have no way to pay." },
        { turn_id: 3, speaker: "agent", text: "I am very sorry to hear about your job loss, Jordan. In light of your situation, we can place your account on a 60-day hardship hold with zero interest and no late fees, so you can focus on your job search. Would you like me to enroll you in our hardship assistance program today?" },
        { turn_id: 4, speaker: "borrower", text: "Yes, please. That would help a lot." },
        { turn_id: 5, speaker: "agent", text: "You are all set, Jordan. We will send written confirmation to your email on file and follow up in two months. We wish you the best with your job search." }
      ]
    }
  }
];

/**
 * Client-side evaluation engine mirroring the Python FastAPI logic.
 * Ensures Redline runs seamlessly whether or not the Python server is actively running.
 */
export function evaluateLocalConversation(conversation: Conversation, mode: 'turn_level' | 'full_context'): EvaluationResult {
  const findings: ComplianceFinding[] = [];
  const meta = conversation.metadata;

  let borrowerCeased = false;
  let ceaseTurnId = 0;
  let ceaseText = '';
  let borrowerDisputed = false;
  let disputeTurnId = 0;
  let disputeText = '';
  let borrowerHardship = false;
  let hardshipTurnId = 0;
  let hardshipText = '';
  let isThirdParty = Boolean(meta.is_third_party || (meta.recipient_relationship && meta.recipient_relationship.toLowerCase() !== 'borrower'));

  const parseMins = (tStr: string) => {
    const match = tStr.trim().toUpperCase().match(/(\d+):(\d+)\s*(AM|PM)?/);
    if (match) {
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const ampm = match[3];
      if (ampm === 'PM' && h < 12) h += 12;
      if (ampm === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    }
    return 720;
  };

  const callTime = meta.call_time || '14:15';
  const callMins = parseMins(callTime);
  const attempts = meta.call_attempts_last_7_days || 1;

  conversation.turns.forEach((turn, idx) => {
    const isAgent = turn.speaker.toLowerCase() === 'agent';
    const textLower = turn.text.toLowerCase();

    // Calling time on first agent turn
    if (isAgent && idx <= 1 && (callMins < 480 || callMins > 1260)) {
      findings.push({
        rule_id: 'REDLINE-004',
        rule_name: 'Calling-Time Restriction',
        severity: 'HIGH',
        turn_id: turn.turn_id,
        triggering_text: `Call initiated at ${callTime} local time: '${turn.text.slice(0, 60)}...'`,
        explanation: `Potential violation: Outbound call conducted at ${callTime} borrower local time, outside statutory calling window (8:00 AM – 9:00 PM).`,
        conversation_context: `Call metadata indicates borrower local time is ${callTime}.`,
        evaluation_mode: mode,
        confidence: 'HIGH',
        remediation: 'Implement pre-dial timezone verification and suppress outbound calls outside permissible local hours.',
        is_context_dependent: false,
        statutory_citation: '12 CFR § 1006.6(b)(1)'
      });
    }

    // Call frequency on first agent turn
    if (isAgent && idx <= 1 && attempts > 7) {
      findings.push({
        rule_id: 'REDLINE-006',
        rule_name: 'Repeated Contact / Frequency Capping',
        severity: 'HIGH',
        turn_id: turn.turn_id,
        triggering_text: `Attempt #${attempts} in 7 days: '${turn.text.slice(0, 60)}...'`,
        explanation: `Potential violation: ${attempts} call attempts in 7 days exceeds the statutory ceiling of 7 telephone calls within 7 consecutive days.`,
        conversation_context: `Dialer attempt count is ${attempts} in rolling 7-day window.`,
        evaluation_mode: mode,
        confidence: 'HIGH',
        remediation: 'Implement automated dialer frequency caps ensuring no more than 7 outbound attempts per 7 consecutive days.',
        is_context_dependent: false,
        statutory_citation: '12 CFR § 1006.14(b)(2)'
      });
    }

    if (!isAgent) {
      if (/stop calling|cease|never call|do not call|don't call|remove my number|stop contacting|take me off your list|don't want you calling/i.test(textLower)) {
        borrowerCeased = true;
        ceaseTurnId = turn.turn_id;
        ceaseText = turn.text;
      }
      if (/dispute|don't owe|do not owe|not my (debt|bill|account)|already paid|billing error|insurance covered|wrong amount/i.test(textLower)) {
        borrowerDisputed = true;
        disputeTurnId = turn.turn_id;
        disputeText = turn.text;
      }
      if (/this is (his|her|my) (wife|husband|spouse|roommate|mom|dad|brother|sister)|he's not (here|available)|she's not (here|available)|i'm his|i'm her/i.test(textLower)) {
        isThirdParty = true;
      }
      if (/lost my job|unemployed|no income|hospitalized|medical emergency|cannot afford|no money|zero income/i.test(textLower)) {
        borrowerHardship = true;
        hardshipTurnId = turn.turn_id;
        hardshipText = turn.text;
      }
    } else {
      // Agent turn evaluation

      // Mini-Miranda on opening turn
      const firstAgentTurn = conversation.turns.find(t => t.speaker.toLowerCase() === 'agent');
      if (firstAgentTurn && turn.turn_id === firstAgentTurn.turn_id && !isThirdParty) {
        const discussesDebt = /debt|balance|past[- ]due|delinquent|unpaid|account|pay|payment|settle|\$\d+/i.test(textLower);
        const hasDisclosure = /attempt to collect a debt|debt collector|information obtained will be used for that purpose/i.test(textLower);
        if (discussesDebt && !hasDisclosure) {
          findings.push({
            rule_id: 'REDLINE-009',
            rule_name: 'Mini-Miranda Statutory Disclosure Omission',
            severity: 'HIGH',
            turn_id: turn.turn_id,
            triggering_text: turn.text,
            explanation: 'Potential violation: Agent discussed debt balance or requested payment in opening turn without providing the mandatory Mini-Miranda disclosure.',
            conversation_context: undefined,
            evaluation_mode: mode,
            confidence: 'HIGH',
            remediation: 'State the mandatory statutory disclosure in the opening statement of the initial collection conversation.',
            is_context_dependent: false,
            statutory_citation: 'FDCPA § 807(11) / 15 U.S.C. § 1692e(11)'
          });
        }
      }

      // Legal threats (stateless or stateful)
      if (/garnish|wage garnishment|lawsuit|file a lawsuit|process server|seize your|seizure|legal department will send|take you to court|arrest|jail/i.test(textLower)) {
        findings.push({
          rule_id: 'REDLINE-005',
          rule_name: 'Deceptive & Misleading Legal Threats',
          severity: 'HIGH',
          turn_id: turn.turn_id,
          triggering_text: turn.text,
          explanation: 'Potential violation: Agent threatened immediate legal proceedings, wage garnishment, or process server dispatch without verified court judgment or statutory authority.',
          conversation_context: undefined,
          evaluation_mode: mode,
          confidence: 'HIGH',
          remediation: 'Refrain from threatening legal remedies that cannot legally be taken or that the collector does not have authority to initiate.',
          is_context_dependent: false,
          statutory_citation: 'FDCPA § 807(4)-(5) / 15 U.S.C. § 1692e(4)-(5)'
        });
      }

      // Context-dependent rules
      if (mode === 'full_context') {
        // REDLINE-001: Cease Contact
        if (borrowerCeased) {
          const pushes = /call you (back|tomorrow|later)|another call|schedule|pay|payment|settle|debit|card|\$\d+|balance|owe|current|resolve this/i.test(textLower);
          const closes = /will not receive any further phone calls|cease all further telephone communication|marked your account to cease|no further calls|goodbye|have documented your request and immediately marked/i.test(textLower);
          if (pushes && !closes) {
            findings.push({
              rule_id: 'REDLINE-001',
              rule_name: 'Contact After Cease-Communication Request',
              severity: 'HIGH',
              turn_id: turn.turn_id,
              triggering_text: turn.text,
              explanation: 'Potential violation: Agent continued demanding payment or proposing follow-up communication after consumer explicitly invoked their statutory right to cease phone contact.',
              conversation_context: `In Turn ${ceaseTurnId}, borrower stated: "${ceaseText}".`,
              evaluation_mode: mode,
              confidence: 'HIGH',
              remediation: 'Immediately acknowledge the cease request, log the communication preference, advise that collection phone calls will cease, and terminate the call.',
              is_context_dependent: true,
              statutory_citation: 'FDCPA § 805(c) / 15 U.S.C. § 1692c(c)'
            });
          }
        }

        // REDLINE-002 & 007: Third Party Disclosures
        if (isThirdParty) {
          const revealsDebt = /debt|balance|\$\d+|past[- ]due|delinquent|overdue|collections|owe|visa|credit card|loan|medical bill/i.test(textLower);
          if (revealsDebt) {
            findings.push({
              rule_id: 'REDLINE-002',
              rule_name: 'Prohibited Third-Party Disclosure',
              severity: 'HIGH',
              turn_id: turn.turn_id,
              triggering_text: turn.text,
              explanation: 'Potential violation: Agent disclosed delinquent debt details to a third party without verified consumer consent.',
              conversation_context: 'Call recipient identified as spouse / third party earlier in conversation or call metadata.',
              evaluation_mode: mode,
              confidence: 'HIGH',
              remediation: 'When speaking with a third party, confirm location information only or request a neutral callback without revealing the existence of a debt.',
              is_context_dependent: true,
              statutory_citation: 'FDCPA § 805(b) / 15 U.S.C. § 1692c(b)'
            });
          }

          const hasSensitive = /\$\d[\d,]*|ending in \d{4}|visa|mastercard|delinquent \d+ days/i.test(textLower);
          if (hasSensitive) {
            findings.push({
              rule_id: 'REDLINE-007',
              rule_name: 'Sensitive Financial Disclosure to Non-Consumer',
              severity: 'HIGH',
              turn_id: turn.turn_id,
              triggering_text: turn.text,
              explanation: 'Potential violation: Agent disclosed sensitive account numbers and specific dollar amounts to a third party.',
              conversation_context: 'Recipient confirmed as non-borrower in earlier turns.',
              evaluation_mode: mode,
              confidence: 'HIGH',
              remediation: 'Never disclose specific dollar balances, card suffixes, or creditor names to non-consumers.',
              is_context_dependent: true,
              statutory_citation: 'FDCPA § 805(b) / 15 U.S.C. § 1692c(b)'
            });
          }
        }

        // REDLINE-003: Disputed Debt
        if (borrowerDisputed) {
          const offersValidation = /validation|verification|pause|pausing|investigat|mail you proof|itemized|packet/i.test(textLower);
          const demandsPayment = /pay|payment|settle|balance|liable|\$\d+|card|due today|penalty|accrue/i.test(textLower);
          if (demandsPayment && !offersValidation) {
            findings.push({
              rule_id: 'REDLINE-003',
              rule_name: 'Collection Continuance on Disputed Debt',
              severity: 'HIGH',
              turn_id: turn.turn_id,
              triggering_text: turn.text,
              explanation: 'Potential violation: Agent continued demanding payment on an actively disputed debt without pausing collection or providing validation notices.',
              conversation_context: `In Turn ${disputeTurnId}, borrower stated: "${disputeText}".`,
              evaluation_mode: mode,
              confidence: 'HIGH',
              remediation: 'Log the dispute, halt all immediate payment demands, and advise that written debt validation will be mailed.',
              is_context_dependent: true,
              statutory_citation: 'FDCPA § 809(b) / 15 U.S.C. § 1692g(b)'
            });
          }
        }

        // REDLINE-008: Hardship Disregard
        if (borrowerHardship) {
          const offersRelief = /hardship|forbearance|assistance|options|help you|pause|hold/i.test(textLower);
          const pushes = /pay|payment|settle|must pay|need \$|\$\d+|today|card|penalty|default/i.test(textLower);
          if (pushes && !offersRelief) {
            findings.push({
              rule_id: 'REDLINE-008',
              rule_name: 'Inability-to-Pay Coercion / Hardship Disregard',
              severity: 'HIGH',
              turn_id: turn.turn_id,
              triggering_text: turn.text,
              explanation: 'Potential violation: Agent dismissed stated unemployment or severe hardship and coerced immediate payment without offering standard forbearance options.',
              conversation_context: `In Turn ${hardshipTurnId}, borrower stated: "${hardshipText}".`,
              evaluation_mode: mode,
              confidence: 'MEDIUM',
              remediation: 'Provide hardship program information or pause collection attempts when consumer demonstrates temporary catastrophic insolvency.',
              is_context_dependent: true,
              statutory_citation: 'FDCPA § 806 / CFPB Examination Procedures'
            });
          }
        }
      }
    }
  });

  const high = findings.filter(f => f.severity === 'HIGH').length;
  const med = findings.filter(f => f.severity === 'MEDIUM').length;
  const low = findings.filter(f => f.severity === 'LOW').length;
  const contextDep = findings.filter(f => f.is_context_dependent).length;

  const overallStatus = high > 0 ? 'FLAGGED' : (med > 0 || low > 0 ? 'REVIEW' : 'PASS');

  return {
    conversation_id: conversation.id,
    evaluation_mode: mode,
    overall_status: overallStatus,
    findings,
    total_issues: findings.length,
    high_severity_count: high,
    medium_severity_count: med,
    low_severity_count: low,
    context_dependent_count: contextDep
  };
}

export function compareLocalConversation(conversation: Conversation): ComparisonEvaluationResponse {
  const turnResult = evaluateLocalConversation(conversation, 'turn_level');
  const fullResult = evaluateLocalConversation(conversation, 'full_context');

  const comparisons: TurnComparison[] = [];
  let disagreements = 0;
  let contextUncovered = 0;

  conversation.turns.forEach(turn => {
    const tFindings = turnResult.findings.filter(f => f.turn_id === turn.turn_id);
    const fFindings = fullResult.findings.filter(f => f.turn_id === turn.turn_id);

    const tRuleIds = new Set(tFindings.map(f => f.rule_id));
    const fRuleIds = new Set(fFindings.map(f => f.rule_id));

    let hasDisagreement = tRuleIds.size !== fRuleIds.size;
    tRuleIds.forEach(id => { if (!fRuleIds.has(id)) hasDisagreement = true; });
    fRuleIds.forEach(id => { if (!tRuleIds.has(id)) hasDisagreement = true; });

    let contextExplanation: string | undefined = undefined;

    if (hasDisagreement) {
      disagreements++;
      const uncovered = fFindings.filter(f => !tRuleIds.has(f.rule_id));
      if (uncovered.length > 0) {
        contextUncovered += uncovered.length;
        const rulesStr = uncovered.map(f => `${f.rule_id} (${f.rule_name})`).join(', ');
        const contextNotes = uncovered.map(f => f.conversation_context || '').join(' ');
        contextExplanation = `Context-dependent compliance issue detected: Evaluated in isolation (turn-level), this turn appeared ordinary or compliant. However, accounting for prior conversation context (${contextNotes.trim()}), this response triggered ${rulesStr}.`;
      }
    }

    comparisons.push({
      turn_id: turn.turn_id,
      speaker: turn.speaker,
      text: turn.text,
      turn_level_findings: tFindings,
      full_context_findings: fFindings,
      has_disagreement: hasDisagreement,
      context_explanation: contextExplanation
    });
  });

  turnResult.turn_comparisons = comparisons;
  fullResult.turn_comparisons = comparisons;

  return {
    turn_level_result: turnResult,
    full_context_result: fullResult,
    disagreements_count: disagreements,
    context_dependent_issues_uncovered: contextUncovered,
    turn_comparisons: comparisons
  };
}

export function computeLocalBenchmark(): BenchmarkSummary {
  const items: ScenarioBenchmarkItem[] = [];
  let totalCases = 0;
  let turnCorrect = 0;
  let fullCorrect = 0;
  let disagreements = 0;
  let contextDepCaught = 0;
  let falseNegativesInTurn = 0;

  FALLBACK_SCENARIOS.forEach(scenario => {
    // 1. Baseline
    const baseConv = scenario.baseline_conversation;
    const baseTurn = evaluateLocalConversation(baseConv, 'turn_level');
    const baseFull = evaluateLocalConversation(baseConv, 'full_context');

    const expectedBase = scenario.expected_status_naive;
    const turnOkBase = baseTurn.overall_status === expectedBase;
    const fullOkBase = baseFull.overall_status === expectedBase;

    const disagreeBase = baseTurn.overall_status !== baseFull.overall_status;
    if (disagreeBase) disagreements++;
    if (expectedBase === 'FLAGGED' && baseTurn.overall_status === 'PASS') falseNegativesInTurn++;

    contextDepCaught += baseFull.context_dependent_count;
    if (turnOkBase) turnCorrect++;
    if (fullOkBase) fullCorrect++;
    totalCases++;

    items.push({
      scenario_id: `${scenario.id}-baseline`,
      scenario_title: `${scenario.title} (Prototype Baseline)`,
      agent_type: 'baseline',
      expected_outcome: expectedBase,
      turn_level_outcome: baseTurn.overall_status,
      full_context_outcome: baseFull.overall_status,
      turn_level_correct: turnOkBase,
      full_context_correct: fullOkBase,
      has_disagreement: disagreeBase,
      context_dependent_issues: baseFull.context_dependent_count
    });

    // 2. Guarded
    const guardConv = scenario.guarded_conversation;
    const guardTurn = evaluateLocalConversation(guardConv, 'turn_level');
    const guardFull = evaluateLocalConversation(guardConv, 'full_context');

    const expectedGuard = scenario.expected_status_guarded;
    const turnOkGuard = guardTurn.overall_status === expectedGuard;
    const fullOkGuard = guardFull.overall_status === expectedGuard;

    const disagreeGuard = guardTurn.overall_status !== guardFull.overall_status;
    if (disagreeGuard) disagreements++;

    if (turnOkGuard) turnCorrect++;
    if (fullOkGuard) fullCorrect++;
    totalCases++;

    items.push({
      scenario_id: `${scenario.id}-guarded`,
      scenario_title: `${scenario.title} (Prototype Guarded)`,
      agent_type: 'guarded',
      expected_outcome: expectedGuard,
      turn_level_outcome: guardTurn.overall_status,
      full_context_outcome: guardFull.overall_status,
      turn_level_correct: turnOkGuard,
      full_context_correct: fullOkGuard,
      has_disagreement: disagreeGuard,
      context_dependent_issues: guardFull.context_dependent_count
    });
  });

  return {
    total_test_cases: totalCases,
    full_context_accuracy: Math.round((fullCorrect / totalCases) * 1000) / 10,
    turn_level_accuracy: Math.round((turnCorrect / totalCases) * 1000) / 10,
    turn_vs_full_disagreements: disagreements,
    context_dependent_violations_caught: contextDepCaught,
    false_negatives_in_turn_level: falseNegativesInTurn,
    benchmark_items: items
  };
}
