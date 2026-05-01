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
- **Cloud Sync** — Auto-saves to a private GitHub Gist so your schedule is available on any device.
- **Mobile-friendly** — Responsive layout that works on phones and tablets.

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

## Deploy on Vercel (GitHub Hosted)

1. Push this repository to GitHub (already done).
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import the `shift` repo.
3. Accept the defaults — Vercel auto-detects Next.js.
4. Click **Deploy**. Every push to `main` auto-deploys.
5. Share the generated `*.vercel.app` URL with your team.

## Cross-Device Sync via GitHub Gist

Once the app is deployed, your data will sync automatically across all your devices:

1. [Create a GitHub Personal Access Token](https://github.com/settings/tokens/new?scopes=gist&description=Kitchen+Scheduler) with the **`gist`** scope.
2. In the app, open **Settings → Cloud Sync**.
3. Paste your token and click **Connect**.
   - The app creates a private GitHub Gist and saves your schedule there.
4. On any other device, open the app, go to **Settings → Cloud Sync**, and enter the **same token**.
   - The app finds your existing Gist and loads the data automatically.
5. Every change you make is auto-saved to the Gist within a few seconds.

> Your token is stored only in your browser's localStorage and is sent directly to GitHub's API — it is never shared with any third party.

## Tech Stack

- [Next.js 16](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Radix UI](https://radix-ui.com)
- [Lucide React](https://lucide.dev)
- [dnd-kit](https://dndkit.com) (installed for future drag-and-drop enhancements)
