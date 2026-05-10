# PRD: Amaly Quran Tracker v2 (Consistency & Motivation)

## 1. Objective
To build a high-motivation, low-friction Quran tracking module for the **Amaly** web app. The focus is on encouraging daily reading habits for a spouse through visual progress, flexible goals, and spiritual positive reinforcement.

## 2. Core UI Components

### 2.1 Dashboard & Quick Log Card
* **Header:** Displays current location using `quran-meta` (Surah Name, Ayah Range, Page, and Juz).
* **Quick Action Row:** Buttons for `+1`, `+2`, and `+5` pages to log progress instantly.
* **Manual Update:** A text-link or subtle input: *"I've reached page [Number]"* for bulk updates.
* **Streak Badge:** A "Consistency Heart" or "Flame" icon at the top right showing the current daily streak (e.g., "🔥 12 Day Streak").

### 2.2 Progress & Juz Map
* **The Progress Circle:** A central donut chart showing total Khatm percentage.
* **The Juz Grid:** A 5x6 grid of 30 dots/squares below the circle.
    * *State Gray:* Upcoming Juz.
    * *Pulsing Green:* Currently active Juz.
    * *Solid Gold/Olive:* Completed Juz.
* **Projected Finish:** Dynamic text calculating the finish date in **Umm al-Qura Hijri** format based on current pace.

### 2.3 "Continue Reading" Card (Daily Goal)
* **Primary Action:** A "Start Reading" button that deep-links to the exact Surah/Ayah on `quran.com`.
* **Daily Goal Tracker:**
    * **Text Logic (Bug Fix):** Must show `[PagesToday] / [DailyGoal]` (e.g., "2 / 5 pages logged today") instead of total page count.
    * **Progress Bar:** A horizontal bar that fills as the daily goal is reached.
* **Goal Settings:** A small pencil icon allows the user to open a **Bottom Sheet/Modal** to adjust the `DailyGoal` value (e.g., reducing to 1 page on busy days).

---

## 3. Functional & Animation Logic

### 3.1 Metadata Integration
* Utilize `quran-meta` library (`QuranRiwaya.hafs()`).
* Map every `page_number` change to fetch Surah Name (Arabic/English), Ayah context, and Juz number.

### 3.2 Celebration System ("Barakah Bursts")
* **Goal Met:** Trigger a **flower petal confetti** burst when `PagesToday >= DailyGoal`. Change card text to: *"MashaAllah! Daily Goal Achieved! ✨"*.
* **Juz Completion:** Trigger a **full-screen flower bouquet** animation when the `page_number` crosses into a new Juz (e.g., 20 → 21).

### 3.3 Historical Timeline
* A vertical log showing:
    * Date (Umm al-Qura).
    * Pages read.
    * Milestones reached (e.g., "Completed Juz 10").

---

## 4. Technical Data Schema (Draft)
```json
{
  "activeKhatm": {
    "id": "uuid",
    "startPage": 1,
    "lastPageRead": 191,
    "dailyGoal": 5,
    "pagesReadToday": 2,
    "lastLogTimestamp": "ISO-8601"
  },
  "history": [
    { "date": "2026-04-26", "pagesRead": 2, "reachedPage": 191 }
  ]
}