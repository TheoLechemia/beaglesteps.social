import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ComAtprotoRepoListRecords } from '@atproto/api';
import { useAuth } from './AuthContext';
import type { StepRecord, TripFollowRecord, TripRecord } from '../types/trip';
import type { StepEntry } from '../components/Step';
import { compressImage } from '../lib/image';

export type TripEntry = ComAtprotoRepoListRecords.Record & { value: TripRecord };
export type TripFollowEntry = ComAtprotoRepoListRecords.Record & { value: TripFollowRecord };

type TripInput = TripRecord & { $type: 'app.beaglesteps.trip'; createdAt: string };
type StepInput = StepRecord & { $type: 'app.beaglesteps.step'; createdAt: string };

interface UserTripContextValue {
  trips: TripEntry[];
  steps: StepEntry[];
  tripFollows: TripFollowEntry[];
  isLoading: boolean;
  createTrip: (record: TripInput) => Promise<TripEntry>;
  createStep: (record: StepInput, photos?: File[]) => Promise<StepEntry>;
  deleteStep: (step: StepEntry) => Promise<void>;
  followTrip: (subject: { uri: string; cid: string }) => Promise<TripFollowEntry>;
  unfollowTrip: (follow: TripFollowEntry) => Promise<void>;
}

const UserTripContext = createContext<UserTripContextValue | null>(null);

export function UserTripProvider({ children }: { children: ReactNode }) {
  const { agent, profile } = useAuth();
  const [trips, setTrips] = useState<TripEntry[]>([]);
  const [steps, setSteps] = useState<StepEntry[]>([]);
  const [tripFollows, setTripFollows] = useState<TripFollowEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!agent || !profile) {
      setTrips([]);
      setSteps([]);
      setTripFollows([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      agent.com.atproto.repo.listRecords({ repo: profile.did, collection: 'app.beaglesteps.trip' }),
      agent.com.atproto.repo.listRecords({ repo: profile.did, collection: 'app.beaglesteps.step' }),
      agent.com.atproto.repo.listRecords({ repo: profile.did, collection: 'app.beaglesteps.tripFollow' }),
    ]).then(([tripsRes, stepsRes, tripFollowsRes]) => {
      if (cancelled) return;
      
      setTrips(tripsRes.data.records as TripEntry[]);
      setSteps(stepsRes.data.records as StepEntry[]);
      setTripFollows(tripFollowsRes.data.records as TripFollowEntry[]);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [agent, profile]);

  async function createTrip(record: TripInput) {
    if (!agent || !profile) throw new Error('Not authenticated');
    const { data } = await agent.com.atproto.repo.createRecord({
      repo: profile.did,
      collection: 'app.beaglesteps.trip',
      record,
    });
    const entry = { uri: data.uri, cid: data.cid, value: record } as TripEntry;
    setTrips((prev) => [entry, ...prev]);
    return entry;
  }

  async function createStep(record: StepInput, photos: File[] = []) {
    if (!agent || !profile) throw new Error('Not authenticated');
    // Uploaded one at a time: parallel requests race on the OAuth DPoP nonce
    // (each response rotates it) and the losers come back 401.
    const blobs = [];
    for (const file of photos.slice(0, 4)) {
      const compressed = await compressImage(file);
      const { data } = await agent.uploadBlob(compressed, { encoding: compressed.type || file.type });
      blobs.push(data.blob);
    }

    const fullText = [record.title, record.body].filter(Boolean).join('\n\n');
    const crossPostText = fullText.length > 300 ? `${fullText.slice(0, 297)}...` : fullText;
    const crossPost = await agent.post({
      text: crossPostText,
      createdAt: record.createdAt,
      ...(blobs.length > 0 && {
        embed: {
          $type: 'app.bsky.embed.images',
          images: blobs.map((blob) => ({ image: blob, alt: '' })),
        },
      }),
    });

    // Store the plain JSON blob-ref shape (matches what getRecord/listRecords return),
    // not the BlobRef class instances used above for the bsky embed.
    const photoRefs = blobs.map((blob) => ({
      ref: { $link: blob.ref.toString() },
      mimeType: blob.mimeType,
      size: blob.size,
    }));
    const recordWithExtras = { ...record, photos: photoRefs, crossPostRef: crossPost } as unknown as StepInput;
    const { data } = await agent.com.atproto.repo.createRecord({
      repo: profile.did,
      collection: 'app.beaglesteps.step',
      record: recordWithExtras,
    });
    const entry = { uri: data.uri, cid: data.cid, value: recordWithExtras } as StepEntry;
    setSteps((prev) => [entry, ...prev]);
    return entry;
  }

  async function deleteStep(step: StepEntry) {
    if (!agent || !profile) return;
    const rkey = step.uri.split('/').pop()!;
    await agent.com.atproto.repo.deleteRecord({
      repo: profile.did,
      collection: 'app.beaglesteps.step',
      rkey,
    });
    if (step.value.crossPostRef) {
      await agent.deletePost(step.value.crossPostRef.uri);
    }
    setSteps((prev) => prev.filter((s) => s.uri !== step.uri));
  }

  async function followTrip(subject: { uri: string; cid: string }) {
    if (!agent || !profile) throw new Error('Not authenticated');
    const record: TripFollowRecord & { $type: 'app.beaglesteps.tripFollow' } = {
      $type: 'app.beaglesteps.tripFollow',
      subject,
      createdAt: new Date().toISOString(),
    };
    const { data } = await agent.com.atproto.repo.createRecord({
      repo: profile.did,
      collection: 'app.beaglesteps.tripFollow',
      record,
    });
    const entry = { uri: data.uri, cid: data.cid, value: record } as TripFollowEntry;
    setTripFollows((prev) => [entry, ...prev]);
    return entry;
  }

  async function unfollowTrip(follow: TripFollowEntry) {
    if (!agent || !profile) return;
    const rkey = follow.uri.split('/').pop()!;
    await agent.com.atproto.repo.deleteRecord({
      repo: profile.did,
      collection: 'app.beaglesteps.tripFollow',
      rkey,
    });
    setTripFollows((prev) => prev.filter((f) => f.uri !== follow.uri));
  }

  return (
    <UserTripContext.Provider
      value={{ trips, steps, tripFollows, isLoading, createTrip, createStep, deleteStep, followTrip, unfollowTrip }}
    >
      {children}
    </UserTripContext.Provider>
  );
}

export function useUserTrip() {
  const ctx = useContext(UserTripContext);
  if (!ctx) {
    throw new Error('useUserTrip must be used within a UserTripProvider');
  }
  return ctx;
}
