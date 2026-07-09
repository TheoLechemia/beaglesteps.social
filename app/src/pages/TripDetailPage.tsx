import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { IconArrowLeft, IconChevronDown, IconPlus } from '@tabler/icons-react';
import { TripStepMap } from '../components/TripStepMap';
import { Step, type StepEntry } from '../components/Step';
import { useAuth } from '../context/AuthContext';
import { useUserTrip, type TripEntry } from '../context/UserTripContext';
import { getRepoAgent } from '../lib/atproto';
import type { Trip, TripStep } from '../types/trip';
import { Map } from '../components/Map';
import { TripStepsRoute } from '../components/TripStepsRoute';

function stepEntryToTripStep(entry: StepEntry, index: number, total: number): TripStep {
  const { title, body, date, location, address, photos } = entry.value;
  const locationLabel = address?.locality
    ? [address.locality, address.country].filter(Boolean).join(', ')
    : location
      ? `${location.latitude}, ${location.longitude}`
      : '';
  const progress = total > 1 ? index / (total - 1) : 0;

  return {
    id: entry.uri,
    title: title || 'Untitled step',
    date: date ?? '',
    location: locationLabel,
    stats: [],
    description: body ?? '',
    photos: photos?.length ?? 0,
    routePoint: { x: 30 + progress * 340, y: 100 },
    mapPosition: { top: '50%', left: `${10 + progress * 80}%` },
  };
}

function tripEntryToTrip(entry: TripEntry, sortedSteps: StepEntry[], authorHandle: string): Trip {
  return {
    id: entry.uri,
    title: entry.value.title,
    subtitle: `@${authorHandle}`,
    description: entry.value.description ?? '',
    author: {
      handle: authorHandle,
      postedAgo: '',
      avatar: { initials: authorHandle.slice(0, 2).toUpperCase(), bg: '#E1F5EE', color: '#0F6E56' },
    },
    status: entry.value.endDate ? 'ended' : 'ongoing',
    stats: { distance: '—', duration: '—', likes: 0 },
    followers: { count: 0, avatars: [] },
    mapPin: { top: '50%', left: '50%', color: '#1D9E75', label: entry.value.title },
    steps: sortedSteps.map((s, i) => stepEntryToTripStep(s, i, sortedSteps.length)),
  };
}

export function TripDetailPage() {
  const { handle, rkey } = useParams<{ handle: string; rkey: string }>();
  const { agent, profile } = useAuth();
  const { tripFollows, followTrip, unfollowTrip } = useUserTrip();
  const [activeStep, setActiveStep] = useState(0);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [remoteTrip, setRemoteTrip] = useState<TripEntry | null>(null);
  const [remoteSteps, setRemoteSteps] = useState<StepEntry[]>([]);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [isStepMenuOpen, setIsStepMenuOpen] = useState(false);
  const stepMenuRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!isStepMenuOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (stepMenuRef.current && !stepMenuRef.current.contains(e.target as Node)) {
        setIsStepMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isStepMenuOpen]);

  useEffect(() => {
    if (!agent || !handle || !rkey) return;
    let cancelled = false;
    setIsLoadingRemote(true);

    agent.com.atproto.identity
      .resolveHandle({ handle })
      .then(async ({ data }) => {
        const repoAgent = await getRepoAgent(data.did);
        return Promise.all([
          repoAgent.com.atproto.repo.getRecord({ repo: data.did, collection: 'app.beaglesteps.trip', rkey }),
          repoAgent.com.atproto.repo.listRecords({ repo: data.did, collection: 'app.beaglesteps.step' }),
        ]);
      })
      .then(([tripRes, stepsRes]) => {
        if (cancelled) return;
        setRemoteTrip(tripRes.data as TripEntry);
        setRemoteSteps(stepsRes.data.records as StepEntry[]);
        setIsLoadingRemote(false);
      })
      .catch(() => {
        if (cancelled) return;
        setRemoteTrip(null);
        setIsLoadingRemote(false);
      });

    return () => {
      cancelled = true;
    };
  }, [agent, handle, rkey]);

  let trip: Trip | undefined;
  let sortedStepEntries: StepEntry[] = [];
  if (remoteTrip) {
    const entrySteps = remoteSteps.filter((s) => s.value.tripRef?.uri === remoteTrip.uri);
    sortedStepEntries = [...entrySteps].sort((a, b) =>
      (a.value.date ?? '').localeCompare(b.value.date ?? '')
    );
    trip = tripEntryToTrip(remoteTrip, sortedStepEntries, handle ?? '');
  }

  const isOwnTrip = !!profile && profile.handle === handle;
  const existingFollow = remoteTrip
    ? tripFollows.find((f) => f.value.subject.uri === remoteTrip.uri)
    : undefined;

  function handleMarkerClick(uri: string) {
    console.log("asse la ???");
    
    const index = sortedStepEntries.findIndex((entry) => entry.uri === uri);
    if (index === -1) return;
    setActiveStep(index);
    stepRefs.current[uri]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function handleToggleFollow() {
    if (!remoteTrip || isFollowPending) return;
    setIsFollowPending(true);
    try {
      if (existingFollow) {
        await unfollowTrip(existingFollow);
      } else {
        await followTrip({ uri: remoteTrip.uri, cid: remoteTrip.cid });
      }
    } finally {
      setIsFollowPending(false);
    }
  }

  if (!trip && !isLoadingRemote) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-ink-muted">
        <p className="text-[13px]">Trip not found.</p>
        <Link to="/" className="text-[13px] text-primary">
          Back to Discover
        </Link>
      </div>
    );
  }

  if (trip && trip.steps.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-ink-muted">
        <p className="text-[13px]">This trip has no steps yet.</p>
        <Link to="/" className="text-[13px] text-primary">
          Back to Discover
        </Link>
      </div>
    );
  }

  const feedSteps = sortedStepEntries.map((entry, index) => ({ entry, index })).reverse();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Link
        to="/"
        className="flex shrink-0 items-center gap-1.5 border-b-[0.5px] border-line bg-surface-2 px-4 py-2.5 text-[13px] text-ink-muted hover:text-ink"
      >
        <IconArrowLeft size={14} /> Back
      </Link>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <Map>
            <TripStepsRoute steps={remoteSteps} onMarkerClick={handleMarkerClick} ></TripStepsRoute>
          </Map>

          <div className="flex-1 overflow-y-auto">
          <div className="border-b-[0.5px] border-line p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <div className="font-voice text-[19px] leading-tight">{trip?.title}</div>
                <div className="mb-2.5 text-xs text-ink-muted">{trip?.subtitle}</div>
              </div>
              {!isOwnTrip && (
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  disabled={isFollowPending}
                  className={`flex shrink-0 cursor-pointer items-center gap-1 rounded-full border-[0.5px] px-3.5 py-1 text-[13px] font-bold disabled:opacity-60 ${
                    existingFollow
                      ? 'bg-surface-2'
                      : 'bg-primary text-white' 
                  }`}
                >
                  {!existingFollow && <IconPlus size={20} />}
                  {existingFollow ? 'Unfollow' : 'Follow trip'}
                </button>
              )}
            </div>
            <div className="mb-2.5 grid grid-cols-4 overflow-hidden rounded-[10px] border-[0.5px] border-line">
              <div className="border-r-[0.5px] border-line px-2.5 py-2 text-center">
                <div className="text-[15px] font-medium">{trip?.stats.distance ?? '—'}</div>
                <div className="text-[10px] text-ink-muted">Distance</div>
              </div>
              <div className="border-r-[0.5px] border-line px-2.5 py-2 text-center">
                <div className="text-[15px] font-medium">{trip?.stats.duration ?? '—'}</div>
                <div className="text-[10px] text-ink-muted">Time</div>
              </div>
              <div className="border-r-[0.5px] border-line px-2.5 py-2 text-center">
                <div className="text-[15px] font-medium">{trip?.steps.length ?? 0}</div>
                <div className="text-[10px] text-ink-muted">Steps</div>
              </div>
              <div className="px-2.5 py-2 text-center">
                <div className="text-[15px] font-medium">{trip?.stats.likes ?? 0}</div>
                <div className="text-[10px] text-ink-muted">Likes</div>
              </div>
            </div>
            <div className="mb-2 text-[13px] leading-relaxed text-ink-secondary">
              {trip?.description}
            </div>
            {/* <div className="flex items-center gap-2 text-[11px] text-ink-muted">
              <div className="flex">
                {trip.followers.avatars.map((avatar) => (
                  <Avatar
                    key={avatar.initials}
                    avatar={avatar}
                    size={18}
                    fontSize={7}
                    className="-mr-1.5 border-2 border-surface-2"
                  />
                ))}
              </div>
              <span className="ml-2">Followed by {trip.followers.count} hikers</span>
            </div> */}
          </div>

          <div className="flex items-center justify-between border-b-[0.5px] border-line bg-surface-2 px-4 py-2">
            <span className="text-[13px] text-ink-muted">{trip?.steps.length ?? 0} steps</span>
            <div className="relative" ref={stepMenuRef}>
              <button
                type="button"
                onClick={() => setIsStepMenuOpen((open) => !open)}
                className="flex cursor-pointer items-center gap-1 text-[13px] font-medium"
              >
                Jump to step <IconChevronDown size={12} />
              </button>
              {isStepMenuOpen && (
                <div className="absolute right-0 top-6 z-10 max-h-60 w-48 overflow-y-auto rounded-md border-[0.5px] border-line bg-surface-0 shadow-lg">
                  {feedSteps.map(({ entry, index }) => (
                    <button
                      key={entry.uri}
                      type="button"
                      onClick={() => {
                        setActiveStep(index);
                        setIsStepMenuOpen(false);
                        stepRefs.current[entry.uri]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className={`block w-full truncate px-3 py-2 text-left text-[13px] cursor-pointer hover:bg-surface-1 ${
                        index === activeStep ? 'font-medium text-ink' : 'text-ink-secondary'
                      }`}
                    >
                      {index + 1}. {entry.value.title || 'Untitled step'}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {feedSteps.map(({ entry, index }) => (
            <div
              key={entry.uri}
              ref={(el) => {
                stepRefs.current[entry.uri] = el;
              }}
              className={index === activeStep ? 'bg-surface-3' : ''}
            >
              <Step step={entry} authorHandle={handle ?? ''} />
            </div>
          ))}
          </div>
        </div>
      </div>
    </div>
  );
}
