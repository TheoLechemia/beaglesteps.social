import type { Trip } from '../types/trip';

interface MapSidebarProps {
  trips: Trip[];
  width?: number;
}

export function MapSidebar({ trips, width = 240 }: MapSidebarProps) {
  return (
    <div className="relative shrink-0 overflow-hidden" style={{ width }}>
      <div className="absolute inset-0 bg-[#dde8d4]" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute inset-x-0 h-[3px] bg-white/50" style={{ top: '44%' }} />
      <div className="absolute inset-y-0 w-[2px] bg-white/50" style={{ left: '40%' }} />

      {trips.map((trip) => (
        <div key={trip.id}>
          <div
            className="absolute h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_1px_3px_rgba(0,0,0,0.2)]"
            style={{ top: trip.mapPin.top, left: trip.mapPin.left, background: trip.mapPin.color }}
          />
          <div
            className="pointer-events-none absolute -translate-x-1/2 whitespace-nowrap rounded border-[0.5px] border-black/10 bg-white px-1.5 py-0.5 text-[10px] text-[#333] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
            style={{
              top: `calc(${trip.mapPin.top} - 22px)`,
              left: trip.mapPin.left,
            }}
          >
            {trip.mapPin.label}
          </div>
        </div>
      ))}

      <div className="absolute bottom-1.5 right-2 text-[9px] text-black/30">© OpenStreetMap</div>
    </div>
  );
}
