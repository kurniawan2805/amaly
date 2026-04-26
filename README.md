# Amaly

Amaly is a private spiritual companion web app built with React, Vite, TypeScript, and Tailwind CSS.

It currently includes:

- Daily prayer and habit tracking
- Quran reading progress with quick logging, Juz milestones, and Umm al-Qura Hijri dates
- Qadha fasting tracker with Sunnah fasting suggestions
- Menstrual cycle logging with privacy controls and a confirmation-based Qadha bridge
- Local-first persistence through `localStorage`
- Supabase-ready project structure for future database sync

## Tech Stack

- React 18
- Vite
- TypeScript
- Tailwind CSS
- Lucide React icons
- Supabase client
- `quran-meta` for Quran page and Surah metadata

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Run the app:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run lint:

```bash
npm run lint
```

## Environment Variables

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Supabase is prepared for future sync. The current app stores user data locally in the browser.

## Supabase

The initial database schema lives in:

```txt
supabase/migrations/20260425000000_initial_schema.sql
```

Apply it with the Supabase CLI after linking a project:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

## License

MIT
