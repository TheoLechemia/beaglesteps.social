import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { Feature, LineString } from 'geojson';
import { useMap } from '../context/MapContext';
import type { StepEntry } from './Step';

interface TripStepsRouteProps {
  steps: StepEntry[];
  activeStepUri?: string;
  onMarkerClick?(uri:string): void;
}

const ROUTE_SOURCE_ID = 'trip-steps-route';
const ROUTE_ARROW_LAYER_ID = 'trip-steps-route-arrows';
const ROUTE_ARROW_IMAGE_ID = 'trip-steps-route-arrow-icon';

// MapLibre paint properties are WebGL, not DOM, so they can't read CSS custom
// properties directly — resolve the real value via a throwaway probe element.
function resolveCssColor(varName: string, fallback: string): string {
  const probe = document.createElement('div');
  probe.style.color = `var(${varName})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  return resolved || fallback;
}

// Small right-pointing triangle; MapLibre rotates it to follow the line direction.
function createArrowIcon(color: string, size = 16): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(size, size / 2);
  ctx.lineTo(0, size);
  ctx.closePath();
  ctx.fill();
  return ctx.getImageData(0, 0, size, size);
}

export function TripStepsRoute({ steps, activeStepUri, onMarkerClick }: TripStepsRouteProps) {
  const map = useMap();
  const markersRef = useRef<Record<string, maplibregl.Marker>>({});

  useEffect(() => {
    // Steps sorted chronologically by date, so the route line follows the trip in order.
    const orderedSteps = [...steps].sort((a, b) =>
      (a.value.date ?? '').localeCompare(b.value.date ?? '')
    );


    // [lng, lat] pairs, skipping steps that have no location set.
    const stepCoordinates = orderedSteps
      .filter((step) => step.value.location?.latitude && step.value.location?.longitude)
      .map((step) => ({
            step,
            coords: [Number(step.value.location!.longitude), Number(step.value.location!.latitude)] as [number, number],

      }));

    if (stepCoordinates.length === 0) return;

    const routeColor = resolveCssColor('--color-primary', '#2da00a');

    // Last marker gets a pulsing accent halo to draw attention to the trip's latest step;
    // the others are static primary-colored dots (or accent, if scrolled into view).
    const lastIndex = stepCoordinates.length - 1;
    markersRef.current = {};
    const markers = stepCoordinates.map(({step, coords}, index) => {
      const el = document.createElement('div');
      el.className =
        index === lastIndex ? 'marker-halo' : step.uri === activeStepUri ? 'marker-current' : 'marker-dot';
      const popup = new maplibregl.Popup({ offset: 12, closeButton: false }).setText(
        step.value.title || 'Untitled step'
      );
      const marker = new maplibregl.Marker({ element: el }).setLngLat(coords).setPopup(popup);
      marker.addTo(map);
      marker.getElement().addEventListener('click', () => onMarkerClick?.(step.uri));
      markersRef.current[step.uri] = marker;
      return marker;
    });

    const addRouteLayer = () => {
      if (stepCoordinates.length < 2) return;
      const lineData: Feature<LineString> = {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: stepCoordinates.map(({ coords }) => coords) },
        properties: {},
      };

      const source = map.getSource(ROUTE_SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
      if (source) {
        source.setData(lineData);
        return;
      }
      map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: lineData });
      map.addLayer({
        id: ROUTE_SOURCE_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': routeColor, 'line-width': 3, 'line-dasharray': [2, 2] },
      });

      if (!map.hasImage(ROUTE_ARROW_IMAGE_ID)) {
        map.addImage(ROUTE_ARROW_IMAGE_ID, createArrowIcon(routeColor));
      }
      map.addLayer({
        id: ROUTE_ARROW_LAYER_ID,
        type: 'symbol',
        source: ROUTE_SOURCE_ID,
        layout: {
          'symbol-placement': 'line',
          'symbol-spacing': 40,
          'icon-image': ROUTE_ARROW_IMAGE_ID,
          'icon-size': 0.6,
          'icon-rotation-alignment': 'map',
          'icon-allow-overlap': true,
        },
      });
    };

    if (map.isStyleLoaded()) {
      addRouteLayer();
    } else {
      map.once('load', addRouteLayer);
    }

    const bounds = stepCoordinates.reduce(
      (b, { coords }) => b.extend(coords),
      new maplibregl.LngLatBounds(stepCoordinates[0].coords, stepCoordinates[0].coords)
    );
      map.fitBounds(bounds, { padding: 48, duration: 1000 });

    return () => {
      markers.forEach((marker) => marker.remove());
      markersRef.current = {};
      // The map may already be torn down (e.g. navigating away before the style
      // finished loading), in which case these calls throw — nothing left to clean up.
      try {
        map.off('load', addRouteLayer);
        if (map.getLayer(ROUTE_ARROW_LAYER_ID)) map.removeLayer(ROUTE_ARROW_LAYER_ID);
        if (map.getLayer(ROUTE_SOURCE_ID)) map.removeLayer(ROUTE_SOURCE_ID);
        if (map.getSource(ROUTE_SOURCE_ID)) map.removeSource(ROUTE_SOURCE_ID);
      } catch {
        // Map already removed.
      }
    };
  }, [map, steps]);

  // Toggle which marker looks "current" (and pops its title open) without recreating
  // them all — the halo marker keeps its own styling and never gets a popup toggle.
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([uri, marker]) => {
      const el = marker.getElement();
      const popup = marker.getPopup();
      const isActive = uri === activeStepUri;

      if (!el.classList.contains('marker-halo')) {
        el.classList.remove('marker-dot', 'marker-current');
        el.classList.add(isActive ? 'marker-current' : 'marker-dot');
      }

      if (!popup) return;
      if (isActive && !popup.isOpen()) marker.togglePopup();
      else if (!isActive && popup.isOpen()) marker.togglePopup();
    });
  }, [activeStepUri]);

  return null;
}
