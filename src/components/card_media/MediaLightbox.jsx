import React from 'react';

export default function MediaLightbox({ item = null, onClose = () => {} }) {
  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="max-h-[95%] max-w-[95%] overflow-hidden rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === 'image' ? (
          <img
            src={item.src}
            alt={item.alt ?? ''}
            className="max-h-[80vh] max-w-full object-contain"
          />
        ) : (
          <video
            controls
            className="max-h-[80vh] max-w-full"
            poster={item.poster ?? item.thumb ?? undefined}
          >
            <source src={item.src} />
            Il tuo browser non supporta il tag video.
          </video>
        )}

        <div className="flex items-center justify-between bg-white/90 px-4 py-2 text-sm">
          <div className="text-gray-700">{item.alt ?? ''}</div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-gray-100 px-3 py-1 text-gray-700 transition hover:bg-gray-200"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}
