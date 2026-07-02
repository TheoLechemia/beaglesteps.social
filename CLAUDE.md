# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This repository is being rewritten from scratch as **beaglesteps.social** — a travel-journaling social app (working UI name "openstep") where users publish trips as a sequence of steps/legs on a map, and others can follow trips and follow other travelers. The rewrite's goal is to turn the previous project (Django + DRF + Angular, https://github.com/TheoLechemia/openstep, live instance https://beaglesteps.com/#/) into a real social network for travel, built into the AT Protocol / Bluesky ecosystem (decentralized handles, following, feeds).

The active code lives in `app/` — a React + TypeScript + Vite project. It currently renders the prototype with **fully static, hardcoded data** — there is no backend, API, auth, or AT Protocol integration yet. That's the next milestone, not this one.

### Contents

- `app/` — the React/TS/Vite rewrite (see below).
- `demo.html` — the original vanilla-JS/CSS prototype the React app was ported from. Kept for reference; not part of the build. If you're hunting for "how did the old prototype do X", this is the source of truth for interaction details (e.g. step navigation, map pin sync).
- `design_exemple/` — reference screenshots (`travels_list.png`, `trvel_detail.png`) of the intended design; both `demo.html` and `app/` implement these mocks.

## `app/` — commands

- Node version: **use Node 22**, not the OS default. An `.nvmrc` (`22`) is present in `app/`; run `nvm use` there. The system default Node (v16 via `nvm alias default`) is too old for Vite 8 / Tailwind v4 / this toolchain.
- Package manager: npm.
- `npm install` — install deps.
- `npm run dev` — start the Vite dev server.
- `npm run build` — `tsc -b && vite build` (type-checks before bundling).
- `npm run lint` — `oxlint`.
- No test suite exists yet.

## `app/` — architecture

- **Routing**: `react-router-dom`, wired in `src/main.tsx` (`<BrowserRouter>`) and `src/App.tsx` (`<Routes>`). Two routes: `/` (Discover feed) and `/trips/:id` (trip detail). `App.tsx` also renders the persistent `<NavBar />` above the routed content.
- **Data layer (static, for now)**: `src/types/trip.ts` defines the `Trip`/`TripStep`/`Avatar` shapes; `src/data/trips.ts` exports a hardcoded `trips: Trip[]` array plus `getTripById(id)`. Each `Trip` embeds its own `steps: TripStep[]`. When real data fetching is introduced, this module's shape is the contract to preserve or migrate — pages consume `trips`/`getTripById` and shouldn't need to change if the data source changes underneath.
- **Pages** (`src/pages/`):
  - `DiscoverPage.tsx` — tab state (Discover/Following) + trip list (`TripCard`) + `MapSidebar` showing one pin per trip.
  - `TripDetailPage.tsx` — reads `:id` via `useParams`, looks up the trip, and owns the `activeStep` index (prev/next navigation, disabled at the ends). Renders `TripStepMap` (route polyline) and `StepMapPins` (per-step pins in the side map), both driven by `activeStep`, plus the step content panel (stats grid, description, photo grid with a "+N" overlay past 3 photos).
- **Components** (`src/components/`): `NavBar`, `Avatar` (colored initials), `TripCard`, `MapSidebar` (feed map), `TripStepMap` (SVG polyline route + active/first/last dots), `StepMapPins` (clickable per-step pins, click jumps `activeStep`).
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` (no separate `tailwind.config`; theme lives in `src/index.css`'s `@theme` block). Design tokens are ported 1:1 from the original `demo.html` CSS custom properties: `surface-0/1/2`, `text-primary/secondary/muted/accent`, `bg-accent`, `bg-success`, `text-success`, `border`, plus `font-sans` (Inter) and `font-voice` (Fraunces, used for trip/step titles and the wordmark) — loaded via a Google Fonts `@import`. Prefer these existing tokens (e.g. `bg-surface-1`, `text-text-muted`, `font-voice`) over introducing new ad hoc colors.
- **Icons**: `@tabler/icons-react` (React components, e.g. `IconMapPin`), replacing the old `ti ti-*` icon-font classes from `demo.html`.

## Working in this repo

- When extending the prototype, keep using the established data flow: add/edit trips in `src/data/trips.ts` rather than hardcoding content in components.
- Don't add network calls, AT Protocol/Bluesky auth, or a backend yet — that's an explicit later milestone; the current phase is intentionally static-data-only.
- Verify UI changes by running `npm run dev` (after `nvm use` in `app/`) and checking in a browser; there's no test suite to lean on yet.
