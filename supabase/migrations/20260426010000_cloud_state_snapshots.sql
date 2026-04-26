alter table public.user_settings
  add column if not exists app_settings jsonb not null default '{
    "language": "en",
    "theme": "day",
    "hijriOffset": 0,
    "partnerRole": null,
    "shareCycleSupportStatus": false,
    "habits": [
      {
        "id": "habit-morning-dhikr",
        "label": "Morning Dhikr",
        "category": "Daily Routine",
        "scheduleLabel": "After Fajr",
        "plannedDays": [true, true, true, true, true, true, true],
        "enabled": true,
        "timing": { "mode": "prayer", "prayer": "fajr", "offsetMinutes": 15 }
      },
      {
        "id": "habit-mid-day-quran-1-page",
        "label": "Mid-day Quran (1 Page)",
        "category": "Daily Routine",
        "scheduleLabel": "Toddler Nap Time",
        "plannedDays": [true, true, true, true, true, true, true],
        "enabled": true,
        "timing": { "mode": "fixed", "time": "" }
      },
      {
        "id": "habit-evening-reflection-shidq",
        "label": "Evening Reflection & Shidq",
        "category": "Daily Routine",
        "scheduleLabel": "Before Bed",
        "plannedDays": [true, true, true, true, true, true, true],
        "enabled": true,
        "timing": { "mode": "fixed", "time": "21:00" }
      },
      {
        "id": "habit-dua-for-children",
        "label": "Dua for Children",
        "category": "Daily Routine",
        "scheduleLabel": "During Ashr Window",
        "plannedDays": [true, true, true, true, true, true, true],
        "enabled": true,
        "timing": { "mode": "prayer", "prayer": "ashr", "offsetMinutes": 0 }
      },
      {
        "id": "habit-read-surah-al-kahf",
        "label": "Read Surah Al-Kahf",
        "category": "Friday Specials",
        "scheduleLabel": "Anytime Friday",
        "plannedDays": [false, false, false, false, false, true, false],
        "enabled": true,
        "timing": { "mode": "fixed", "time": "" }
      },
      {
        "id": "habit-increased-salawat",
        "label": "Increased Salawat",
        "category": "Friday Specials",
        "scheduleLabel": "Throughout Jumu''ah",
        "plannedDays": [false, false, false, false, false, true, false],
        "enabled": true,
        "timing": { "mode": "fixed", "time": "" }
      },
      {
        "id": "habit-friday-sadaqah",
        "label": "Friday Sadaqah",
        "category": "Friday Specials",
        "scheduleLabel": "Morning",
        "plannedDays": [false, false, false, false, false, true, false],
        "enabled": true,
        "timing": { "mode": "fixed", "time": "10:00" }
      },
      {
        "id": "habit-log-sunnah-prayers",
        "label": "Log Sunnah Prayers",
        "category": "Daily Routine",
        "scheduleLabel": "End of Day",
        "plannedDays": [true, true, true, true, true, true, true],
        "enabled": true,
        "timing": { "mode": "fixed", "time": "20:30" }
      }
    ]
  }'::jsonb,
  add column if not exists fasting_state jsonb not null default '{
    "remainingQadha": 0,
    "totalQadhaDebt": 0,
    "paidQadha": 0,
    "cycleLogs": [],
    "sahurReminderDates": [],
    "lastAutoQadhaMessage": null
  }'::jsonb,
  add column if not exists cycle_state jsonb not null default '{
    "settings": { "avgCycleLength": 28, "privacyEnabled": true },
    "activePeriod": null,
    "currentSymptoms": [],
    "logs": []
  }'::jsonb,
  add column if not exists daily_tracker_state jsonb not null default '{
    "days": {}
  }'::jsonb,
  add column if not exists cloud_state_version integer not null default 1;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (new.id, new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'avatar_url')
  on conflict (id) do update
    set display_name = excluded.display_name,
        avatar_url = excluded.avatar_url,
        updated_at = now();

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.quran_progress (
    user_id,
    surah,
    ayah,
    page,
    pages_read_today,
    daily_goal,
    last_page_read,
    goal_completed_today,
    completed_juzs,
    logs
  )
  values (
    new.id,
    1,
    1,
    1,
    0,
    5,
    0,
    false,
    '[]'::jsonb,
    '[]'::jsonb
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;
