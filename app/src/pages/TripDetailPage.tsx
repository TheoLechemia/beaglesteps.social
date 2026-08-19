import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { IconArrowLeft, IconChevronDown, IconPlus } from '@tabler/icons-react';
import { Step, type StepEntry } from '../components/Step';
import type { AppBskyActorDefs } from '@atproto/api';
import { useAuth } from '../context/AuthContext';
import { useUserTrip, type TripEntry } from '../context/UserTripContext';
import { getRepoAgent, publicAgent } from '../lib/atproto';
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

function formatDuration(startDate?: string, endDate?: string | null): number {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }

function tripEntryToTrip(entry: TripEntry, sortedSteps: StepEntry[], authorHandle: string): Trip {
  console.log("entry", entry.value);
  
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
    stats: { distance: '—', duration: String(formatDuration(entry.value.startDate, entry.value.endDate)), likes: 0 },
    followers: { count: 0, avatars: [] },
    mapPin: { top: '50%', left: '50%', color: '#1D9E75', label: entry.value.title },
    steps: sortedSteps.map((s, i) => stepEntryToTripStep(s, i, sortedSteps.length)),
  };
}

export function TripDetailPage() {
  const { handle, rkey } = useParams<{ handle: string; rkey: string }>();
  const { agent, profile } = useAuth();
  const readAgent = agent ?? publicAgent;
  const navigate = useNavigate();
  const { tripFollows, followTrip, unfollowTrip } = useUserTrip();
  const [activeStep, setActiveStep] = useState(0);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [remoteTrip, setRemoteTrip] = useState<TripEntry | null>(null);
  const [remoteSteps, setRemoteSteps] = useState<StepEntry[]>([]);
  const [authorProfile, setAuthorProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [isStepMenuOpen, setIsStepMenuOpen] = useState(false);
  const [isInlineMapVisible, setIsInlineMapVisible] = useState(true);
  const stepMenuRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inlineMapRef = useRef<HTMLDivElement>(null);
  const stickyHeaderRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [floatingMapLeft, setFloatingMapLeft] = useState<number | null>(null);

  useEffect(() => {
    const target = inlineMapRef.current;
    const root = scrollContainerRef.current;
    if (!target || !root) return;

    const observer = new IntersectionObserver(([entry]) => setIsInlineMapVisible(entry.isIntersecting), {
      root,
      threshold: 0,
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [isLoadingRemote, remoteTrip]);

  // The floating map's left edge tracks this page's own right boundary (the border
  // shared with the reserved column in App.tsx), so it never overlaps the feed
  // regardless of viewport width or whether the app is centered under max-w-6xl.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const updateLeft = () => setFloatingMapLeft(node.getBoundingClientRect().right);
    updateLeft();

    const observer = new ResizeObserver(updateLeft);
    observer.observe(node);
    window.addEventListener('resize', updateLeft);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateLeft);
    };
  }, [isLoadingRemote, remoteTrip]);

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
    if (!handle || !rkey) return;
    let cancelled = false;
    setIsLoadingRemote(true);

    readAgent.com.atproto.identity
      .resolveHandle({ handle })
      .then(async ({ data }) => {
        const repoAgent = await getRepoAgent(data.did);
        return Promise.all([
          repoAgent.com.atproto.repo.getRecord({ repo: data.did, collection: 'app.beaglesteps.trip', rkey }),
          repoAgent.com.atproto.repo.listRecords({ repo: data.did, collection: 'app.beaglesteps.step' }),
          readAgent.getProfile({ actor: data.did }),
        ]);
      })
      .then(([tripRes, stepsRes, profileRes]) => {
        if (cancelled) return;
        setRemoteTrip(tripRes.data as TripEntry);
        setRemoteSteps(stepsRes.data.records as StepEntry[]);
        setAuthorProfile(profileRes.data);
        setIsLoadingRemote(false);
      })
      .catch(() => {
        if (cancelled) return;
        setRemoteTrip(null);
        setAuthorProfile(null);
        setIsLoadingRemote(false);
      });

    return () => {
      cancelled = true;
    };
  }, [readAgent, handle, rkey]);

  // Memoized so the reference stays stable across scroll-driven re-renders — TripStepsRoute
  // rebuilds its markers/route layer whenever this array changes identity, which otherwise
  // made the route visibly flicker on every step scrolled into view.
  const sortedStepEntries = useMemo(() => {
    if (!remoteTrip) return [];
    const entrySteps = remoteSteps.filter((s) => s.value.tripRef?.uri === remoteTrip.uri);
    return [...entrySteps].sort((a, b) => (a.value.date ?? '').localeCompare(b.value.date ?? ''));
  }, [remoteTrip, remoteSteps]);

  const trip: Trip | undefined = remoteTrip
    ? tripEntryToTrip(remoteTrip, sortedStepEntries, handle ?? '')
    : undefined;

  // Tracks which step is currently in view while scrolling the feed, so both maps
  // can highlight its marker (deps are the raw fetched state, not the derived
  // sortedStepEntries array, so the observer isn't torn down on every scroll tick).
  useEffect(() => {
    const root = scrollContainerRef.current;
    if (!root) return;

    const entries = Object.entries(stepRefs.current).filter(
      (entry): entry is [string, HTMLDivElement] => entry[1] !== null
    );
    if (entries.length === 0) return;

    const observer = new IntersectionObserver(
      (observerEntries) => {
        const visible = observerEntries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? a : b));
        const match = entries.find(([, el]) => el === topMost.target);
        if (!match) return;
        const index = sortedStepEntries.findIndex((s) => s.uri === match[0]);
        if (index !== -1) setActiveStep(index);
      },
      { root, rootMargin: '0px 0px -60% 0px', threshold: 0 },
    );

    entries.forEach(([, el]) => observer.observe(el));
    return () => observer.disconnect();
  }, [remoteTrip, remoteSteps]);

  const isOwnTrip = !!profile && profile.handle === handle;
  const existingFollow = remoteTrip
    ? tripFollows.find((f) => f.value.subject.uri === remoteTrip.uri)
    : undefined;

  // Plain scrollIntoView({ block: 'start' }) tucks the step title right under the
  // sticky "Jump to step" bar, hiding it — offset by that bar's height instead.
  function scrollStepIntoView(uri: string) {
    const container = scrollContainerRef.current;
    const target = stepRefs.current[uri];
    if (!container || !target) return;
    const headerHeight = stickyHeaderRef.current?.offsetHeight ?? 0;
    const top =
      target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop - headerHeight - 12;
    container.scrollTo({ top, behavior: 'smooth' });
  }

  function handleMarkerClick(uri: string) {
    const index = sortedStepEntries.findIndex((entry) => entry.uri === uri);
    if (index === -1) return;
    setActiveStep(index);
    scrollStepIntoView(uri);
  }

  async function handleToggleFollow() {
    if (!remoteTrip || isFollowPending) return;
    if (!profile) {
      navigate('/login');
      return;
    }
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
  const activeStepUri = sortedStepEntries[activeStep]?.uri;

  return (
    <div ref={rootRef} className="flex flex-1 flex-col overflow-hidden">
      <Link
        to="/"
        className="flex shrink-0 items-center gap-1.5 border-b-[0.5px] border-line px-4 py-2.5 text-[13px] text-ink-muted hover:text-ink  bg-gray-100/80 backdrop-blur-xl"
      >
        <IconArrowLeft size={14} /> Back
      </Link>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
          <div ref={inlineMapRef} className="h-64 shrink-0">
            <Map className="h-full w-full">
              <TripStepsRoute steps={sortedStepEntries} activeStepUri={activeStepUri} onMarkerClick={handleMarkerClick} ></TripStepsRoute>
            </Map>
          </div>

          <div className="border-b-[0.5px] border-line p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className='flex gap-2'>
                {authorProfile && (
                  <Link to={`/profile/${authorProfile.handle}`} className="shrink-0">
                    <img src={authorProfile.avatar} className='rounded-full w-12 h-12' alt="" />
                  </Link>
                )}
                <div>
                  {authorProfile && (
                    <Link
                      to={`/profile/${authorProfile.handle}`}
                      className="mb-1 block text-[12px] text-ink-muted hover:underline"
                    >
                      {authorProfile.displayName && <span className="font-bold">{authorProfile.displayName}</span>}{authorProfile.displayName && ' - '}{authorProfile.handle}
                    </Link>
                  )}
                  <div className="font-voice text-[19px] leading-tight">{trip?.title}</div>
                </div>
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
            <div className="mb-2.5 grid grid-cols-2 overflow-hidden rounded-[10px] border-[0.5px] border-line">
              <div className="border-r-[0.5px] border-line px-2.5 py-2 text-center">
                <div className="text-[15px] font-medium">{trip?.stats.duration ?? '—'}</div>
                <div className="text-[10px] text-ink-muted">Days</div>

              </div>
              <div className="border-r-[0.5px] border-line px-2.5 py-2 text-center">
                <div className="text-[15px] font-medium">{trip?.steps.length ?? 0}</div>
                <div className="text-[10px] text-ink-muted">Steps</div>
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

          <div ref={stickyHeaderRef} className="sticky top-0 z-10 flex items-center justify-between border-b-[0.5px] border-line bg-gray-100/80 px-5 backdrop-blur-xl py-2">
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
                        scrollStepIntoView(entry.uri);
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
              className={index === activeStep ? 'bg-surface-2' : ''}
            >
              <Step step={entry} />
            </div>
          ))}
          </div>
        </div>
      </div>

      {!isInlineMapVisible && floatingMapLeft !== null && (
        <div
          className="fixed top-20 bottom-6 right-6 z-20 hidden overflow-hidden rounded-2xl border-[0.5px] border-line shadow-lg lg:block"
          style={{ left: floatingMapLeft + 12 }}
        >
          <Map className="h-full w-full">
            <TripStepsRoute steps={sortedStepEntries} activeStepUri={activeStepUri} onMarkerClick={handleMarkerClick} />
          </Map>
        </div>
      )}
    </div>
  );
}
