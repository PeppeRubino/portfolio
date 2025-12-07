import React from 'react';

export default function Composer({
  value = '',
  onChange = () => {},
  onKeyDown = () => {},
  onSubmit = () => {},
  loading = false,
  showCvButton = false,
  onDownloadCv = () => {},
}) {
  return (
    <form onSubmit={onSubmit} className="relative w-full">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Scrivi un messaggio..."
        rows={2}
        disabled={loading}
        className="w-full resize-none rounded-2xl bg-white/95 px-6 py-4 pr-16 text-lg text-gray-800 placeholder-gray-400 shadow-xl transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-gray-300/50"
      />

      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        {showCvButton && (
          <button
            type="button"
            onClick={onDownloadCv}
            className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow transition hover:bg-indigo-50"
            aria-label="Scarica il curriculum di Giuseppe Rubino"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            CV
          </button>
        )}
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg transition hover:bg-indigo-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
        >
          Invia
        </button>
      </div>
    </form>
  );
}
