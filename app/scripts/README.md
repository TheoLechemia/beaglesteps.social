# scripts/

Standalone Node scripts, run directly with `node` — not part of the Vite app build (nothing under `scripts/` is included by `tsconfig.app.json`).

## import-legacy-trip.mjs

One-off migration: imports a trip and its steps from the old Django/DRF beaglesteps.com API into an AT Proto PDS, as `app.beaglesteps.trip` / `app.beaglesteps.step` records. Mirrors what `UserTripContext`'s `createTrip`/`createStep` do in the app (same record shape, same cross-post-to-Bluesky behavior), just driven from the legacy JSON instead of the UI.

### Prerequisites

- Node 22 (`nvm use` from `app/`).
- A Bluesky **app password** for the destination account (Settings > App passwords in the Bluesky app) — not the account password. The script logs in directly via `agent.login()`, no OAuth flow.

### Usage

```bash
cd app && nvm use
node scripts/import-legacy-trip.mjs --handle=<handle> --password=<app-password> [options]
```

| Flag | Default | Description |
| --- | --- | --- |
| `--handle` | *(required)* | Destination AT Proto handle (e.g. `alice.bsky.social`). Its PDS is resolved automatically via DID doc, so this works for any host, not just bsky.social. |
| `--password` | *(required)* | Bluesky app password for that account. |
| `--uuid` | `93387b3b-f5e8-4ed9-9667-12c8fbc1608b` | UUID of the legacy travel to import. |
| `--api-base` | `https://beaglesteps.com/backend` | Base URL of the legacy API. |
| `--dry-run` | off | Fetches and prints what would be created — trip fields, and each step's date/title/photo count — without logging in or writing anything. |

Example:

```bash
node scripts/import-legacy-trip.mjs --handle=alice.bsky.social --password=abcd-1234-efgh-5678 --dry-run
```

### What it does

1. Fetches the legacy travel JSON (`{api-base}/api/travels/{uuid}/`).
2. Creates one `app.beaglesteps.trip` record (title, description, startDate/endDate, visibility from `is_public`).
3. Filters the travel's GeoJSON features to actual content steps — legacy `positional_step: true` entries are bare GPS waypoints with no title/description/photos and are skipped — and sorts the rest by date.
4. For each step: strips HTML and decodes entities from the legacy description (into `StepRecord.body`, which the UI renders as plain text), takes the first 4 photos, uploads them as blobs (resizing via `sharp` only if a photo is over Bluesky's ~1.9MB limit — none were, on the travel this was built against), cross-posts to Bluesky exactly like `createStep` does, and creates the `app.beaglesteps.step` record.

### What it deliberately skips

- **Comments.** The legacy API's per-step comments are not imported — v1's social layer rides on native Bluesky likes/replies to the step's cross-post, not our own comment records (see the repo's `CLAUDE.md`, "Social layer").
- **Idempotency.** There's no check for already-imported trips/steps. Running the script twice for the same travel creates duplicate records and duplicate Bluesky posts. Use `--dry-run` first, and only run for real once per travel.
