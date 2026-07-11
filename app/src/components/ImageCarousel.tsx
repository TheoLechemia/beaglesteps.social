import { useState } from 'react';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';

interface ImageCarouselProps {
  images: string[];
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className="relative mt-2 h-100 w-full overflow-hidden rounded-xl bg-surface-1">
      <img src={images[index]} alt="" className="h-full w-full object-contain" />

      {index > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIndex((i) => i - 1);
          }}
          aria-label="Previous photo"
          className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
        >
          <IconChevronLeft size={16} />
        </button>
      )}
      {index < images.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIndex((i) => i + 1);
          }}
          aria-label="Next photo"
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60"
        >
          <IconChevronRight size={16} />
        </button>
      )}

      {images.length > 1 && (
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIndex(i);
              }}
              aria-label={`Go to photo ${i + 1}`}
              className={`h-1.5 w-1.5 cursor-pointer rounded-full ${i === index ? 'bg-white' : 'bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
