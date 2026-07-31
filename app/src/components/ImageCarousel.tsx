import { useState } from 'react';
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

function Lightbox({ images, index, onIndexChange, onClose }: LightboxProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
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
        onClick={(e) => e.stopPropagation()}
        className="max-h-full max-w-full object-contain"
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
