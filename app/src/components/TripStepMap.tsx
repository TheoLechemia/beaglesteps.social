import type { TripStep } from '../types/trip';

interface TripStepMapProps {
  steps: TripStep[];
  activeIndex: number;
}

export function TripStepMap({ steps, activeIndex }: TripStepMapProps) {
  const active = steps[activeIndex];
  const first = steps[0];
  const last = steps[steps.length - 1];
  const points = steps.map((step) => `${step.routePoint.x},${step.routePoint.y}`).join(' ');

  return (
    <div className="relative h-[200px] shrink-0 overflow-hidden bg-[#dde8d4]">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 200"
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          stroke="#378ADD"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={first.routePoint.x} cy={first.routePoint.y} r={7} fill="#1D9E75" stroke="white" strokeWidth={2.5} />
        <circle cx={last.routePoint.x} cy={last.routePoint.y} r={7} fill="#E24B4A" stroke="white" strokeWidth={2.5} />
        <circle cx={active.routePoint.x} cy={active.routePoint.y} r={9} fill="#185FA5" stroke="white" strokeWidth={2.5} />
      </svg>
    </div>
  );
}
