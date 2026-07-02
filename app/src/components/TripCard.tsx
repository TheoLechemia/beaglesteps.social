import { Link } from 'react-router-dom';
import { IconCircleFilled, IconHeart, IconMapPin, IconPhoto, IconRoute } from '@tabler/icons-react';
import type { Trip } from '../types/trip';
import { Avatar } from './Avatar';

interface TripCardProps {
  trip: Trip;
}

export function TripCard({ trip }: TripCardProps) {
  return (
    <Link
      to={`/trips/${trip.id}`}
      className="flex cursor-pointer gap-3.5 border-b-[0.5px] border-line px-5 py-4 hover:bg-surface-1"
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Avatar avatar={trip.author.avatar} />
          <span className="text-xs text-ink-muted">
            {trip.author.handle} · {trip.author.postedAgo}
          </span>
        </div>
        <div className="mb-1 font-voice text-[17px] leading-tight">{trip.title}</div>
        <div className="mb-2 line-clamp-2 text-[13px] leading-normal text-ink-secondary">
          {trip.description}
        </div>
        <div className="flex items-center gap-3.5">
          <span className="flex items-center gap-1 text-[11px] text-ink-muted">
            <IconMapPin size={11} /> {trip.subtitle}
          </span>
          <span className="flex items-center gap-1 text-[11px] text-ink-muted">
            <IconRoute size={11} /> {trip.steps.length} steps
          </span>
          <span className="flex items-center gap-1 text-[11px] text-ink-muted">
            <IconHeart size={11} /> {trip.stats.likes}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        {trip.status === 'ongoing' ? (
          <span className="inline-flex items-center gap-[3px] rounded-full bg-surface-success px-[7px] py-0.5 text-[10px] text-ink-success">
            <IconCircleFilled size={7} /> ongoing
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full border-[0.5px] border-line bg-surface-1 px-[7px] py-0.5 text-[10px] text-ink-muted">
            ended
          </span>
        )}
        <div className="flex h-[50px] w-[68px] items-center justify-center rounded-lg border-[0.5px] border-line bg-surface-1 text-ink-muted">
          <IconPhoto size={20} />
        </div>
      </div>
    </Link>
  );
}
