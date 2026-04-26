# PRD: Amaly Fasting & Qadha Tracker (v2)

## 1. Objective
To manage obligatory fasts (Qadha) and upcoming Sunnah opportunities with high automation and local Hijri precision.

## 2. Functional Requirements

### 2.1 Remaining Qadha Management
* **Manual Log:** "Add Debt" (+) and "Mark Paid" (-) buttons.
* **Smart Automation (Auto-Qadha):** * **Trigger:** When a menstrual cycle "End Date" is logged.
    * **Logic:** If the cycle dates overlap with the current Hijri month of **Ramadan**, calculate the number of overlapping days and automatically increment the `RemainingQadha` counter.
    * **Notification:** Show a snackbar: *"MashaAllah, I've added [X] days to your Qadha debt from Ramadan."*

### 2.2 Upcoming Sunnah Section
* **Hardcoded Rules Engine:**
    * **Weekly:** Mondays and Thursdays.
    * **Monthly (Ayyam al-Bidh):** 13th, 14th, and 15th of every Hijri month.
    * **Annual:** Day of Arafah (9 Dhu al-Hijjah), Ashura (10 Muharram), Tasu'a (9 Muharram).
* **Display:** Show the next 3 relevant fasts in a "Sunnah Timeline."

### 2.3 Hijri Offset System (Global)
* **Variable:** `globalHijriOffset` (Integer, default 0).
* **Implementation:** The offset is applied *after* fetching the Umm al-Qura date but *before* the UI renders it.
* **UX:** A small adjustment link in the Fasting header (or Settings) providing a [-2, -1, 0, +1, +2] selector.

---

## 3. Technical Specifications

### 3.1 Date Logic (Pseudo-code)
```javascript
const getAdjustedHijri = (date, offset) => {
  const d = new Date(date);
  d.setDate(d.getDate() + offset); // Apply offset to the JS Date object
  return d.toLocaleDateString("en-SA-u-ca-islamic-umalqura", {
    day: 'numeric', month: 'long', year: 'numeric'
  });
};