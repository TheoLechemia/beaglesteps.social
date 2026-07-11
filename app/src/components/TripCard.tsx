import { Link } from 'react-router-dom';
import { IconCircleFilled, IconRoute } from '@tabler/icons-react';
import type { AppBskyActorDefs } from '@atproto/api';
import type { TripStatus } from '../types/trip';

interface TripCardProps {
  to: string;
  title: string;
  description?: string;
  status: TripStatus;
  stepsCount: number;
  authorProfile?: AppBskyActorDefs.ProfileViewDetailed;
}

export function TripCard({ to, title, description, status, stepsCount, authorProfile }: TripCardProps) {
  return (
    <Link
      to={to}
      className="flex cursor-pointer gap-2 border-b-[0.5px] border-line px-5 py-4 hover:bg-surface-1"
    >
      {authorProfile && (
        <Link
          to={`/profile/${authorProfile.handle}`}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        >
          <img src={authorProfile.avatar} className="h-8 w-8 rounded-full" alt="" />
        </Link>
      )}
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <div className="min-w-0 flex-1">
          {authorProfile && (
            <Link
              to={`/profile/${authorProfile.handle}`}
              onClick={(e) => e.stopPropagation()}
              className="mb-1 block text-[12px] text-ink-muted hover:underline"
            >
              {authorProfile.displayName && <span className="font-bold">{authorProfile.displayName}</span>}{authorProfile.displayName && ' - '}{authorProfile.handle}
            </Link>
          )}
          <div className="mb-1 font-voice text-[17px] leading-tight">{title}</div>
          {description && (
            <div className="mb-2 line-clamp-2 text-[13px] leading-normal text-ink-secondary">
              {description}
            </div>
          )}
          <span className="flex items-center gap-1 text-[11px] text-ink-muted">
            <IconRoute size={11} /> {stepsCount} steps
          </span>
        </div>
        <div className="flex shrink-0 items-center">
          {status === 'ongoing' ? (
            <span className="inline-flex items-center gap-[3px] rounded-full bg-success-subtle px-[7px] py-0.5 text-[10px] text-success">
              <IconCircleFilled size={7} /> ongoing
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full border-[0.5px] border-line bg-surface-1 px-[7px] py-0.5 text-[10px] text-ink-muted">
              ended
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
