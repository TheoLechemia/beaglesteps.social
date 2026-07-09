import { createContext, useContext } from 'react';
import type maplibregl from 'maplibre-gl';

export const MapContext = createContext<maplibregl.Map | null>(null);

export function useMap() {
  const map = useContext(MapContext);
  if (!map) throw new Error('useMap must be used inside <Map> children, once the map is loaded');
  return map;
}
