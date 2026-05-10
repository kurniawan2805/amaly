1. The Concept: "Amaly Together"
The goal is to move from a solo app to a Family Account where you are paired but maintain separate logs.

Key Interaction Features:
The "Nudge" (Motivation): When you finish your Quran goal, your wife gets a notification: "Alhamdulillah, Adi just finished his 5 pages!"

The "Support Signal" (Cycle Awareness): Instead of showing raw medical data, the husband's dashboard shows a subtle status like: "Mama is in a Rest Phase—extra support needed today."

Shared Qadha Tracker: You can both see the family's total fasting debt to plan your Monday/Thursday fasts together.

2. Technical Architecture (Supabase Logic)
Since you are using Supabase, implementing "Syncing" is very efficient. You don't need a complex backend—just a few more tables and Row Level Security (RLS).

Step 1: The "Partnerships" Table
You need a way to link your two UUIDs together.

SQL
create table partnerships (
  id uuid primary key default uuid_generate_v4(),
  husband_id uuid references auth.users(id),
  wife_id uuid references auth.users(id),
  created_at timestamp with time zone default now()
);
Step 2: Shared RLS Rules
Update your Supabase rules so you can see each other's data.

Rule: "Allow user to SELECT from quran_logs if the user_id is my partner's ID."

3. PRD: Amaly Family Sync
1. Objective
To foster mutual spiritual growth and emotional support by sharing progress and health phases between husband and wife.

2. Features
2.1 Partner Pairing
Invitation System: Generate a unique 6-digit "Partner Code" or QR code.

Pairing: Once the code is entered, the two accounts are linked in the partnerships table.

2.2 The Motivation Dashboard
Partner's Progress: A small widget on the home screen showing:

Partner's current page in Quran.

Partner's daily goal status (e.g., "3/5 pages done").

High-Five/Dua: A button to send a quick "MashaAllah" or "Barakallahu feek" notification.

2.3 The "Support Signal" (Privacy-First)
Wife's Perspective: A setting to "Share cycle phase with Husband."

Husband's Perspective: A status indicator based on the Cycle Tracker:

Follicular/Ovulation: "Energy is high! Great time for a family outing."

Menstrual/Luteal: "Rest Phase. Consider helping more with the kids/dinner."

2.4 Shared Fasting Calendar
A view showing both partners' Qadha debt.

Ability to "Invite to Fast" for upcoming Sunnah days (Monday/Thursday).

4. Prompt for Codex / AI Assistant
"Implement a 'Family Sync' feature for Amaly using Supabase.

Tasks:

Pairing Logic: Create a system to link two users using a unique invite code stored in a partnerships table.

Shared Permissions: Update the Supabase RLS policies to allow partners to read each other's Quran and Fasting progress.

Partner Widget: Build a React component for the dashboard that displays the partner's daily progress and a 'Send Nudge' button.

Cycle Sharing: If the wife enables sharing, display a 'Support Status' on the husband's dashboard based on her current cycle phase (e.g., 'Resting' or 'Active').

Real-time: Use Supabase Realtime to show a toast notification whenever a partner completes a goal.

UI: Keep the minimalist Olive aesthetic. Ensure the husband's and wife's views are distinct but cohesive."