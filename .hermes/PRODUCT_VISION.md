# Product Vision: Compass

**Version:** 1.0
**Date:** 2026-07-05
**Product Owner:** Hossein Mobini

## Vision Statement

Compass is a personal time tracking and life organization system that helps Hossein understand where his time goes, align his daily actions with his long-term goals, and continuously improve his productivity and life satisfaction.

**One sentence:** *Your day, distilled into calm focus.*

## Target User

Hossein — PhD researcher, entrepreneur, multi-disciplinary thinker. Needs a tool that:
- Tracks focused work sessions (with Pomodoro support)
- Organizes daily/weekly/quarterly goals
- Manages tasks, interruptions, and reflections
- Provides analytics and heatmaps for self-improvement
- Works across devices via PostgreSQL backend

## Success Metrics

| Metric | Target |
|--------|--------|
| App loads without errors | 100% |
| All features functional | All tabs work end-to-end |
| Data persisted in PostgreSQL | Zero localStorage reads |
| Build passes `npm run build` | Zero errors |
| Mobile-responsive | Full functionality on phone |

## Tech Stack

- **Framework:** Next.js 16.2.9 (App Router)
- **Language:** TypeScript 5
- **UI:** Tailwind CSS v4 + shadcn/ui + Radix primitives
- **Database:** PostgreSQL (local)
- **Auth:** None (personal tool)

## Constraints

- Single-user personal tool
- Local PostgreSQL required
- No cloud dependencies
- All data must survive browser cache clears
