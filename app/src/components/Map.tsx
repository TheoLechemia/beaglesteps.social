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

    // Slowly spin the globe until the user interacts with the map or a fitBounds
    // call zooms in. jumpTo() every frame would otherwise fight the user's own
    // drag/wheel input, so any interaction stops the spin immediately.
    let rotationFrame: number;
    let isSpinning = true;
    const spinGlobe = () => {
      if (!isSpinning) return;
      const mapCenter = instance.getCenter();
      instance.jumpTo({ center: [mapCenter.lng + 0.5, mapCenter.lat] });
      rotationFrame = requestAnimationFrame(spinGlobe);
    };
    const stopSpin = () => {
      isSpinning = false;
      cancelAnimationFrame(rotationFrame);
    };
    instance.once('mousedown', stopSpin);
    instance.once('touchstart', stopSpin);
    instance.once('wheel', stopSpin);
    instance.once('zoomstart', stopSpin);

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
