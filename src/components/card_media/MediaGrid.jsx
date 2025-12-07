import React, { useState, useEffect } from 'react';
import { generateVideoThumbnail } from './thumbnailHelper';

export default function MediaGrid({
  media = [],
  onSelect = () => {},
  onPreload = () => {},
}) {
  const [videoThumbs, setVideoThumbs] = useState({});

  if (!Array.isArray(media) || media.length === 0) {
    return (
      <div className="rounded-2xl border border-white/70 bg-white/60 p-6 text-sm text-gray-500">
        Nessun contenuto multimediale disponibile.
      </div>
    );
  }

  const handleImageLoad = (e) => {
    const el = e.currentTarget;
    el.classList.remove('opacity-0');
    el.classList.add('opacity-100');
  };

  useEffect(() => {
    media.forEach((item) => {
      if (
        item.type === 'video' &&
        item.src &&
        !item.thumb &&
        !videoThumbs[item.id]
      ) {
        generateVideoThumbnail(item.src)
          .then((thumb) => {
            if (!thumb) return;
            setVideoThumbs((prev) => ({ ...prev, [item.id]: thumb }));
          })
          .catch(() => {
            // se fallisce, resta il fallback "Video"
          });
      }
    });
  }, [media, videoThumbs]);

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
      {media.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            if (item.type === 'image' && item.src) onPreload(item.src);
            onSelect(item);
          }}
          className="group relative overflow-hidden rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
          title={item.alt ?? ''}
          aria-label={item.alt ?? (item.type === 'video' ? 'Video' : 'Immagine')}
          onMouseEnter={() => {
            if (item.type === 'image' && item.src) onPreload(item.src);
          }}
          onFocus={() => {
            if (item.type === 'image' && item.src) onPreload(item.src);
          }}
        >
          {item.type === 'image' ? (
            <img
              src={item.thumb ?? item.src}
              alt={item.alt ?? ''}
              className="h-24 w-full rounded-xl object-cover opacity-0 transition-opacity duration-300 sm:h-28"
              loading={item.priority ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={item.priority ? 'high' : undefined}
              onLoad={handleImageLoad}
            />
          ) : (
            <div className="relative flex h-24 w-full items-center justify-center rounded-xl bg-gray-100 sm:h-28">
              {item.thumb || videoThumbs[item.id] ? (
                <img
                  src={item.thumb || videoThumbs[item.id]}
                  alt={item.alt ?? 'video'}
                  className="h-full w-full object-cover opacity-0 transition-opacity duration-300"
                  loading={item.priority ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority={item.priority ? 'high' : undefined}
                  onLoad={handleImageLoad}
                />
              ) : (
                <div className="text-xs text-gray-500">Video</div>
              )}

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white">
                <svg
                  className="h-8 w-8 drop-shadow"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
