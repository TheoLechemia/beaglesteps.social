import { Link } from 'react-router-dom';
import { IconCircleFilled, IconRoute } from '@tabler/icons-react';
import type { TripStatus } from '../types/trip';

interface TripCardProps {
  to: string;
  title: string;
  description?: string;
  status: TripStatus;
  stepsCount: number;
}

export function TripCard({ to, title, description, status, stepsCount }: TripCardProps) {
  return (
    <Link
      to={to}
      className="flex cursor-pointer items-center gap-3.5 border-b-[0.5px] border-line px-5 py-4 hover:bg-surface-1"
    >
      <div className="min-w-0 flex-1">
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
    </Link>
  );
}
