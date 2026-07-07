# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

This repository is being rewritten from scratch as **beaglesteps.social** — a travel-journaling social app (working UI name "openstep") where users publish trips as a sequence of steps/legs on a map, and others can follow trips and follow other travelers. The rewrite's goal is to turn the previous project (Django + DRF + Angular, https://github.com/TheoLechemia/openstep, live instance https://beaglesteps.com/#/) into a real social network for travel, built into the AT Protocol / Bluesky ecosystem (decentralized handles, following, feeds).

The active code lives in `app/` — a React + TypeScript + Vite project. AT Proto/Bluesky OAuth login and data storage are already wired up (see Architecture below); `src/data/trips.ts` static data is legacy from the first prototype pass and only powers the leftover "Travels" tab in `DiscoverPage`.

**v1 has no custom backend, by design.** Trips and steps are AT Proto records in the user's own PDS repo (`app.beaglesteps.trip` / `app.beaglesteps.step`), and the social layer (likes, comments) is not our own — it rides directly on Bluesky. See "Social layer" below before building anything that looks like a comment/like system.

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

- **Auth**: `AuthContext` (`src/context/AuthContext.tsx`) drives AT Proto OAuth via `@atproto/oauth-client-browser` (`BrowserOAuthClient`), producing an authenticated `Agent` (`@atproto/api`) and the user's `profile`. `ProtectedRoute` gates authenticated routes and redirects to `/login` while a session is loading/absent.
- **Routing**: `react-router-dom`, wired in `src/main.tsx` (`<BrowserRouter>` + `<AuthProvider>` + `<UserTripProvider>`) and `src/App.tsx` (`<Routes>`), which also renders the persistent `<SideNav />` once authenticated. Routes: `/login`, and behind `ProtectedRoute`: `/` (Discover feed), `/profile/:handle` (profile: own or others' steps/trips tabs), `/profile/:handle/trip/:rkey` (trip detail), `/profile/:handle/step/:rkey` (step detail — see Social layer below).
- **Data layer**: real records now, not static data. `src/types/trip.ts` defines `StepRecord`/`TripRecord` (the AT Proto record shapes for the `app.beaglesteps.step` / `app.beaglesteps.trip` lexicons — informally described in `app/lexicon/*.json`, not yet real lexicon schema files) alongside the older static-prototype `Trip`/`TripStep` view shapes. `UserTripContext` (`src/context/UserTripContext.tsx`) loads/creates the current user's own trips and steps via `agent.com.atproto.repo.*` against their PDS repo; pages that read another user's trip (e.g. `TripDetailPage`) resolve the handle to a DID and call `getRecord`/`listRecords` directly. `src/data/trips.ts` / `getTripById` is legacy static data, only still used by the "Travels" tab in `DiscoverPage` — don't add new content there.
- **Pages** (`src/pages/`):
  - `DiscoverPage.tsx` — tab state (Discover/Following/Travels); Travels still renders the legacy static `trips` list + `MapSidebar`.
  - `TripDetailPage.tsx` — resolves `:handle`/`:rkey`, loads the trip + its steps from the author's repo, and owns the `activeStep` index. Renders `TripStepMap` (route polyline) plus the step feed (`Step`).
  - `UserProfilePage.tsx` — the signed-in user's own profile: Steps/Trips tabs backed by `UserTripContext`.
  - `StepDetailPage.tsx` — thin wrapper for the `/profile/:handle/step/:rkey` permalink: resolves the handle/rkey to a step record and renders `<Step defaultExpanded />`. Has no like/comment logic of its own — that lives in `Step`.
- **Components** (`src/components/`): `Avatar` (colored initials), `TripCard`, `MapSidebar` (feed map), `TripStepMap` (SVG polyline route + active/first/last dots), `Step` (a step row — collapsed by default in feeds; an inline "Likes & comments" toggle expands it and lazily fetches the Bluesky thread, so the same component is reused, just pre-expanded, by `StepDetailPage`), `SideNav`, `AddTripModal`/`AddStepModal` (creation forms, posting AT Proto records via `UserTripContext`).
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite` (no separate `tailwind.config`; theme lives in `src/index.css`'s `@theme` block). Prefer existing tokens (`surface-0/1/2`, `ink`/`ink-secondary`/`ink-muted`, `primary`, `accent`, `line`, `font-voice` for titles/wordmark) over introducing new ad hoc colors.
- **Icons**: `@tabler/icons-react` (React components, e.g. `IconMapPin`).

## Social layer (likes/comments): Bluesky, not a custom backend

v1 deliberately has no backend of our own for social interactions — it rides entirely on Bluesky:

- Every `app.beaglesteps.step` is cross-posted as a real `app.bsky.feed.post` in the author's own repo at creation time (`UserTripContext.createStep`), and the resulting `{uri, cid}` is stored back on the step record as `crossPostRef` (`StepRecord.crossPostRef`, `app/lexicon/step.json`). Deleting a step also deletes its cross-post.
- Likes and comments are native Bluesky likes/replies **on that cross-post** — we don't have our own like/comment records. Liking uses `agent.like`/`agent.deleteLike` on `crossPostRef`; commenting is a normal top-level reply (`agent.post({ reply: { root, parent } })` both pointing at `crossPostRef`).
- Fetching that data (`agent.getPostThread`) is expensive and rate-limited, so `Step.tsx` fetches it lazily: a step row is collapsed by default (content only, no thread call) and only loads likes/comments when its "Likes & comments" toggle is expanded. `/profile/:handle/step/:rkey` (`StepDetailPage.tsx`) is a permalink that renders the same `Step` component pre-expanded (`defaultExpanded`) — there's no separate detail layout or duplicated thread-fetching logic.
- A step created before this existed (or created without network access) may have no `crossPostRef`; `Step` only shows the expand toggle when one is present.

## Working in this repo

- Trips/steps are AT Proto records, not local static data — extend them through `UserTripContext` (`createTrip`/`createStep`/`deleteStep`), not by hardcoding in `src/data/trips.ts` (that file is legacy prototype-only).
- Keep likes/comments Bluesky-backed per the Social layer section above — don't introduce our own comment/like records or fetch post threads outside `StepDetailPage`.
- Verify UI changes by running `npm run dev` (after `nvm use` in `app/`) and checking in a browser; there's no test suite to lean on yet.
- Layout must stay responsive: derive widths from flexbox/grid (`flex-1`, `shrink-0`, `min-w-0`, etc.) rather than hardcoding a sibling's pixel width in a `calc()`. If two elements need to line up across components (e.g. matching a sidebar's width), reserve the space with a real flex item, not a guessed magic number.
