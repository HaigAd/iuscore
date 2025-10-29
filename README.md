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

## Getting started

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173`. Build the production bundle with `npm run build`.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS + shadcn-inspired UI primitives
- Radix UI primitives, lucide-react icons
- Custom service worker + manifest for offline/install support

Feel free to adjust segment heuristics, indications, or add integrations as the reporting workflow evolves.
