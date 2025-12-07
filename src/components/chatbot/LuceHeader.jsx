import React from 'react';
import luce from '../../media/img/luce.png';

export default function LuceHeader({
  isSpeaking = false,
  useCustomVoice = false,
  onToggleVoice = () => {},
}) {
  return (
    <div className="flex w-full items-center justify-between pb-2">
      <div className="flex items-center gap-4">
        <div
          className={`relative h-10 w-10 overflow-hidden rounded-full bg-white shadow-lg transition-transform ${
            isSpeaking ? 'scale-105' : ''
          }`}
        >
          <img src={luce} alt="Avatar di Luce" className="h-full w-full object-cover" loading="lazy" />
        </div>
        <div className="text-sm font-semibold text-indigo-700">Luce</div>
      </div>

      <button
        type="button"
        onClick={onToggleVoice}
        aria-pressed={useCustomVoice}
        className={`rounded-full px-3 py-1 text-sm font-medium transition ${
          useCustomVoice ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
        }`}
      >
        {useCustomVoice ? 'Voce alternativa' : 'Voce sistema italiana'}
      </button>
    </div>
  );
}
