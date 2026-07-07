import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ComAtprotoRepoListRecords } from '@atproto/api';
import { useAuth } from './AuthContext';
import type { StepRecord, TripRecord } from '../types/trip';
import type { StepEntry } from '../components/Step';

export type TripEntry = ComAtprotoRepoListRecords.Record & { value: TripRecord };

type TripInput = TripRecord & { $type: 'app.beaglesteps.trip'; createdAt: string };
type StepInput = StepRecord & { $type: 'app.beaglesteps.step'; createdAt: string };

interface UserTripContextValue {
  trips: TripEntry[];
  steps: StepEntry[];
  isLoading: boolean;
  createTrip: (record: TripInput) => Promise<TripEntry>;
  createStep: (record: StepInput) => Promise<StepEntry>;
  deleteStep: (step: StepEntry) => Promise<void>;
}

const UserTripContext = createContext<UserTripContextValue | null>(null);

export function UserTripProvider({ children }: { children: ReactNode }) {
  const { agent, profile } = useAuth();
  const [trips, setTrips] = useState<TripEntry[]>([]);
  const [steps, setSteps] = useState<StepEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!agent || !profile) {
      setTrips([]);
      setSteps([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      agent.com.atproto.repo.listRecords({ repo: profile.did, collection: 'app.beaglesteps.trip' }),
      agent.com.atproto.repo.listRecords({ repo: profile.did, collection: 'app.beaglesteps.step' }),
    ]).then(([tripsRes, stepsRes]) => {
      if (cancelled) return;
      setTrips(tripsRes.data.records as TripEntry[]);
      setSteps(stepsRes.data.records as StepEntry[]);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [agent, profile]);

  const createTrip = useCallback(
    async (record: TripInput) => {
      if (!agent || !profile) throw new Error('Not authenticated');
      const { data } = await agent.com.atproto.repo.createRecord({
        repo: profile.did,
        collection: 'app.beaglesteps.trip',
        record,
      });
      const entry = { uri: data.uri, cid: data.cid, value: record } as TripEntry;
      setTrips((prev) => [entry, ...prev]);
      return entry;
    },
    [agent, profile],
  );

  const createStep = useCallback(
    async (record: StepInput) => {
      if (!agent || !profile) throw new Error('Not authenticated');
      const crossPostText = [record.title, record.body].filter(Boolean).join('\n\n').slice(0, 300);
      const crossPost = await agent.post({ text: crossPostText, createdAt: record.createdAt });
      const recordWithCrossPost: StepInput = { ...record, crossPostRef: crossPost };
      const { data } = await agent.com.atproto.repo.createRecord({
        repo: profile.did,
        collection: 'app.beaglesteps.step',
        record: recordWithCrossPost,
      });
      const entry = { uri: data.uri, cid: data.cid, value: recordWithCrossPost } as StepEntry;
      setSteps((prev) => [entry, ...prev]);
      return entry;
    },
    [agent, profile],
  );

  const deleteStep = useCallback(
    async (step: StepEntry) => {
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
    },
    [agent, profile],
  );

  return (
    <UserTripContext.Provider value={{ trips, steps, isLoading, createTrip, createStep, deleteStep }}>
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
