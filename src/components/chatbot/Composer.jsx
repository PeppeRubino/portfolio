import React from 'react';

export default function Composer({
  value = '',
  onChange = () => {},
  onKeyDown = () => {},
  onSubmit = () => {},
  loading = false,
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
        className="w-full resize-none rounded-2xl bg-white/95 px-6 py-4 pr-16 text-lg text-gray-800 placeholder-gray-400 shadow-xl transition-all duration-200 select-text focus:outline-none focus:ring-4 focus:ring-gray-300/50"
      />

      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-indigo-500 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
        >
          Invia
        </button>
      </div>
    </form>
  );
}
