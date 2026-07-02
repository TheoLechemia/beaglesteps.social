import type { TripStep } from '../types/trip';

interface StepMapPinsProps {
  steps: TripStep[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function StepMapPins({ steps, activeIndex, onSelect }: StepMapPinsProps) {
  return (
    <div className="relative h-full w-full">
      {steps.map((step, i) => {
        const isActive = i === activeIndex;
        const isPast = i < activeIndex;
        const size = isActive ? 12 : 8;
        const color = isActive ? '#185FA5' : isPast ? '#1D9E75' : '#888780';

        return (
          <div key={step.id}>
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full border-2 border-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
              style={{ top: step.mapPosition.top, left: step.mapPosition.left, width: size, height: size, background: color }}
              onClick={() => onSelect(i)}
            />
            {isActive && (
              <div
                className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded border-[0.5px] border-black/10 bg-white px-1 py-0.5 text-[10px] text-[#333] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                style={{ top: `calc(${step.mapPosition.top} - 22px)`, left: step.mapPosition.left }}
              >
                {step.title}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
