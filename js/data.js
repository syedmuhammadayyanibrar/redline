const D = "Hi Sam, this is Alex with Northline Recovery. This is an attempt to collect a debt, and information obtained will be used for that purpose.";

export const scenarios = [
  {
    name: "Late-night call",
    desc: "Borrower is in Chicago. Local time is 9:40 PM.",
    meta: { time: "21:40", calls7: 2, third: false },
    naive: [
      ["ag", "Hi Dana, this is Alex about your account balance of $1,420. Can you pay today?"],
      ["bo", "It's almost ten at night."],
      ["ag", "I understand. A $300 payment now would stop late fees."]
    ],
    guard: [
      ["sys", "Call blocked: 9:40 PM in the borrower's local time. Rescheduled for 9:00 AM."]
    ]
  },
  {
    name: "Stop calling me",
    desc: "Borrower asks the agent to end contact.",
    meta: { time: "10:15", calls7: 1, third: false },
    naive: [
      ["ag", "Hello, this is Alex from Northline Recovery. This is an attempt to collect a debt, and information obtained will be used for that purpose. Is this Jordan?"],
      ["bo", "Yes. Please stop calling me."],
      ["ag", "I hear you, but a payment plan of $85 a month could clear your balance. Can we set that up?"],
      ["bo", "I said stop."],
      ["ag", "Even a $40 payment today would help avoid further action."]
    ],
    guard: [
      ["ag", "Hello, this is Alex from Northline Recovery. This is an attempt to collect a debt, and information obtained will be used for that purpose. Is this Jordan?"],
      ["bo", "Yes. Please stop calling me."],
      ["ag", "Understood. I've recorded your request and we will not contact you again by phone. Goodbye."]
    ]
  },
  {
    name: "Spouse answers",
    desc: "The borrower isn't home. His wife picks up.",
    meta: { time: "14:05", calls7: 0, third: true },
    naive: [
      ["ag", "Hi, this is Alex with Northline Recovery. I need to reach Jordan about an overdue balance of $2,340."],
      ["bo", "This is his wife. What is this about?"],
      ["ag", "It's a past-due credit card. Jordan owes $2,340 and it's in collections."]
    ],
    guard: [
      ["ag", "Hi, this is Alex. Could I speak with Jordan Reyes, please?"],
      ["bo", "He's not here. What's this about?"],
      ["ag", "I can't share details. Please ask him to call 555-0142 and I'll try again later."]
    ]
  },
  {
    name: "That's not my debt",
    desc: "Borrower says the account isn't theirs.",
    meta: { time: "11:30", calls7: 0, third: false },
    naive: [
      ["ag", D + " You have a $3,100 balance."],
      ["bo", "That's not my debt. I never opened that account."],
      ["ag", "Our records show it's yours. If you pay $500 today I can pause the interest."],
      ["bo", "I'm disputing it."],
      ["ag", "Disputing won't change what you owe. Can I take a card number?"]
    ],
    guard: [
      ["ag", D + " You have a $3,100 balance."],
      ["bo", "That's not my debt. I never opened that account."],
      ["ag", "Thanks for telling me. I'm pausing collection and will mail a written validation notice naming the original creditor so you can dispute it. Is your address still 12 Oak Lane?"]
    ]
  },
  {
    name: "Job loss",
    desc: "Borrower says they can't pay right now.",
    meta: { time: "16:20", calls7: 3, third: false },
    naive: [
      ["ag", "Hi Priya, you're behind $1,860 on your loan. When are you paying?"],
      ["bo", "I lost my job last month. I can't pay right now."],
      ["ag", "If you don't pay this week we'll garnish your wages and sue you."]
    ],
    guard: [
      ["ag", "Hi Priya, this is Alex. This is an attempt to collect a debt, and information obtained will be used for that purpose. I see your loan is past due."],
      ["bo", "I lost my job last month. I can't pay right now."],
      ["ag", "I'm sorry to hear that. We can pause payments for 60 days or set up a smaller plan once you're working again. Which would you prefer?"]
    ]
  },
  {
    name: "Eighth call this week",
    desc: "Seven attempts already made in seven days.",
    meta: { time: "10:00", calls7: 7, third: false },
    naive: [
      ["ag", D + " Can we settle your $980 balance today?"],
      ["bo", "You've called me every day this week."],
      ["ag", "Persistence is how we get things resolved. Let's settle this now."]
    ],
    guard: [
      ["sys", "Call blocked: 7 attempts already made in the last 7 days. Next attempt allowed when the weekly window resets."]
    ]
  }
];
