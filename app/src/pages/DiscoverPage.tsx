import { useState } from 'react';
import { trips } from '../data/trips';
import { TripCard } from '../components/TripCard';
import { MapSidebar } from '../components/MapSidebar';

type FeedTab = 'discover' | 'following' | 'travels';

export function DiscoverPage() {
  const [tab, setTab] = useState<FeedTab>('discover');


  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden border-r-[0.5px] border-line">
        <div className="flex shrink-0 items-center justify-center border-b-[0.5px] border-line px-5 py-2.5 font-voice text-[40px]">
          <span>
            BeagleSteps<span className="align-bottom text-[16px] text-primary">.social</span>
          </span>
        </div>
        <div className="flex shrink-0 border-b-[0.5px] border-line bg-surface-2 px-5">
          <button
            type="button"
            onClick={() => setTab('discover')}
            className={`-mb-[0.5px] cursor-pointer border-b-[4px] px-3.5 py-2.5 text-[15px] ${
              tab === 'discover'
                ? 'border-primary text-ink'
                : 'border-transparent text-ink-muted'
            }`}
          >
            Discover
          </button>
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
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
        {tab === 'following' && (
          <div className="flex-1 overflow-y-auto">
            <div className="px-5 py-10 text-center text-[13px] text-ink-muted">
              follow travels to see the last steps in this feed
            </div>
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

      <MapSidebar trips={trips} />
    </div>
  );
}
