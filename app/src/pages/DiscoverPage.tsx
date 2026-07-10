import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TripCard } from '../components/TripCard';
import { MapSidebar } from '../components/MapSidebar';
import { Step, type StepEntry } from '../components/Step';
import { useAuth } from '../context/AuthContext';
import { useUserTrip } from '../context/UserTripContext';
import { getRepoAgent } from '../lib/atproto';
import type { TripEntry } from '../context/UserTripContext';

type FeedTab = 'discover' | 'following' | 'travels';

const MAP_PIN_COLORS = ['#1D9E75', '#993C1D', '#534AB7', '#B7862F'];

interface FollowedTrip {
  trip: TripEntry;
  handle: string;
  steps: StepEntry[];
}

export function DiscoverPage() {
  const [tab, setTab] = useState<FeedTab>('following');
  const { agent, isAuthenticated } = useAuth();
  const { tripFollows } = useUserTrip();
  const [followedTrips, setFollowedTrips] = useState<FollowedTrip[]>([]);
  const [isLoadingFollowed, setIsLoadingFollowed] = useState(false);

  useEffect(() => {
    if (!agent || tripFollows.length === 0) {
      setFollowedTrips([]);
      return;
    }

    let cancelled = false;
    setIsLoadingFollowed(true);

    Promise.all(
      tripFollows.map(async (follow) => {
        const { uri } = follow.value.subject;
        const did = uri.split('/')[2];
        const rkey = uri.split('/').pop()!;
        const repoAgent = await getRepoAgent(did);
        const [tripRes, stepsRes, profileRes] = await Promise.all([
          repoAgent.com.atproto.repo.getRecord({ repo: did, collection: 'app.beaglesteps.trip', rkey }),
          repoAgent.com.atproto.repo.listRecords({ repo: did, collection: 'app.beaglesteps.step' }),
          agent.getProfile({ actor: did }),
        ]);
        const trip = tripRes.data as TripEntry;
        const steps = (stepsRes.data.records as StepEntry[]).filter(
          (s) => s.value.tripRef?.uri === trip.uri,
        );
        return { trip, steps, handle: profileRes.data.handle };
      }),
    )
      .then((results) => {
        if (cancelled) return;
        setFollowedTrips(results);
        setIsLoadingFollowed(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFollowedTrips([]);
        setIsLoadingFollowed(false);
      });

    return () => {
      cancelled = true;
    };
  }, [agent, tripFollows]);

  const followedSteps = followedTrips
    .flatMap(({ steps, handle }) => steps.map((step) => ({ step, handle })))
    .sort((a, b) => (b.step.value.date ?? '').localeCompare(a.step.value.date ?? ''));

  const mapPins = followedTrips.map(({ trip }, i) => ({
    id: trip.uri,
    mapPin: {
      top: `${20 + ((i * 17) % 60)}%`,
      left: `${15 + ((i * 23) % 70)}%`,
      color: MAP_PIN_COLORS[i % MAP_PIN_COLORS.length],
      label: trip.value.title,
    },
  }));

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden border-r-[0.5px] border-line">
        <div className="flex shrink-0 items-center justify-center border-b-[0.5px] border-line px-5 py-2.5 font-voice text-[40px]">
          <span>
            BeagleSteps<span className="align-bottom text-[16px] text-primary">.social</span>
          </span>
        </div>
        <div className="flex shrink-0 border-b-[0.5px] border-line bg-surface-2 px-5">
          {/* <button
            type="button"
            onClick={() => setTab('discover')}
            className={`-mb-[0.5px] cursor-pointer border-b-[4px] px-3.5 py-2.5 text-[15px] ${
              tab === 'discover'
                ? 'border-primary text-ink'
                : 'border-transparent text-ink-muted'
            }`}
          >
            Discover
          </button> */}
          <button
            type="button"
            onClick={() => setTab('following')}
            className={`-mb-[0.5px] cursor-pointer border-b-[4px] px-3.5 py-2.5 text-[15px] ${
              tab === 'following'
                ? 'border-primary text-ink'
                : 'border-transparent text-ink-muted'
            }`}
          >
            Following
          </button>
          <button
            type="button"
            onClick={() => setTab('travels')}
            className={`-mb-[0.5px] cursor-pointer border-b-[4px] px-3.5 py-2.5 text-[15px] ${
              tab === 'travels'
                ? 'border-primary text-ink'
                : 'border-transparent text-ink-muted'
            }`}
          >
            Travels
          </button>
        </div>

        {tab === 'travels' && (
          <div className="flex-1 overflow-y-auto">
            {isLoadingFollowed && (
              <div className="px-5 py-10 text-center text-[13px] text-ink-muted">Loading...</div>
            )}
            {!isLoadingFollowed && followedTrips.length === 0 && (
              <div className="px-5 py-10 text-center text-[13px] text-ink-muted">
                Follow a trip to see it here.
              </div>
            )}
            {followedTrips.map(({ trip, handle, steps }) => (
              <TripCard
                key={trip.uri}
                to={`/profile/${handle}/trip/${trip.uri.split('/').pop()}`}
                title={trip.value.title}
                description={trip.value.description}
                status={trip.value.endDate ? 'ended' : 'ongoing'}
                stepsCount={steps.length}
              />
            ))}
          </div>
        )}
        {tab === 'following' && (
          <div className="flex-1 overflow-y-auto">
            {!isAuthenticated && (
              <div className="px-5 py-10 text-center text-[13px] text-ink-muted">
                <Link to="/login" className="text-primary">Log in</Link> to see the trips you follow.
              </div>
            )}
            {isAuthenticated && isLoadingFollowed && (
              <div className="px-5 py-10 text-center text-[13px] text-ink-muted">Loading...</div>
            )}
            {isAuthenticated && !isLoadingFollowed && followedSteps.length === 0 && (
              <div className="px-5 py-10 text-center text-[13px] text-ink-muted">
                follow travels to see the last steps in this feed
              </div>
            )}
            {isAuthenticated && followedSteps.map(({ step, handle }) => (
              <Step key={step.uri} step={step} authorHandle={handle} />
            ))}
          </div>
        )}
        {tab === 'discover' && (
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 py-10 text-center text-[13px] text-ink-muted">
              Last steps in the athmosphere
            </div>
          </div>
        )}
      </div>

      <MapSidebar trips={mapPins} />
    </div>
  );
}
