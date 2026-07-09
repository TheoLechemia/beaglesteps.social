import { Agent } from '@atproto/api';

interface DidDocument {
  service?: { id: string; type: string; serviceEndpoint: string }[];
}

async function fetchDidDocument(did: string): Promise<DidDocument> {
  const url = did.startsWith('did:web:')
    ? `https://${decodeURIComponent(did.slice('did:web:'.length))}/.well-known/did.json`
    : `https://plc.directory/${did}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not resolve DID document for ${did}`);
  return res.json();
}

const repoAgentCache = new Map<string, Promise<Agent>>();

/**
 * A repo's records live on its owner's own PDS, which may not be the PDS our
 * authenticated session is bound to — Bluesky shards accounts across many PDS
 * instances, so com.atproto.repo.* calls made through our own agent silently
 * 404 (RecordNotFound) for repos hosted elsewhere. Resolve the repo owner's
 * real PDS from their DID document and read from it directly instead (these
 * repo read endpoints are public and need no auth).
 */
export function getRepoAgent(did: string): Promise<Agent> {
  let cached = repoAgentCache.get(did);
  if (!cached) {
    cached = fetchDidDocument(did).then((doc) => {
      const pds = doc.service?.find(
        (s) => s.id === '#atproto_pds' || s.type === 'AtprotoPersonalDataServer',
      );
      if (!pds) throw new Error(`No PDS service found for ${did}`);
      return new Agent(pds.serviceEndpoint);
    });
    repoAgentCache.set(did, cached);
  }
  return cached;
}
