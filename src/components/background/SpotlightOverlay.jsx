import React from 'react';

export default function SpotlightOverlay({ visible = false }) {
  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-linear-to-b from-white/95 to-slate-50/95 backdrop-blur-sm transition-opacity duration-300"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-linear-to-b from-slate-100/90 to-white/70" />
      <div className="relative flex items-center justify-center rounded-2xl px-12 py-6 shadow-2xl shadow-slate-400/20">
        <div className="absolute inset-0 -z-10 rounded-[26px] bg-white/30 blur-2xl" />
        <div className="text-3xl font-bold tracking-tight text-slate-900 drop-shadow">
          G. Rubino
        </div>
        <div
          className="pointer-events-none absolute -left-1/3 -top-1/2 h-[220%] w-2/5 rotate-[-20deg] bg-linear-to-r from-transparent via-white/70 to-transparent blur-lg mix-blend-screen animate-pulse"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
