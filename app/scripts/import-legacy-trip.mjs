#!/usr/bin/env node
/**
 * One-off migration: import a trip + its steps from the old Django/DRF
 * beaglesteps.com API into an AT Proto PDS as app.beaglesteps.trip /
 * app.beaglesteps.step records (mirrors UserTripContext's createTrip/createStep).
 *
 * Usage:
 *   node scripts/import-legacy-trip.mjs --handle=alice.bsky.social --password=xxxx-xxxx-xxxx-xxxx \
 *     [--uuid=93387b3b-f5e8-4ed9-9667-12c8fbc1608b] [--api-base=https://beaglesteps.com/backend] [--dry-run]
 *
 * --password is a Bluesky "app password" (Settings > App passwords), not the account password.
 * Comments on the legacy steps are intentionally not imported (v1's social layer rides on
 * native Bluesky likes/replies to the step's cross-post, not our own comment records).
 */
import { AtpAgent } from '@atproto/api';
import he from 'he';
const { decode } = he;
import sharp from 'sharp';

const MAX_PHOTOS = 4;
const MAX_BLOB_BYTES = 1_900_000; // Bluesky rejects image blobs above 2MB
const MAX_DIMENSION = 2000;

function parseArgs(argv) {
  const args = { apiBase: 'https://beaglesteps.com/backend', uuid: '93387b3b-f5e8-4ed9-9667-12c8fbc1608b' };
  for (const arg of argv) {
    const [key, ...rest] = arg.replace(/^--/, '').split('=');
    const value = rest.join('=');
    if (key === 'dry-run') args.dryRun = true;
    else if (key === 'handle') args.handle = value;
    else if (key === 'password') args.password = value;
    else if (key === 'uuid') args.uuid = value;
    else if (key === 'api-base') args.apiBase = value;
  }
  if (!args.handle || !args.password) {
    console.error(
      'Usage: node scripts/import-legacy-trip.mjs --handle=<handle> --password=<app-password> [--uuid=<uuid>] [--api-base=<url>] [--dry-run]',
    );
    process.exit(1);
  }
  return args;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, label) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status ?? err?.response?.status;
      if (status === 429 && attempt < 3) {
        const wait = 5000 * (attempt + 1);
        console.warn(`  rate limited (${label}), retrying in ${wait}ms...`);
        await sleep(wait);
        continue;
      }
      throw err;
    }
  }
}

/** Resolves a handle to its DID and PDS service endpoint, so login works for any AT Proto host, not just bsky.social. */
async function resolvePdsService(handle) {
  const resolveRes = await fetch(
    `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`,
  );
  if (!resolveRes.ok) throw new Error(`Could not resolve handle "${handle}" (${resolveRes.status})`);
  const { did } = await resolveRes.json();

  let doc;
  if (did.startsWith('did:plc:')) {
    const plcRes = await fetch(`https://plc.directory/${did}`);
    if (!plcRes.ok) throw new Error(`Could not fetch DID document for ${did} (${plcRes.status})`);
    doc = await plcRes.json();
  } else if (did.startsWith('did:web:')) {
    const domain = did.slice('did:web:'.length);
    const webRes = await fetch(`https://${domain}/.well-known/did.json`);
    if (!webRes.ok) throw new Error(`Could not fetch DID document for ${did} (${webRes.status})`);
    doc = await webRes.json();
  } else {
    throw new Error(`Unsupported DID method for ${did}`);
  }

  const pds = doc.service?.find((s) => s.id === '#atproto_pds' || s.type === 'AtprotoPersonalDataServer');
  if (!pds) throw new Error(`No PDS service entry in DID document for ${did}`);
  return { did, service: pds.serviceEndpoint };
}

async function fetchLegacyTravel(apiBase, uuid) {
  const url = `${apiBase.replace(/\/$/, '')}/api/travels/${uuid}/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch legacy travel from ${url} (${res.status})`);
  return res.json();
}

/** The legacy description is HTML (<p> tags, HTML entities); StepRecord.body is rendered as plain text. */
function htmlToPlainText(html) {
  if (!html) return '';
  const withBreaks = html
    .replace(/\r/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '');
  return decode(withBreaks).replace(/\n{3,}/g, '\n\n').trim();
}

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download photo ${url} (${res.status})`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const mimeType = res.headers.get('content-type') || 'image/jpeg';
  return { buffer, mimeType };
}

/** Mirrors app/src/lib/image.ts's compressImage: only touches photos that are actually oversized. */
async function prepareImage(buffer, mimeType) {
  if (buffer.length <= MAX_BLOB_BYTES) return { data: buffer, mimeType };

  console.log(`    resizing oversized photo (${(buffer.length / 1e6).toFixed(2)}MB)...`);
  const meta = await sharp(buffer).metadata();
  let pipeline = sharp(buffer).rotate();
  if ((meta.width ?? 0) > MAX_DIMENSION || (meta.height ?? 0) > MAX_DIMENSION) {
    pipeline = pipeline.resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside' });
  }

  let quality = 90;
  let out;
  do {
    out = await pipeline.jpeg({ quality }).toBuffer();
    quality -= 15;
  } while (out.length > MAX_BLOB_BYTES && quality > 30);

  return { data: out, mimeType: 'image/jpeg' };
}

function buildTripRecord(travel) {
  return {
    $type: 'app.beaglesteps.trip',
    title: travel.name,
    description: htmlToPlainText(travel.description),
    startDate: travel.start_date,
    endDate: travel.end_date,
    visibility: travel.is_public ? 'public' : 'private',
    createdAt: new Date().toISOString(),
  };
}

function selectContentSteps(travel) {
  return travel.steps.features
    .filter((f) => !f.properties.positional_step && f.properties.name)
    .sort((a, b) => new Date(a.properties.date) - new Date(b.properties.date));
}

async function importStep(agent, feature, tripRef, { dryRun }) {
  const p = feature.properties;
  const [longitude, latitude] = feature.geometry.coordinates;
  const photoMedias = (p.medias ?? []).filter((m) => m.media_type === 'image').slice(0, MAX_PHOTOS);

  console.log(`- ${p.date.slice(0, 10)} ${p.name} (${photoMedias.length} photo(s))`);

  const record = {
    $type: 'app.beaglesteps.step',
    tripRef,
    title: p.name,
    body: htmlToPlainText(p.description),
    date: p.date.slice(0, 10),
    createdAt: new Date().toISOString(),
    location: { latitude: String(latitude), longitude: String(longitude) },
    ...(p.country ? { address: { country: p.country } } : {}),
  };

  if (dryRun) return;

  // Uploaded one at a time: parallel requests can race on rate limits / session state.
  const blobs = [];
  for (const media of photoMedias) {
    const { buffer, mimeType } = await downloadImage(media.src);
    const prepared = await prepareImage(buffer, mimeType);
    const { data } = await withRetry(
      () => agent.uploadBlob(prepared.data, { encoding: prepared.mimeType }),
      'uploadBlob',
    );
    blobs.push(data.blob);
  }

  const fullText = [record.title, record.body].filter(Boolean).join('\n\n');
  const crossPostText = fullText.length > 300 ? `${fullText.slice(0, 297)}...` : fullText;
  const crossPost = await withRetry(
    () =>
      agent.post({
        text: crossPostText,
        createdAt: record.createdAt,
        ...(blobs.length > 0 && {
          embed: {
            $type: 'app.bsky.embed.images',
            images: blobs.map((blob) => ({ image: blob, alt: '' })),
          },
        }),
      }),
    'post',
  );

  const photoRefs = blobs.map((blob) => ({
    ref: { $link: blob.ref.toString() },
    mimeType: blob.mimeType,
    size: blob.size,
  }));
  const recordWithExtras = { ...record, photos: photoRefs, crossPostRef: crossPost };

  await withRetry(
    () =>
      agent.com.atproto.repo.createRecord({
        repo: agent.session.did,
        collection: 'app.beaglesteps.step',
        record: recordWithExtras,
      }),
    'createRecord(step)',
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let agent;
  if (!args.dryRun) {
    console.log(`Resolving PDS for ${args.handle}...`);
    const { service } = await resolvePdsService(args.handle);
    agent = new AtpAgent({ service });
    await agent.login({ identifier: args.handle, password: args.password });
    console.log(`Logged in as ${args.handle} (${service})`);
  }

  console.log(`Fetching legacy travel ${args.uuid} from ${args.apiBase}...`);
  const travel = await fetchLegacyTravel(args.apiBase, args.uuid);
  const contentSteps = selectContentSteps(travel);
  const skipped = travel.steps.features.length - contentSteps.length;
  console.log(
    `Travel "${travel.name}": ${contentSteps.length} step(s) to import` +
      (skipped > 0 ? ` (${skipped} positional/empty waypoint(s) skipped)` : ''),
  );

  const tripRecord = buildTripRecord(travel);
  if (args.dryRun) {
    console.log('\n[dry-run] Would create trip:', tripRecord);
  }

  let tripRef;
  if (!args.dryRun) {
    const { data } = await withRetry(
      () =>
        agent.com.atproto.repo.createRecord({
          repo: agent.session.did,
          collection: 'app.beaglesteps.trip',
          record: tripRecord,
        }),
      'createRecord(trip)',
    );
    tripRef = { uri: data.uri, cid: data.cid };
    console.log(`Created trip record: ${tripRef.uri}`);
  }

  console.log(`\nImporting ${contentSteps.length} step(s)...`);
  for (const feature of contentSteps) {
    await importStep(agent, feature, tripRef, args);
  }

  console.log(args.dryRun ? '\n[dry-run] Done, nothing was written.' : '\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
