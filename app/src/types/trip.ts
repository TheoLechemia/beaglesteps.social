export type TripStatus = 'ongoing' | 'ended';

export interface Avatar {
  initials: string;
  bg: string;
  color: string;
}

export interface TripStat {
  value: string;
  label: string;
}

export interface MapPosition {
  top: string;
  left: string;
}

export interface TripStep {
  id: string;
  title: string;
  date: string;
  location: string;
  stats: TripStat[];
  description: string;
  photos: number;
  /** position along the route SVG, in the 0 0 400 200 viewBox */
  routePoint: { x: number; y: number };
  mapPosition: MapPosition;
}

export interface Trip {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  author: {
    handle: string;
    postedAgo: string;
    avatar: Avatar;
  };
  status: TripStatus;
  stats: {
    distance: string;
    duration: string;
    likes: number;
  };
  followers: {
    count: number;
    avatars: Avatar[];
  };
  mapPin: MapPosition & { color: string; label: string };
  steps: TripStep[];
}
