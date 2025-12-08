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
        !item.preview &&
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
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      {media.map((item) => {
        const hasVideoPreview = item.type === 'video' && Boolean(item.preview);
        const previewPoster = item.poster ?? item.thumb;

        return (
          <article
            key={item.id}
            className="rounded-3xl border border-white/60 bg-linear-to-br from-white/95 via-slate-50/90 to-slate-100/80 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
          >
            <button
              type="button"
              onClick={() => {
                if (item.type === 'image' && item.src) onPreload(item.src);
                onSelect(item);
              }}
              className="flex w-full flex-col gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 cursor-pointer"
              title={item.alt ?? ""}
              aria-label={item.alt ?? (item.type === "video" ? "Video" : "Immagine")}
              onMouseEnter={() => {
                if (item.type === "image" && item.src) onPreload(item.src);
              }}
              onFocus={() => {
                if (item.type === "image" && item.src) onPreload(item.src);
              }}
            >
              <div className="relative h-40 w-full overflow-hidden rounded-2xl bg-gray-50 shadow-inner sm:h-44">
                {item.type === "image" ? (
                  <img
                    src={item.thumb ?? item.src}
                    alt={item.alt ?? ""}
                    className="h-full w-full object-cover opacity-0 transition-opacity duration-300"
                    loading={item.priority ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={item.priority ? "high" : undefined}
                    onLoad={handleImageLoad}
                  />
                ) : hasVideoPreview ? (
                  <video
                    src={item.preview}
                    poster={previewPoster}
                    muted
                    autoPlay
                    loop
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover opacity-100 transition-opacity duration-300"
                  />
                ) : item.thumb || videoThumbs[item.id] ? (
                  <img
                    src={item.thumb || videoThumbs[item.id]}
                    alt={item.alt ?? "video"}
                    className="h-full w-full object-cover opacity-0 transition-opacity duration-300"
                    loading={item.priority ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={item.priority ? "high" : undefined}
                    onLoad={handleImageLoad}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                    Video
                  </div>
                )}

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-white">
                  <svg className="h-10 w-10 drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.35em] text-indigo-600">
                  <span>{item.type === "video" ? "Video" : "Immagine"}</span>
                  {item.priority && <span className="text-emerald-600">Highlight</span>}
                </div>
                {item.caption && (
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.caption}
                  </p>
                )}
              </div>
            </button>
          </article>
        );
      })}
    </div>
  );
}
