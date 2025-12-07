import React, { useState } from 'react';
import { generateAnswer } from '../../utils/llm_wrapper.jsx';
import { analyzePrompt } from '../../utils/knowledge.js';
import cvPdf from '../../assets/data/Giuseppe_Rubino_CV.pdf';
import luce from '../../assets/media/luce.png';
import useLuceSpeech from './useLuceSpeech.js';
import VoiceOrb from './VoiceOrb.jsx';
import Composer from './Composer.jsx';

export default function ChatWidget({ className = '' }) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCvButton, setShowCvButton] = useState(false);
  const [useCustomVoice, setUseCustomVoice] = useState(false);
  const { isSpeaking, speakText, unlockAudio } = useLuceSpeech(useCustomVoice);

  async function handleSend(e) {
    if (e?.preventDefault) e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    try {
      unlockAudio();
    } catch (err) {
      console.warn('unlockAudio failed', err);
    }

    setHistory((prev) => [...prev, { user: text, assistant: null }]);
    setInput('');
    setLoading(true);
    setShowCvButton(false);

    const analysis = analyzePrompt(text);

    if (analysis.stopModel && analysis.reason === 'cv_request') {
      const message = 'Posso fornirti il mio curriculum. Premi il pulsante per scaricarlo o visualizzarlo.';
      setShowCvButton(true);
      setHistory((prev) => {
        const copy = [...prev];
        const last = copy.length - 1;
        copy[last] = { ...copy[last], assistant: message };
        return copy;
      });
      setTimeout(() => {
        speakText(message).catch((err) => console.warn('TTS cv_request error:', err));
      }, 60);
      setLoading(false);
      return;
    }

    if (analysis.type === 'irrelevant') {
      const message = 'Preferisco rispondere solo a domande riguardanti il mio portfolio.';
      setHistory((prev) => {
        const copy = [...prev];
        const last = copy.length - 1;
        copy[last] = { ...copy[last], assistant: message };
        return copy;
      });
      setTimeout(() => {
        speakText(message).catch((err) => console.warn('TTS irrelevant error:', err));
      }, 60);
      setLoading(false);
      return;
    }

    try {
      const reply = await generateAnswer(text, history, { type: analysis.type, data: analysis.data });
      setHistory((prev) => {
        const copy = [...prev];
        const last = copy.length - 1;
        copy[last] = { ...copy[last], assistant: reply };
        return copy;
      });
      try {
        await speakText(reply);
      } catch (ttsErr) {
        console.warn('TTS reply error:', ttsErr);
      }
    } catch (err) {
      console.error('[handleSend] errore generale:', err);
      const fallback = 'Mi dispiace, si è verificato un errore.';
      setHistory((prev) => {
        const copy = [...prev];
        const last = copy.length - 1;
        copy[last] = { ...copy[last], assistant: fallback };
        return copy;
      });
      setTimeout(() => {
        speakText(fallback).catch((ttsErr) => console.warn('TTS fallback error:', ttsErr));
      }, 60);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleDownloadCV() {
    const a = document.createElement('a');
    a.href = cvPdf;
    a.download = 'Giuseppe_Rubino_CV.pdf';
    a.click();
  }

  return (
    <section className={`my-16 flex w-full items-center justify-center px-4 ${className}`}>
      <div className="relative z-20 w-full max-w-2xl rounded-[34px] border border-white/70 bg-linear-to-br from-white/95 via-slate-50/90 to-slate-100/85 p-6 shadow-[0_35px_100px_rgba(15,23,42,0.25)]">
        <div className="absolute inset-x-6 top-6 h-12 rounded-2xl bg-white/60 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col gap-5 rounded-2xl border border-white/70 bg-white/85 px-4 py-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
            <div className="flex items-center gap-3">
              <img src={luce} alt="Luce" className="h-12 w-12 rounded-2xl border border-white object-cover shadow" />
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-slate-500">Assistente</p>
                  <span className="rounded-full bg-slate-900/90 px-2 py-0.5 text-[0.5rem] font-semibold uppercase tracking-[0.25em] text-white shadow">Voice only</span>
                </div>
                <h3 className="text-base font-semibold text-slate-900">Luce</h3>
                <p className="text-[0.85rem] text-slate-600">Chatbot vocale: tour dei progetti, download CV, spiegazioni tecniche.</p>
              </div>
            </div>
            <div className="inline-flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={!useCustomVoice}
                onClick={() => setUseCustomVoice(false)}
                className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
                  !useCustomVoice ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/80 text-slate-600 border-slate-200'
                }`}
              >
                Voce del tuo sistema
              </button>
              <button
                type="button"
                aria-pressed={useCustomVoice}
                onClick={() => setUseCustomVoice(true)}
                className={`rounded-full px-3 py-1 text-xs font-semibold border transition ${
                  useCustomVoice ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/80 text-slate-600 border-slate-200'
                }`}
              >
                Voce premium
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-8 md:gap-10">
            <VoiceOrb isSpeaking={isSpeaking} />
            <div className="w-full space-y-2">
              <Composer
                value={input}
                onChange={setInput}
                onKeyDown={handleKeyDown}
                onSubmit={handleSend}
                loading={loading}
                showCvButton={showCvButton}
                onDownloadCv={handleDownloadCV}
              />
              <p className="text-center text-xs text-slate-500">
                Suggerimenti: “Fammi un tour dei progetti prioritari”, “Posso avere il CV?”, “Mostrami come funziona Decod”.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
