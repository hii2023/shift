# Kitchen Shift Scheduler

A visual, web-based shift scheduling tool for cloud kitchens. Built with Next.js 16, Tailwind CSS, and shadcn/ui.

## Features

- **Scheduler** — Interactive timeline grid showing all staff shifts per day. Click any row to add a shift, click a shift block to edit it.
- **Staff Management** — Add/edit/delete staff with name, role (Chef / Support Staff / Other), and custom tags.
- **Kitchen Settings** — Configure open/close times for each day of the week (Mon–Sun), with ability to mark days as closed.
- **Break Management** — Add one or more breaks within a shift. Breaks appear as a lighter segment on the shift bar.
- **Smart Validation** — Warnings for missing chef coverage and all-staff-on-break scenarios.
- **Role Filter** — Filter the scheduler view by role (Chef, Support Staff, Other).
- **Staff Count** — Per-hour staff count displayed in the timeline header.
- **Persistence** — All data stored in browser localStorage.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Deploy on Vercel

Push to GitHub and import the repository on [Vercel](https://vercel.com). No additional configuration needed.

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Radix UI](https://radix-ui.com)
- [Lucide React](https://lucide.dev)
- [dnd-kit](https://dndkit.com) (installed for future drag-and-drop enhancements)
