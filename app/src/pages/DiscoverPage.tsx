import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { TripCard } from '../components/TripCard';
import { Step, type StepEntry } from '../components/Step';
import { useAuth } from '../context/AuthContext';
import { useUserTrip } from '../context/UserTripContext';
import { getRepoAgent } from '../lib/atproto';
import type { TripEntry } from '../context/UserTripContext';
import { type AppBskyActorDefs } from '@atproto/api';
import logo from '../assets/logo3.jpeg';

type FeedTab = 'following' | 'travels';

interface FollowedTrip {
  trip: TripEntry;
  profile: AppBskyActorDefs.ProfileViewDetailed;
  steps: StepEntry[];
}

export function DiscoverPage() {
  const [tab, setTab] = useState<FeedTab>('following');
  const { agent, isAuthenticated } = useAuth();
  const { tripFollows } = useUserTrip();
  const [followedTrips, setFollowedTrips] = useState<FollowedTrip[]>([]);
  const [isLoadingFollowed, setIsLoadingFollowed] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container) return;

    const handleScroll = () => {
      setIsScrolled(container.scrollTop > 20);
    };

    container.addEventListener('scroll', handleScroll);

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

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
          repoAgent.com.atproto.repo.getRecord({
            repo: did,
            collection: 'app.beaglesteps.trip',
            rkey,
          }),
          repoAgent.com.atproto.repo.listRecords({
            repo: did,
            collection: 'app.beaglesteps.step',
          }),
          agent.getProfile({ actor: did }),
        ]);

        const trip = tripRes.data as TripEntry;

        const steps = (stepsRes.data.records as StepEntry[]).filter(
          (s) => s.value.tripRef?.uri === trip.uri,
        );

        return {
          trip,
          steps,
          profile: profileRes.data,
        };
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
    .flatMap(({ trip, steps, profile }) =>
      steps.map((step) => ({
        step,
        profile,
        tripTitle: trip.value.title,
      })),
    )
    .sort((a, b) =>
      (a.step.value.date ?? '').localeCompare(b.step.value.date ?? ''),
    );

  return (
    <div className="flex flex-1 overflow-hidden">
      <div
        ref={scrollContainerRef}
        className="flex min-w-0 flex-1 flex-col overflow-y-auto"
      >
        {/* Sticky Header + Navigation */}
        <div
          className={`sticky top-0 z-20 border-b-[0.5px] border-line bg-white/80 backdrop-blur-xl transition-all duration-300 ${
            isScrolled ? 'h-[106px]' : 'h-[128px]'
          }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-center transition-all duration-300 ${
              isScrolled ? 'h-14' : 'h-20'
            }`}
          >
            <div className="flex items-center justify-center">
              <img
                src={logo}
                alt="Beagle Steps"
                className={`rounded-full object-cover transition-all duration-300 ${
                  isScrolled ? 'w-15' : 'w-15'
                }`}
              />

              <span
                className={`ml-2 flex items-end overflow-hidden font-brand font-extrabold tracking-tighter transition-all duration-300 ${
                  isScrolled
                    ? 'max-w-0 opacity-0'
                    : 'max-w-[300px] opacity-100'
                }`}
              >
                <span className="text-[32px] leading-none">
                  beagle
                  <span className="inline-block border-b-8 border-primary pb-0 leading-none">
                    steps
                  </span>
                </span>

                <span className="text-[13px] text-primary">
                  .social
                </span>
              </span>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex h-[48px] border-b-[0.5px] border-line px-5">
            <button
              type="button"
              onClick={() => setTab('following')}
              className={`-mb-[0.5px] cursor-pointer border-b-[4px] px-3.5 py-2.5 text-[15px] text-ink ${
                tab === 'following'
                  ? 'border-primary font-bold'
                  : 'border-transparent'
              }`}
            >
              Following
            </button>

            <button
              type="button"
              onClick={() => setTab('travels')}
              className={`-mb-[0.5px] cursor-pointer border-b-[4px] px-3.5 py-2.5 text-[15px] ${
                tab === 'travels'
                  ? 'border-primary font-bold'
                  : 'border-transparent'
              }`}
            >
              Travels
            </button>
          </div>
        </div>

        {/* Travels */}
        {tab === 'travels' && (
          <div>
            {isLoadingFollowed && (
              <div className="px-5 py-10 text-center text-[13px] text-ink-muted">
                Loading...
              </div>
            )}

            {!isLoadingFollowed && followedTrips.length === 0 && (
              <div className="px-5 py-10 text-center text-[13px] text-ink-muted">
                Follow a trip to see it here.
              </div>
            )}

            {followedTrips.map(({ trip, profile, steps }) => (
              <TripCard
                key={trip.uri}
                to={`/profile/${profile.handle}/trip/${trip.uri.split('/').pop()}`}
                title={trip.value.title}
                description={trip.value.description}
                status={trip.value.endDate ? 'ended' : 'ongoing'}
                stepsCount={steps.length}
                authorProfile={profile}
              />
            ))}
          </div>
        )}

        {/* Following */}
        {tab === 'following' && (
          <div>
            {!isAuthenticated && (
              <div className="px-5 py-10 text-center text-[13px] text-ink-muted">
                <Link to="/login" className="text-primary">
                  Log in
                </Link>{' '}
                to see the trips you follow.
              </div>
            )}

            {isAuthenticated && isLoadingFollowed && (
              <div className="px-5 py-10 text-center text-[13px] text-ink-muted">
                Loading...
              </div>
            )}

            {isAuthenticated &&
              !isLoadingFollowed &&
              followedSteps.length === 0 && (
                <div className="px-5 py-10 text-center text-[13px] text-ink-muted">
                  follow travels to see the last steps in this feed
                </div>
              )}

            {isAuthenticated &&
              followedSteps.map(({ step, profile, tripTitle }) => (
                <Step
                  key={step.uri}
                  step={step}
                  authorProfile={profile}
                  tripTitle={tripTitle}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}