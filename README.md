# Shift — Kitchen Shift Scheduler

A visual, web-based **shift scheduling tool** built for cloud kitchen managers. Plan staff shifts, manage breaks, and validate coverage — all from an interactive timeline grid.

## What It Does

Replaces spreadsheet-based shift planning with a real-time timeline UI. Managers drag, click, and configure shifts per staff member, with built-in validation that catches coverage gaps before they happen.

## Key Features

- **Interactive timeline grid** — click any row/block to add or edit a shift
- **Staff management** — Chef, Support Staff, Other roles with custom tags
- **Configurable kitchen hours** — set open/close times per day of week
- **Multiple breaks per shift** — accurately reflect real kitchen schedules
- **Smart validation warnings** — alerts for missing chef on shift or all staff on break simultaneously
- **Role filter** — focus on specific staff types in the timeline
- **Per-hour staff count** — header shows staffing levels across the day
- **Cloud sync via GitHub Gist** — save and load schedules using a personal access token (no server needed)
- **Mobile-responsive layout** — works on tablets and phones

## Tech Stack

| Technology | Purpose |
|------------|---------|
| Next.js 16 (App Router) | Framework |
| React 19 | UI |
| TypeScript | Type safety |
| Tailwind CSS v4 | Styling |
| shadcn/ui + Radix UI | Components |
| dnd-kit | Drag and drop |
| date-fns | Date utilities |
| Lucide React | Icons |

## Getting Started

```bash
npm install
npm run dev
```

Configure your GitHub Gist token in settings for cloud sync.

## Audience

Cloud kitchen managers and NOSH7 operations team scheduling daily staff shifts.