# IUScore

IUScore is a lightweight PWA that keeps intestinal ultrasound documentation focused and fast. It ships with a frictionless React + Vite experience, shadcn-inspired components, Tailwind CSS, and an opinionated workflow for segment-driven reports aligned with the Milan criteria (UC) and IBUS-SAS (Crohn's disease).

## Features

- 🔁 Desktop-first responsive layout with segment cards defaulting to "uninvolved" and auto-coloring as data appears.
- 🧠 Auto-generated findings + impression with live insight into severity and target segments.
- 📋 One-click copyable report (Date, Indication, Findings, Impression) with clipboard confirmation.
- ⚡️ Shadcn component patterns, Radix primitives, Tailwind CSS, and Inter Variable typography.
- 📱 Installable PWA via a custom service worker + manifest-ready icons.

## Live site

The production app is hosted at [https://iuscore.app](https://iuscore.app) with the latest main branch build. Use the hosted version for day-to-day scanning, and feel free to file issues if you spot drift between main and production.

## Maintainer workflow

The codebase is optimized for the internal IUScore deployment and is not intended as a turn-key starter kit. If you need to work on the app locally:

1. Install Node 20 LTS (we commit a `package-lock.json` to keep versions reproducible).
2. `cd iuscore` & `npm install` to pull front-end dependencies.
3. `npm run dev` to run the Vite dev server; use `npm run dev -- --host` when you need to exercise the PWA on external devices.

Offline caching, install prompts, and clipboard flows only behave identically to production when the app is served from `https://iuscore.app`, so treat local runs as a visual sandbox rather than a substitute for clinical use.

Generate the production bundle with `npm run build`. The output lands in `iuscore/dist/` and is uploaded through the IUScore deployment pipeline.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS + shadcn-inspired UI primitives
- Radix UI primitives, lucide-react icons
- Custom service worker + manifest for offline/install support

Feel free to adjust segment heuristics, indications, or add integrations as the reporting workflow evolves.
