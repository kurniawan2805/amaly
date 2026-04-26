PRD: Amaly Menstrual Cycle Log
1. Project Objective
To provide a private, minimalist cycle tracking module that empowers the user to manage physical health while automating religious logistics (Qadha fasting) through a smart, permission-based bridge.

2. Functional Requirements
2.1 Cycle Tracking & Logging
Period Actions: Simplified "Period Started" and "Period Ended" toggle buttons.

Symptom Logging: Quick-tap minimalist icons for:

Cramps (Low/Medium/High)

Energy Levels

Mood

History: A chronological list of past cycles showing start date, end date, and total duration.

2.2 Cycle Phase Prediction
The Cycle Ring: A central circular UI representing the full cycle (defaulting to a 28-day average if history is unavailable).

Four-Phase Mapping: Visual segments for:

Menstrual Phase (Days 1–5)

Follicular Phase (Days 6–13)

Ovulation (Day 14)

Luteal Phase (Days 15–28)

Next Period: Display estimated start date for the upcoming cycle.

2.3 The "Religious Bridge" (Smart Qadha)
Overlap Detection: The system monitors if startDate and endDate overlap with the Hijri month of Ramadan (using the globalHijriOffset).

Permission-Based Update: * Trigger: Upon logging a "Period Ended" event that occurred during Ramadan.

Interaction: Display a confirmation modal: "I noticed your cycle ended during Ramadan. Should I add [X] days to your Remaining Qadha?"

Action: If "Yes" is selected, automatically increment the qadhaDebt in the Fasting Module.

2.4 Privacy & Data Export
Privacy Mode: A toggle to "Hide Health Data" on the main dashboard, requiring a tap to reveal.

Second Brain Export: A function to generate a Markdown summary of the month's cycle and symptoms for export into Obsidian.

3. UI/UX Design Principles
Aesthetic: Follow the Amaly Olive (#556B2F) and Cream palette. Use soft terracotta or muted rose (#CD5C5C) for cycle-specific indicators to provide visual distinction.

Visual Language: Use the "Cycle Ring" as the primary anchor to show the passage of time.

Tone: Clinical, grounded, and supportive. Avoid overly clinical or "clinical-pink" stereotypes.

4. Technical Logic
4.1 Phase Calculation (Pseudo-code)
JavaScript
const calculatePhase = (dayInCycle, cycleLength = 28) => {
  if (dayInCycle <= 5) return 'Menstrual';
  if (dayInCycle <= 13) return 'Follicular';
  if (dayInCycle === 14) return 'Ovulation';
  return 'Luteal';
}
4.2 Ramadan Overlap Check
JavaScript
const checkRamadanOverlap = (start, end, hijriOffset) => {
  const ramadanDates = getRamadanRange(hijriOffset);
  const overlapDays = calculateIntersection(start, end, ramadanDates);
  return overlapDays > 0 ? overlapDays : 0;
}
5. Technical Data Schema
JSON
{
  "cycleSettings": {
    "avgCycleLength": 28,
    "privacyEnabled": true
  },
  "cycleLogs": [
    {
      "id": "uuid",
      "startDate": "2026-03-10",
      "endDate": "2026-03-16",
      "symptoms": ["cramps-mid", "energy-low"],
      "qadhaUpdateStatus": "added | ignored | pending"
    }
  ]
}