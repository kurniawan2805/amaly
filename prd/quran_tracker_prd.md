# PRD: Amaly Quran Tracker (Consistency & Khatm)

## 1. Objective
To create a low-friction, highly motivating Quran tracking feature within the **Amaly** web app. The primary goal is to encourage daily reading consistency (even 1–2 pages) and provide clear visibility into long-term Khatm progress for the user and their family.

## 2. User Stories
* **Quick Logging:** As a busy user, I want to log my daily reading with a single tap (e.g., +1, +2 pages) so I don't feel like tracking is a chore.
* **Contextual Feedback:** As a reader, I want to see which Surah and Ayah I am currently on after logging my pages.
* **Goal Tracking:** As a goal-oriented person, I want to see how close I am to finishing my current Khatm and my predicted finish date based on my current pace.
* **Historical Records:** As a reflective user, I want to see a history of my previous Khatms (dates and duration) to stay motivated.

---

## 3. Functional Requirements

### 3.1 Core Logging Engine
* **Input Methods:**
    * **Quick-Add Buttons:** One-tap increments for `+1`, `+2`, and `+5` pages.
    * **"Read Until" Input:** A numeric field for manual entry of a specific page number (Range: 1–604).
* **Logic:**
    * Maintain a `last_page_read` state.
    * `new_page = last_page_read + increment`.
    * Prevent entries beyond page 604 unless starting a new Khatm.

### 3.2 Metadata Integration (`quran-meta`)
* **Library:** Use [quran-meta](https://github.com/quran-center/quran-meta).
* **Data Mapping:** Convert the `current_page` integer into:
    * **Surah Name:** (e.g., "Al-Baqarah").
    * **Ayah Context:** The starting Ayah on that specific page.
    * **Juz Number:** To track progress through the 30 parts.
* **UI Response:** Display a success message: *"MashaAllah! You've reached Surah [Name], Ayah [X]."*

### 3.3 Khatm Management & Analytics
* **Active Session:** Only one "Active" Khatm session allowed at a time.
* **Predictive Finish:** * Formula: `Remaining Pages / Average Pages per Day (Last 7 Days)`.
    * Output: Projected completion date in **Umm al-Qura** format.
* **Completion Logic:** Upon reaching page 604, trigger a "Khatm Ceremony" UI state and move the record to the history table.

---

## 4. Technical Specifications

### 4.1 Data Schema
```json
// Khatm Session Table
{
  "id": "uuid",
  "user_id": "uuid",
  "start_date": "ISO-8601",
  "end_date": "ISO-8601 | null",
  "status": "active | completed",
  "initial_target_days": 90 
}

// Daily Progress Log Table
{
  "id": "uuid",
  "khatm_id": "uuid",
  "timestamp": "ISO-86