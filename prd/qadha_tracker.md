# PRD: Amaly Fasting & Qadha Tracker

## 1. Objective
To provide a clear overview of obligatory fasts to be repaid (Qadha) and upcoming Sunnah fasting opportunities, localized to the Hijri calendar with user-defined corrections.

## 2. Features

### 2.1 Remaining Qadha (Obligatory Debt)
* **Visual:** A circular progress bar showing "Days Remaining."
* **Actions:**
    * **Add Debt:** Manually increment the count (e.g., after illness or travel).
    * **Mark Paid:** Decrement the count after a fast is completed.
* **Smart Alert:** If the Qadha count is > 0 and Ramadan is less than 30 days away, change the card border to a "Warning" color (e.g., soft orange).

### 2.2 Upcoming Sunnah Section
* **Dynamic Feed:** A list of the next 3 upcoming Sunnah fasts.
* **Logic Engine:** * Weekly check for Mondays/Thursdays.
    * Monthly check for 13, 14, 15 (Ayyam al-Bidh).
    * Annual check for special days (Arafah, Ashura).
* **Notification:** A bell icon to toggle reminders for Sahur.

### 2.3 Hijri Date Management
* **Display:** Always show the current Hijri date (Umm al-Qura) at the top of the section.
* **Correction Logic:** * Global `hijriOffset` variable (Integer).
    * **UX:** Small "Adjust Date" link near the header that opens a simple selector: [-2, -1, 0, +1, +2] days.

---

## 3. Technical Specifications

### 3.1 Sunnah Calculation Logic (Pseudo-code)
```javascript
const sunnahFasts = [
  { name: "Monday Fast", type: "weekly", dayOfWeek: 1 },
  { name: "Ayyam al-Bidh", type: "monthly", days: [13, 14, 15] },
  // ...other types
];

function getUpcoming(currentHijriDate, offset) {
  const adjustedDate = applyOffset(currentHijriDate, offset);
  // Scan the next 30 days and return the first 3 matches
}