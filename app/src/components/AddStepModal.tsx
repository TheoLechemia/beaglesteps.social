import { useEffect, useRef, useState } from 'react';
import type { SubmitEvent } from 'react';
import { IconCurrentLocation, IconMapPin, IconPhoto, IconX } from '@tabler/icons-react';
import { useUserTrip } from '../context/UserTripContext';
import { FormInput, FormSelect } from './FormField';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const MAX_PHOTOS = 4;

interface AddStepModalProps {
  onClose: () => void;
}

export function AddStepModal({ onClose }: AddStepModalProps) {
  const { trips, createStep } = useUserTrip();
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number} | null>(null)


  useEffect(() => {
  if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty', // OSM-based style with place/city labels
      center: [0, 0], // starting position [lng, lat]
      zoom: 1 // starting zoom
    })
     map.on('load', () => map.setProjection({ type: 'globe' }));
     mapRef.current = map;

     map.on("click", (e) => {
       if (markerRef.current) {
         markerRef.current.setLngLat(e.lngLat);
        } else {
          markerRef.current = new maplibregl.Marker().setLngLat(e.lngLat).addTo(map);
        }
        const { lng, lat } = e.lngLat;
        setPosition({ lat, lng })

     })

     return () => {
      map.remove();
      mapRef.current = null;
    }
  }, []) // only once in mounting




  useEffect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file));
    setPhotoPreviews(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [photos]);

  function handlePhotosSelected(files: FileList | null) {
    if (!files) return;
    const newFiles = Array.from(files);
    setPhotos((prev) => [...prev, ...newFiles].slice(0, MAX_PHOTOS));
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  function handleLocateMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      const { latitude, longitude } = coords;
      const map = mapRef.current;
      if (!map) return;

      map.flyTo({ center: [longitude, latitude], zoom: 12 });
      if (markerRef.current) {
        markerRef.current.setLngLat([longitude, latitude]);
      } else {
        markerRef.current = new maplibregl.Marker().setLngLat([longitude, latitude]).addTo(map);
      }
      setPosition({ lat: latitude, lng: longitude });
    });
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const trip = trips.find((t) => t.uri === formData.get('tripUri'));
    if (!trip) return;

    setIsPosting(true);
    setError(null);

    try {
      await createStep(
        {
          $type: 'app.beaglesteps.step',
          tripRef: { uri: trip.uri, cid: trip.cid },
          body: formData.get('body') as string,
          title: formData.get('title') as string,
          date: formData.get('date') as string,
          createdAt: new Date().toISOString(),
          location: position
            ? {
                longitude: String(position.lng),
                latitude: String(position.lat),
              }
            : undefined,
        },
        photos,
      );
      onClose();
    } catch {
      setError('Failed to publish. Please try again.');
    } finally {
      setIsPosting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[440px] rounded-2xl border-[0.5px] border-line bg-surface-0 p-4 shadow-xl md:max-w-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-voice text-[17px]">Add a step</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-surface-1 hover:text-ink"
          >
            <IconX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          {trips.length === 0 ? (
            <p className="text-[13px] text-ink-muted">
              Create a trip first so you can add steps to it.
            </p>
          ) : (
            <FormSelect name="tripUri" required defaultValue="">
              <option value="" disabled>
                Choose a trip
              </option>
              {trips.map((trip) => (
                <option key={trip.uri} value={trip.uri}>
                  {trip.value.title}
                </option>
              ))}
            </FormSelect>
          )}
          <FormInput name="title" type="text" placeholder="Title" />
          <div className="flex items-center justify-between text-[12px] text-ink-muted">
            <span className="flex items-center gap-1">
              <IconMapPin size={13} /> Click on the map to place your step
            </span>
            <button
              type="button"
              onClick={handleLocateMe}
              className="flex cursor-pointer items-center gap-1 text-primary hover:underline"
            >
              <IconCurrentLocation size={13} /> Locate me
            </button>
          </div>
          <div ref={containerRef} className="relative h-64 w-full" />
          <textarea
            name="body"
            autoFocus
            placeholder="Tell the story of this step of your trip..."
            rows={4}
            className="w-full resize-none rounded-lg border-[0.5px] border-line bg-surface-1 p-3 text-[14px] text-ink placeholder:text-ink-muted focus:outline-none"
          />

          <label className="mb-1 block text-[12px] text-ink-muted">Date</label>
          <FormInput name="date" type="date" />

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {photos.map((_file, index) => (
              <div key={index} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-[0.5px] border-line">
                <img src={photoPreviews[index]} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute right-0.5 top-0.5 flex h-4 w-4 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white"
                  aria-label="Remove photo"
                >
                  <IconX size={10} />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <label className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-lg border-[0.5px] border-dashed border-line text-ink-muted hover:text-ink">
                <IconPhoto size={20} />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    handlePhotosSelected(e.target.files);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>



          <div className="mt-1 flex items-center justify-end">
            {error && <span className="text-[11px] text-red-500">{error}</span>}
          </div>

          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border-[0.5px] border-line px-4 py-2 text-[13px] hover:bg-surface-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPosting || trips.length === 0}
              className="rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-surface-0 hover:bg-primary-700 disabled:pointer-events-none disabled:opacity-50"
            >
              {isPosting ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
