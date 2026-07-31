import { useEffect, useRef, useState } from 'react';
import type { Touch as ReactTouch, TouchEvent as ReactTouchEvent } from 'react';
import { IconChevronLeft, IconChevronRight, IconX } from '@tabler/icons-react';

interface ImageCarouselProps {
  images: string[];
}

const THUMBNAIL_COUNT = 3;

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (images.length === 0) return null;

  const thumbnails = images.slice(0, THUMBNAIL_COUNT);
  const remainingCount = images.length - THUMBNAIL_COUNT;

  return (
    <>
      <div className="mt-2 grid grid-cols-3 gap-1">
        {thumbnails.map((src, i) => {
          const isLastThumbnail = i === THUMBNAIL_COUNT - 1;
          return (
            <button
              key={src}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIndex(i);
              }}
              className="relative aspect-square cursor-pointer overflow-hidden rounded-lg bg-surface-1"
            >
              <img src={src} alt="" className="h-full w-full object-cover" />
              {isLastThumbnail && remainingCount > 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-[15px] font-semibold text-white">
                  +{remainingCount}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {lightboxIndex !== null && (
        <Lightbox images={images} index={lightboxIndex} onIndexChange={setLightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </>
  );
}

interface LightboxProps {
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const DOUBLE_TAP_MAX_DELAY_MS = 300;
const DOUBLE_TAP_MAX_DISTANCE_PX = 30;

function touchDistance(a: ReactTouch, b: ReactTouch) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function Lightbox({ images, index, onIndexChange, onClose }: LightboxProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isTouching, setIsTouching] = useState(false);
  const pinchStartDistanceRef = useRef(0);
  const pinchStartScaleRef = useRef(1);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const panStartTranslateRef = useRef({ x: 0, y: 0 });
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);

  // Zoom/pan only makes sense per-photo, reset when navigating to the next/previous one.
  useEffect(() => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  }, [index]);

  function clampTranslate(next: { x: number; y: number }, forScale: number) {
    const bounds = containerRef.current?.getBoundingClientRect();
    if (!bounds) return next;
    const maxX = (bounds.width * (forScale - 1)) / 2;
    const maxY = (bounds.height * (forScale - 1)) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }

  function toggleDoubleTapZoom() {
    if (scale > 1) {
      setScale(1);
      setTranslate({ x: 0, y: 0 });
    } else {
      setScale(DOUBLE_TAP_SCALE);
    }
  }

  function handleTouchStart(e: ReactTouchEvent<HTMLImageElement>) {
    if (e.touches.length === 2) {
      setIsTouching(true);
      pinchStartDistanceRef.current = touchDistance(e.touches[0], e.touches[1]);
      pinchStartScaleRef.current = scale;
      panStartRef.current = null;
    } else if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();
      const lastTap = lastTapRef.current;
      if (
        lastTap &&
        now - lastTap.time < DOUBLE_TAP_MAX_DELAY_MS &&
        Math.hypot(touch.clientX - lastTap.x, touch.clientY - lastTap.y) < DOUBLE_TAP_MAX_DISTANCE_PX
      ) {
        toggleDoubleTapZoom();
        lastTapRef.current = null;
      } else {
        lastTapRef.current = { time: now, x: touch.clientX, y: touch.clientY };
      }
      if (scale > 1) {
        setIsTouching(true);
        panStartRef.current = { x: touch.clientX, y: touch.clientY };
        panStartTranslateRef.current = translate;
      }
    }
  }

  function handleTouchMove(e: ReactTouchEvent<HTMLImageElement>) {
    if (e.touches.length === 2 && pinchStartDistanceRef.current > 0) {
      e.preventDefault();
      const distance = touchDistance(e.touches[0], e.touches[1]);
      const nextScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, pinchStartScaleRef.current * (distance / pinchStartDistanceRef.current)),
      );
      setScale(nextScale);
      setTranslate((t) => clampTranslate(t, nextScale));
    } else if (e.touches.length === 1 && panStartRef.current) {
      e.preventDefault();
      const touch = e.touches[0];
      const next = {
        x: panStartTranslateRef.current.x + (touch.clientX - panStartRef.current.x),
        y: panStartTranslateRef.current.y + (touch.clientY - panStartRef.current.y),
      };
      setTranslate(clampTranslate(next, scale));
    }
  }

  function handleTouchEnd(e: ReactTouchEvent<HTMLImageElement>) {
    if (e.touches.length < 2) pinchStartDistanceRef.current = 0;
    if (e.touches.length === 0) {
      panStartRef.current = null;
      setIsTouching(false);
    }
  }

  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/40 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        aria-label="Close"
        className="absolute right-4 top-4 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
      >
        <IconX size={20} />
      </button>

      <img
        src={images[index]}
        alt=""
        // onClick={(e) => e.stopPropagation()}

        style={{ transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})` }}
        className={`max-h-full max-w-full touch-none object-contain ${isTouching ? '' : 'transition-transform duration-200 ease-out'}`}
      />

      {index > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange(index - 1);
          }}
          aria-label="Previous photo"
          className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 md:left-4"
        >
          <IconChevronLeft size={20} />
        </button>
      )}
      {index < images.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onIndexChange(index + 1);
          }}
          aria-label="Next photo"
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 md:right-4"
        >
          <IconChevronRight size={20} />
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[13px] text-white/80">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
