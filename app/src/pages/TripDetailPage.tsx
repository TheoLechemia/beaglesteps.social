import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  IconArrowLeft,
  IconCalendar,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconMapPin,
  IconPhoto,
} from '@tabler/icons-react';
import { getTripById } from '../data/trips';
import { Avatar } from '../components/Avatar';
import { TripStepMap } from '../components/TripStepMap';
import { StepMapPins } from '../components/StepMapPins';

export function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const trip = id ? getTripById(id) : undefined;
  const [activeStep, setActiveStep] = useState(0);

  if (!trip) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-10 text-ink-muted">
        <p className="text-[13px]">Trip not found.</p>
        <Link to="/" className="text-[13px] text-primary">
          Back to Discover
        </Link>
      </div>
    );
  }

  const step = trip.steps[activeStep];
  const visiblePhotos = Math.min(step.photos, 3);
  const extraPhotos = step.photos - 2;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Link
        to="/"
        className="flex shrink-0 items-center gap-1.5 border-b-[0.5px] border-line bg-surface-2 px-4 py-2.5 text-[13px] text-ink-muted hover:text-ink"
      >
        <IconArrowLeft size={14} /> Back
      </Link>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden border-r-[0.5px] border-line">
          <TripStepMap steps={trip.steps} activeIndex={activeStep} />

          <div className="shrink-0 border-b-[0.5px] border-line p-3">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div>
                <div className="font-voice text-[19px] leading-tight">{trip.title}</div>
                <div className="mb-2.5 text-xs text-ink-muted">{trip.subtitle}</div>
              </div>
              <button
                type="button"
                className="shrink-0 rounded border-[0.5px] border-line px-2.5 py-1 text-[11px]"
              >
                Follow trip
              </button>
            </div>
            <div className="mb-2.5 grid grid-cols-4 overflow-hidden rounded-[10px] border-[0.5px] border-line">
              <div className="border-r-[0.5px] border-line px-2.5 py-2 text-center">
                <div className="text-[15px] font-medium">{trip.stats.distance}</div>
                <div className="text-[10px] text-ink-muted">Distance</div>
              </div>
              <div className="border-r-[0.5px] border-line px-2.5 py-2 text-center">
                <div className="text-[15px] font-medium">{trip.stats.duration}</div>
                <div className="text-[10px] text-ink-muted">Time</div>
              </div>
              <div className="border-r-[0.5px] border-line px-2.5 py-2 text-center">
                <div className="text-[15px] font-medium">{trip.steps.length}</div>
                <div className="text-[10px] text-ink-muted">Steps</div>
              </div>
              <div className="px-2.5 py-2 text-center">
                <div className="text-[15px] font-medium">{trip.stats.likes}</div>
                <div className="text-[10px] text-ink-muted">Likes</div>
              </div>
            </div>
            <div className="mb-2 text-[13px] leading-relaxed text-ink-secondary">
              {trip.description}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-ink-muted">
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
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-between border-b-[0.5px] border-line bg-surface-2 px-4 py-2">
            <button
              type="button"
              disabled={activeStep === 0}
              onClick={() => setActiveStep((s) => s - 1)}
              className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-[0.5px] border-line text-ink-secondary disabled:pointer-events-none disabled:opacity-30 hover:bg-surface-1 hover:text-ink"
            >
              <IconChevronLeft size={13} />
            </button>
            <div className="flex items-center gap-1 text-[13px] font-medium">
              Step {activeStep + 1} of {trip.steps.length} <IconChevronDown size={12} />
            </div>
            <button
              type="button"
              disabled={activeStep === trip.steps.length - 1}
              onClick={() => setActiveStep((s) => s + 1)}
              className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-[0.5px] border-line text-ink-secondary disabled:pointer-events-none disabled:opacity-30 hover:bg-surface-1 hover:text-ink"
            >
              <IconChevronRight size={13} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-3.5">
              <div className="font-voice text-[17px] leading-tight">{step.title}</div>
              <div className="mb-2.5 flex items-center gap-1.5 text-xs text-ink-muted">
                <IconCalendar size={11} />
                {step.date}
                <span className="ml-1 inline-flex items-center gap-1">
                  <IconMapPin size={11} />
                  {step.location}
                </span>
              </div>
              <div className="mb-3 grid grid-cols-3 overflow-hidden rounded-lg border-[0.5px] border-line">
                {step.stats.map((stat, i) => (
                  <div
                    key={i}
                    className="border-r-[0.5px] border-line px-2.5 py-2 last:border-r-0"
                  >
                    <div className="text-[13px] font-medium">{stat.value}</div>
                    <div className="text-[10px] text-ink-muted">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="mb-3 text-[13px] leading-relaxed text-ink-secondary">
                {step.description}
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: visiblePhotos }).map((_, i) => (
                  <div
                    key={i}
                    className="relative flex h-[72px] flex-1 items-center justify-center overflow-hidden rounded-lg border-[0.5px] border-line bg-surface-1 text-ink-muted"
                  >
                    <IconPhoto size={20} />
                    {i === 2 && step.photos > 3 && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/32 text-[13px] font-medium text-white">
                        +{extraPhotos}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative w-[220px] shrink-0 overflow-hidden">
          <div className="absolute inset-0 bg-[#dde8d4]" />
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="absolute inset-y-0 w-[2px] bg-white/50" style={{ left: '45%' }} />
          <div className="absolute inset-x-0 h-[2px] bg-white/50" style={{ top: '55%' }} />
          <StepMapPins steps={trip.steps} activeIndex={activeStep} onSelect={setActiveStep} />
          <div className="absolute bottom-1.5 right-2 text-[9px] text-black/30">© OpenStreetMap</div>
        </div>
      </div>
    </div>
  );
}
