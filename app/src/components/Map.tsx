import { useRef, useEffect, useState, type ReactNode } from 'react';
import maplibregl, { type LngLatLike, type SkySpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapContext } from '../context/MapContext';

interface MapProps {
  className?: string;
  center?: LngLatLike;
  style?: string;
  zoom?: number;
  sky?: SkySpecification;
  children?: ReactNode;
}

export function Map({
  className = 'h-64 w-full',
  center = [0, 0],
  style = 'https://tiles.openfreemap.org/styles/liberty',
  zoom = 1,
  sky,
  children,
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const instance = new maplibregl.Map({
      container: containerRef.current,
      style,
      center,
      zoom,
    });

    // Slowly spin the globe until the user (or a fitBounds call) zooms in.
    let rotationFrame: number;
    const spinGlobe = () => {
      const mapCenter = instance.getCenter();
      instance.jumpTo({ center: [mapCenter.lng + 0.5, mapCenter.lat] });
      rotationFrame = requestAnimationFrame(spinGlobe);
    };
    instance.once('zoomstart', () => cancelAnimationFrame(rotationFrame));

    instance.on('load', () => {
      instance.setProjection({ type: 'globe' });
      if (sky) instance.setSky(sky);
      rotationFrame = requestAnimationFrame(spinGlobe);
    });
    setMap(instance);

    return () => {
      cancelAnimationFrame(rotationFrame);
      instance.remove();
      setMap(null);
    };
  }, []); // only once on mount

  return (
    <>
      <div ref={containerRef} className={className} />
      {map && <MapContext.Provider value={map}>{children}</MapContext.Provider>}
    </>
  );
}
