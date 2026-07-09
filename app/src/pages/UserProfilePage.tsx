import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useUserTrip } from "../context/UserTripContext";
import { Step } from "../components/Step";
import { TripCard } from "../components/TripCard";

export function UserProfilePage () {
    const { profile } = useAuth()
    const { trips, steps, deleteStep } = useUserTrip();
    const [tab, setTab] = useState('steps');
    console.log("laaa", profile);
    

    return (
        <div className="flex flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden border-r-[0.5px] border-line">
            <div className="relative">
                <div className="h-30 bg-surface-1"></div>
                <img
                    src={profile?.avatar}
                    alt=""
                    className="absolute left-4 top-full h-15 w-15 -translate-y-1/2 rounded-full border-4 border-surface-0 object-cover"
                />
            </div>
            <div className="pt-10 px-4">
                <div className="font-bold text-[25px]">
                 {profile?.displayName}
                </div>
                <div className="text-ink-muted">
                 @{profile?.handle}
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
                    <Step key={step.uri} step={step} authorHandle={profile?.handle ?? ''} onDelete={deleteStep} />
                ))}
                {tab === 'trips' && trips.map((trip) => (
                    <TripCard
                        key={trip.uri}
                        to={`/profile/${profile?.handle}/trip/${trip.uri.split('/').pop()}`}
                        title={trip.value.title}
                        description={trip.value.description}
                        status={trip.value.endDate ? 'ended' : 'ongoing'}
                        stepsCount={steps.filter((s) => s.value.tripRef?.uri === trip.uri).length}
                    />
                ))}
            </div>

        </div>
        <div className="w-60 shrink-0" aria-hidden />
    </div>
    );
}

