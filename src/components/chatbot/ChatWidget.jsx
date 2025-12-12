import React, { useEffect, useState } from 'react';
import { generateAnswer } from '../../utils/llm_wrapper.jsx';
import { analyzePrompt } from '../../utils/knowledge.js';
import { getDocumentDownloadInfo } from '../../utils/project_documents.js';
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
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false
  );
  const [pendingDocRequest, setPendingDocRequest] = useState(null);
  const [docDownload, setDocDownload] = useState(null);
  const { isSpeaking, speakText, unlockAudio } = useLuceSpeech(useCustomVoice);

  const affirmativeWords = ['si', 'sì', 'yes', 'ok', 'vai', 'va bene', 'confermo'];
  const negativeWords = ['no', 'non', 'preferisco di no', 'annulla', 'cancel'];

  const isAffirmative = (text) => {
    const lower = text.toLowerCase();
    return affirmativeWords.some((word) => lower === word || lower.startsWith(`${word} `));
  };

  const isNegative = (text) => {
    const lower = text.toLowerCase();
    return negativeWords.some((word) => lower === word || lower.startsWith(`${word} `));
  };

  const handleDownloadDoc = () => {
    if (!docDownload?.url) return;
    const link = document.createElement('a');
    link.href = docDownload.url;
    link.download = docDownload.filename || 'documento.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDocDownload(null);
  };

  useEffect(() => {
    function handleResize() {
      if (typeof window === 'undefined') return;
      setIsMobile(window.matchMedia('(max-width: 767px)').matches);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateLastAssistantMessage = (message) => {
    setHistory((prev) => {
      const copy = [...prev];
      if (!copy.length) return copy;
      const last = copy.length - 1;
      copy[last] = { ...copy[last], assistant: message };
      return copy;
    });
  };

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
    setDocDownload(null);

    if (pendingDocRequest) {
      if (isAffirmative(text)) {
        const contextPayload = {
          type: 'project',
          data: pendingDocRequest.project,
          docPreference: pendingDocRequest.docPreference || [],
        };
        try {
          const reply = await generateAnswer(pendingDocRequest.originalPrompt, history, contextPayload);
          updateLastAssistantMessage(reply);
          try {
            await speakText(reply);
          } catch (ttsErr) {
            console.warn('TTS reply error:', ttsErr);
          }
        } catch (err) {
          console.error('[handleSend] errore doc confirm:', err);
          const fallback = 'Mi dispiace, non posso leggere quei documenti in questo momento.';
          updateLastAssistantMessage(fallback);
          setTimeout(() => {
            speakText(fallback, { forceSystem: true }).catch((ttsErr) => console.warn('TTS fallback error:', ttsErr));
          }, 60);
        } finally {
          setPendingDocRequest(null);
          setDocDownload(null);
          setLoading(false);
        }
        return;
      }
      if (isNegative(text)) {
        const declineMessage = 'Ricevuto, non consulterò quei documenti. Dimmi pure se ti serve altro.';
        updateLastAssistantMessage(declineMessage);
        setPendingDocRequest(null);
        setDocDownload(null);
        setTimeout(() => {
          speakText(declineMessage).catch((err) => console.warn('TTS decline error:', err));
        }, 60);
        setLoading(false);
        return;
      }
    }

    const analysis = analyzePrompt(text);

    if (analysis.stopModel && analysis.reason === 'cv_request') {
      const message = 'Posso fornirti il suo curriculum. Premi il pulsante per scaricarlo o visualizzarlo.';
      setShowCvButton(true);
      updateLastAssistantMessage(message);
      setTimeout(() => {
        speakText(message).catch((err) => console.warn('TTS cv_request error:', err));
      }, 60);
      setLoading(false);
      return;
    }

    if (analysis.stopModel && analysis.reason === 'project_doc_confirm') {
      const { project, docPreference } = analysis.data || {};
      if (project && docPreference?.length) {
        const downloadInfo = getDocumentDownloadInfo(project.id, docPreference);
        if (downloadInfo) {
          setDocDownload(downloadInfo);
        }
        setPendingDocRequest({ project, docPreference, originalPrompt: text });
        const docsLabel = docPreference
          .map((type) => (type === 'architecture' ? 'Architecture' : 'README'))
          .join(' e ');
        const extra = downloadInfo ? ' Puoi anche scaricarlo con il pulsante qui sotto.' : '';
        const message = `Vuoi che consulti ${docsLabel} del progetto "${project.name}" prima di risponderti?${extra}`;
        updateLastAssistantMessage(message);
        setTimeout(() => {
          speakText(message).catch((err) => console.warn('TTS doc confirm error:', err));
        }, 60);
        setLoading(false);
        return;
      }
    }

    if (analysis.type === 'irrelevant') {
      const message = 'Preferisco rispondere solo a domande riguardanti il mio portfolio.';
      updateLastAssistantMessage(message);
      setTimeout(() => {
        speakText(message).catch((err) => console.warn('TTS irrelevant error:', err));
      }, 60);
      setLoading(false);
      return;
    }

    try {
      const reply = await generateAnswer(text, history, { type: analysis.type, data: analysis.data });
      updateLastAssistantMessage(reply);
      try {
        await speakText(reply);
      } catch (ttsErr) {
        console.warn('TTS reply error:', ttsErr);
      }
    } catch (err) {
      console.error('[handleSend] errore generale:', err);
      const fallback = 'Mi dispiace, si è verificato un errore.';
      updateLastAssistantMessage(fallback);
      setTimeout(() => {
        speakText(fallback, { forceSystem: true }).catch((ttsErr) => console.warn('TTS fallback error:', ttsErr));
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
              </div>
            </div>
            <p className="text-[0.85rem] text-slate-600 hidden md:block">
              Chatbot vocale: tour dei progetti, download CV, spiegazioni tecniche.
            </p>
            {isMobile ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  aria-pressed={useCustomVoice}
                  onClick={() => setUseCustomVoice((prev) => !prev)}
                  className={`rounded-full px-4 py-1 text-xs font-semibold border transition ${
                    useCustomVoice ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white/80 text-slate-600 border-slate-200'
                  }`}
                >
                  {useCustomVoice ? 'Voce premium' : 'Voce del tuo sistema'}
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
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
            )}
          </div>
          <div className="flex flex-col items-center justify-center gap-8 md:gap-10">
            <VoiceOrb isSpeaking={isSpeaking} />
            <div className="w-full space-y-2">
              {docDownload && !showCvButton && (
                <div className="flex w-full justify-end">
                  <button
                    type="button"
                    onClick={handleDownloadDoc}
                    className="ml-auto max-w-[70%] rounded-2xl border border-white/70 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-[0_12px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-200 flex items-center gap-2 whitespace-nowrap overflow-hidden"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5 shrink-0 text-slate-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v10m0 0l-3-3m3 3l3-3M5 19h14" />
                    </svg>
                    <span className="truncate">{docDownload.label || 'Documento'}</span>
                  </button>
                </div>
              )}
              <Composer
                value={input}
                onChange={setInput}
                onKeyDown={handleKeyDown}
                onSubmit={handleSend}
                loading={loading}
                showCvButton={showCvButton}
                onDownloadCv={handleDownloadCV}
              />
              <p className="text-center text-xs text-slate-500 hidden md:block">
                Suggerimenti: “Fammi un tour dei progetti prioritari”, “Posso avere il CV?”, “Mostrami come funziona Decod”.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
