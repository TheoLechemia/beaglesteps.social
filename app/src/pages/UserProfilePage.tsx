import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { AppBskyActorDefs } from '@atproto/api';
import { useAuth } from "../context/AuthContext";
import { useUserTrip, type TripEntry } from "../context/UserTripContext";
import { Step, type StepEntry } from "../components/Step";
import { TripCard } from "../components/TripCard";
import { getRepoAgent, publicAgent } from "../lib/atproto";

export function UserProfilePage () {
    const { handle } = useParams<{ handle: string }>();
    const { agent, profile: ownProfile } = useAuth();
    const readAgent = agent ?? publicAgent;
    const { trips: ownTrips, steps: ownSteps, deleteStep } = useUserTrip();
    const [tab, setTab] = useState('steps');

    const isOwnProfile = !!ownProfile && ownProfile.handle === handle;

    const [remoteProfile, setRemoteProfile] = useState<AppBskyActorDefs.ProfileViewDetailed | null>(null);
    const [remoteTrips, setRemoteTrips] = useState<TripEntry[]>([]);
    const [remoteSteps, setRemoteSteps] = useState<StepEntry[]>([]);
    const [isLoadingRemote, setIsLoadingRemote] = useState(false);

    useEffect(() => {
        if (isOwnProfile || !handle) return;
        let cancelled = false;
        setIsLoadingRemote(true);

        readAgent.com.atproto.identity
            .resolveHandle({ handle })
            .then(async ({ data }) => {
                const repoAgent = await getRepoAgent(data.did);
                return Promise.all([
                    readAgent.getProfile({ actor: data.did }),
                    repoAgent.com.atproto.repo.listRecords({ repo: data.did, collection: 'app.beaglesteps.trip' }),
                    repoAgent.com.atproto.repo.listRecords({ repo: data.did, collection: 'app.beaglesteps.step' }),
                ]);
            })
            .then(([profileRes, tripsRes, stepsRes]) => {
                if (cancelled) return;
                setRemoteProfile(profileRes.data);
                setRemoteTrips(tripsRes.data.records as TripEntry[]);
                setRemoteSteps(stepsRes.data.records as StepEntry[]);
                setIsLoadingRemote(false);
            })
            .catch(() => {
                if (cancelled) return;
                setRemoteProfile(null);
                setIsLoadingRemote(false);
            });

        return () => {
            cancelled = true;
        };
    }, [isOwnProfile, handle, readAgent]);

    const profile = isOwnProfile ? ownProfile : remoteProfile;
    const trips = isOwnProfile ? ownTrips : remoteTrips;
    const steps = isOwnProfile ? ownSteps : remoteSteps;

    if (!isOwnProfile && isLoadingRemote) {
        return (
            <div className="flex flex-1 items-center justify-center p-10 text-[13px] text-ink-muted">
                Loading profile...
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-1 items-center justify-center p-10 text-[13px] text-ink-muted">
                Profile not found.
            </div>
        );
    }

    return (
        <div className="flex flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            <div className="relative">
                <div className="h-30 bg-surface-1"></div>
                <img
                    src={profile.avatar}
                    alt=""
                    className="absolute left-4 top-full h-15 w-15 -translate-y-1/2 rounded-full border-4 border-surface-0 object-cover"
                />
            </div>
            <div className="pt-10 px-4">
                <div className="font-bold text-[25px]">
                 {profile.displayName}
                </div>
                <div className="text-ink-muted">
                 @{profile.handle}
                </div>
            </div>

            <div className="flex shrink-0 border-b-[0.5px] border-line bg-surface-2 px-5">
                <button
                        type="button"
                        onClick={() => setTab('steps')}
                        className={`-mb-[0.5px] cursor-pointer border-b-[4px] px-3.5 py-2.5 text-[15px] ${
                        tab === 'steps'
                            ? 'border-primary text-ink'
                            : 'border-transparent text-ink-muted'
                        }`}
                    >
                        Steps
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('trips')}
                        className={`-mb-[0.5px] cursor-pointer border-b-[4px] px-3.5 py-2.5 text-[15px] ${
                        tab === 'trips'
                            ? 'border-primary text-ink'
                            : 'border-transparent text-ink-muted'
                        }`}
                    >
                        Trips
                    </button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {tab === 'steps' && steps.map((step) => (
                    <Step key={step.uri} step={step} authorProfile={profile} onDelete={isOwnProfile ? deleteStep : undefined} />
                ))}
                {tab === 'trips' && trips.map((trip) => (
                    <TripCard
                        key={trip.uri}
                        to={`/profile/${profile.handle}/trip/${trip.uri.split('/').pop()}`}
                        title={trip.value.title}
                        description={trip.value.description}
                        status={trip.value.endDate ? 'ended' : 'ongoing'}
                        stepsCount={steps.filter((s) => s.value.tripRef?.uri === trip.uri).length}
                        authorProfile={profile}
                    />
                ))}
            </div>

        </div>
    </div>
    );
}
