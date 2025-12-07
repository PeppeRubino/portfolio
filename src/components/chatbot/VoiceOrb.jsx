import React from 'react';

export default function VoiceOrb({ isSpeaking = false }) {
  return (
    <div className="relative mt-2 flex w-full flex-col items-center gap-6">
      <div
        className={`relative mb-6 rounded-full bg-white p-6 shadow-[0_25px_60px_rgba(15,23,42,0.12)] transition-transform duration-300 ${
          isSpeaking ? 'scale-110' : ''
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-gray-700"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
          <path d="M19 11c0 3.87-3.13 7-7 7s-7-3.13-7-7H3c0 4.41 3.17 8.06 7.35 8.86V23h3v-3.14C17.83 19.06 21 15.41 21 11h-2z" />
        </svg>
        {isSpeaking && (
          <>
            <span className="absolute inset-0 rounded-full border-4 border-gray-400/30 animate-ping" />
            <span className="absolute inset-0 rounded-full border-4 border-gray-400/20 animate-ping delay-200" />
            <span className="absolute inset-0 rounded-full border-4 border-gray-400/10 animate-ping delay-400" />
          </>
        )}
      </div>
    </div>
  );
}
