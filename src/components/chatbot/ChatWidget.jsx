import React, { useEffect, useRef, useState } from 'react';
import { generateAnswer } from '../../utils/llm_wrapper.jsx';
import { analyzePrompt } from '../../utils/knowledge.js';
import { getDocumentDownloadInfo } from '../../utils/project_documents.js';
import cvPdf from '../../assets/data/Giuseppe_Rubino_CV.pdf';
import luce from '../../assets/media/luce.png';
import useLuceSpeech from './useLuceSpeech.js';
import VoiceOrb from './VoiceOrb.jsx';
import Composer from './Composer.jsx';

const PREMIUM_PASSWORD = 'Giuseppe095.';

export default function ChatWidget({ className = '' }) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [useCustomVoice, setUseCustomVoice] = useState(false);
  const [interfaceMode, setInterfaceMode] = useState('chat');
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 767px)').matches : false
  );
  const [pendingDocRequest, setPendingDocRequest] = useState(null);
  const [downloadOffer, setDownloadOffer] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { isSpeaking, speakText, unlockAudio } = useLuceSpeech(useCustomVoice);
  const chatThreadRef = useRef(null);
  const isVoiceMode = interfaceMode === 'voice';

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

  const handleSelectChatMode = () => {
    setInterfaceMode('chat');
  };

  const handleSelectVoiceSystem = () => {
    setInterfaceMode('voice');
    setUseCustomVoice(false);
  };

  const handleDownloadOffer = () => {
    if (!downloadOffer?.url) return;
    const link = document.createElement('a');
    link.href = downloadOffer.url;
    link.download = downloadOffer.filename || 'documento';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadOffer(null);
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

  useEffect(() => {
    if (!chatThreadRef.current) return;
    chatThreadRef.current.scrollTo({
      top: chatThreadRef.current.scrollHeight,
      behavior: history.length ? 'smooth' : 'auto',
    });
  }, [history]);

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

    if (isVoiceMode) {
      try {
        unlockAudio();
      } catch (err) {
        console.warn('unlockAudio failed', err);
      }
    }

    setHistory((prev) => [...prev, { user: text, assistant: null }]);
    setInput('');
    setLoading(true);
    setDownloadOffer(null);

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
          if (isVoiceMode) {
            try {
              await speakText(reply);
            } catch (ttsErr) {
              console.warn('TTS reply error:', ttsErr);
            }
          }
        } catch (err) {
          console.error('[handleSend] errore doc confirm:', err);
          const fallback = 'Mi dispiace, non posso leggere quei documenti in questo momento.';
          updateLastAssistantMessage(fallback);
          if (isVoiceMode) {
            setTimeout(() => {
              speakText(fallback, { forceSystem: true }).catch((ttsErr) => console.warn('TTS fallback error:', ttsErr));
            }, 60);
          }
        } finally {
          setPendingDocRequest(null);
          setDownloadOffer(null);
          setLoading(false);
        }
        return;
      }
      if (isNegative(text)) {
        const declineMessage = 'Ricevuto, non consulterò quei documenti. Dimmi pure se ti serve altro.';
        updateLastAssistantMessage(declineMessage);
        setPendingDocRequest(null);
        setDownloadOffer(null);
        if (isVoiceMode) {
          setTimeout(() => {
            speakText(declineMessage).catch((err) => console.warn('TTS decline error:', err));
          }, 60);
        }
        setLoading(false);
        return;
      }
    }

    const analysis = analyzePrompt(text);

    if (analysis.stopModel && analysis.reason === 'cv_request') {
      const message = 'Posso fornirti il suo curriculum. Premi il pulsante per scaricarlo o visualizzarlo.';
      setDownloadOffer({
        label: 'Scarica CV',
        url: cvPdf,
        filename: 'Giuseppe_Rubino_CV.pdf',
      });
      updateLastAssistantMessage(message);
      if (isVoiceMode) {
        setTimeout(() => {
          speakText(message).catch((err) => console.warn('TTS cv_request error:', err));
        }, 60);
      }
      setLoading(false);
      return;
    }

    if (analysis.stopModel && analysis.reason === 'project_doc_confirm') {
      const { project, docPreference } = analysis.data || {};
      if (project && docPreference?.length) {
        const downloadInfo = getDocumentDownloadInfo(project.id, docPreference);
        if (downloadInfo) setDownloadOffer(downloadInfo);
        setPendingDocRequest({ project, docPreference, originalPrompt: text });
        const docsLabel = docPreference
          .map((type) => (type === 'architecture' ? 'Architecture' : 'README'))
          .join(' e ');
        const extra = downloadInfo ? ' Puoi anche scaricarlo con il pulsante qui sotto.' : '';
        const message = `Vuoi che consulti ${docsLabel} del progetto "${project.name}" prima di risponderti?${extra}`;
        updateLastAssistantMessage(message);
        if (isVoiceMode) {
          setTimeout(() => {
            speakText(message).catch((err) => console.warn('TTS doc confirm error:', err));
          }, 60);
        }
        setLoading(false);
        return;
      }
    }

    if (analysis.type === 'irrelevant') {
      const message = 'Preferisco rispondere solo a domande riguardanti il mio portfolio.';
      updateLastAssistantMessage(message);
      if (isVoiceMode) {
        setTimeout(() => {
          speakText(message).catch((err) => console.warn('TTS irrelevant error:', err));
        }, 60);
      }
      setLoading(false);
      return;
    }

    try {
      const reply = await generateAnswer(text, history, { type: analysis.type, data: analysis.data });
      updateLastAssistantMessage(reply);
      if (isVoiceMode) {
        try {
          await speakText(reply);
        } catch (ttsErr) {
          console.warn('TTS reply error:', ttsErr);
        }
      }
    } catch (err) {
      console.error('[handleSend] errore generale:', err);
      const fallback = 'Mi dispiace, si è verificato un errore.';
      updateLastAssistantMessage(fallback);
      if (isVoiceMode) {
        setTimeout(() => {
          speakText(fallback, { forceSystem: true }).catch((ttsErr) => console.warn('TTS fallback error:', ttsErr));
        }, 60);
      }
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

  // legacy: CV/doc download handled via `downloadOffer`

  function closePasswordModal() {
    setShowPasswordModal(false);
    setPasswordInput('');
    setPasswordError('');
  }

  function handleRequestPremium() {
    if (useCustomVoice) {
      setUseCustomVoice(false);
      setInterfaceMode('voice');
      return;
    }
    setInterfaceMode('voice');
    setPasswordInput('');
    setPasswordError('');
    setShowPasswordModal(true);
  }

  function handlePasswordSubmit(e) {
    if (e?.preventDefault) e.preventDefault();
    if (passwordInput === PREMIUM_PASSWORD) {
      setUseCustomVoice(true);
      setInterfaceMode('voice');
      closePasswordModal();
    } else {
      setPasswordError('Password non corretta.');
    }
  }

  const renderThread = () => (
    <div className="min-h-0 rounded-3xl border border-white/70 bg-white/75 shadow-[0_30px_80px_rgba(79,70,229,0.12)] backdrop-blur-xl sm:min-h-[280px] select-text">
      <div
        ref={chatThreadRef}
        className="max-h-[240px] overflow-y-auto space-y-4 p-5 sm:h-[260px] sm:max-h-none sm:p-6 md:h-[300px] select-text"
      >
        <ChatBubble variant="assistant" label="Luce">
          Ciao! Scrivimi una domanda sul portfolio, sui progetti o chiedimi il CV.
        </ChatBubble>
        {history.map((entry, index) => (
          <div key={`entry-${index}`} className="space-y-2">
            {entry.user ? (
              <ChatBubble variant="user" label="Tu">
                {entry.user}
              </ChatBubble>
            ) : null}
            <ChatBubble variant="assistant" label="Luce" pending={!entry.assistant}>
              {entry.assistant ? (
                <>
                  <div>{entry.assistant}</div>
                  {index === history.length - 1 && downloadOffer ? (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Download</span>
                      <button
                        type="button"
                        onClick={handleDownloadOffer}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-indigo-200 bg-white/90 px-4 py-2 text-xs font-semibold text-indigo-700 shadow transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v10m0 0l-3-3m3 3l3-3M5 19h14" />
                        </svg>
                        <span className="truncate">{downloadOffer.label || 'Scarica'}</span>
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <TypingIndicator />
              )}
            </ChatBubble>
          </div>
        ))}
      </div>
    </div>
  );

  const renderComposer = () => (
    <div className="mt-3 sm:mt-4">
      <Composer
        value={input}
        onChange={setInput}
        onKeyDown={handleKeyDown}
        onSubmit={handleSend}
        loading={loading}
      />
    </div>
  );

  const renderSuggestions = () => (
    <div className="relative mt-2 sm:mt-3 overflow-hidden rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-[0_24px_70px_rgba(79,70,229,0.12)]">
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-linear-to-t from-indigo-100/40 via-indigo-50/10 to-transparent"
        aria-hidden
      />
      <p className="relative text-center text-[0.65rem] leading-relaxed text-slate-500 sm:text-xs">
        <span className="block">
          Suggerimenti: "Fammi un tour dei progetti prioritari", "Posso avere il CV?", "Mostrami come funziona Decod".
        </span>
        <span className="block">Nota: le risposte possono non essere sempre precise.</span>
      </p>
    </div>
  );

  const renderConversation = () => (
    <>
      {renderThread()}
      {renderComposer()}
    </>
  );

  return (
    <section className={`flex w-full items-center justify-center px-3 sm:px-4 select-none ${className}`}>
      <div className="relative z-20 w-full max-w-[900px] overflow-hidden rounded-[34px] border border-white/70 bg-linear-to-br from-white/95 via-slate-50/90 to-slate-100/85 p-4 sm:p-6 shadow-[0_35px_100px_rgba(79,70,229,0.16)]">
        <div className="absolute inset-x-6 top-6 h-12 rounded-2xl bg-white/60 blur-2xl" aria-hidden />
        <div className="relative flex flex-col gap-5 xl:gap-6">
          <header className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
              <div className="flex items-center gap-3">
                <img src={luce} alt="Luce" className="h-11 w-11 rounded-2xl border border-white object-cover shadow" />
                <div>
                  <p className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-slate-500">Assistente</p>
                  <h3 className="text-base font-semibold text-slate-900">Luce</h3>
                </div>
              </div>
              <p className="text-[0.85rem] text-slate-600 sm:text-sm md:text-base" aria-hidden />
            </div>
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-wrap items-center'} gap-2`}>
              <button
                type="button"
                aria-pressed={interfaceMode === 'chat'}
                onClick={handleSelectChatMode}
                className={`w-full rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] transition sm:w-auto ${
                  interfaceMode === 'chat'
                    ? 'bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-500 text-white border-indigo-500 shadow-[0_14px_30px_rgba(79,70,229,0.3)]'
                    : 'bg-white/85 text-slate-600 border-slate-200 hover:-translate-y-0.5'
                }`}
              >
                Chat
              </button>
              <button
                type="button"
                aria-pressed={isVoiceMode && !useCustomVoice}
                onClick={handleSelectVoiceSystem}
                className={`w-full rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] transition sm:w-auto ${
                  isVoiceMode && !useCustomVoice
                    ? 'bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-500 text-white border-indigo-500 shadow-[0_14px_30px_rgba(79,70,229,0.3)]'
                    : 'bg-white/85 text-slate-600 border-slate-200 hover:-translate-y-0.5'
                }`}
              >
                Voce del tuo sistema
              </button>
              <button
                type="button"
                aria-pressed={isVoiceMode && useCustomVoice}
                onClick={handleRequestPremium}
                className={`w-full rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] transition sm:w-auto ${
                  isVoiceMode && useCustomVoice
                    ? 'bg-linear-to-r from-indigo-600 via-indigo-500 to-indigo-500 text-white border-indigo-500 shadow-[0_14px_30px_rgba(79,70,229,0.3)]'
                    : 'bg-white/85 text-slate-600 border-slate-200 hover:-translate-y-0.5'
                }`}
              >
                Voce premium
              </button>
            </div>
          </header>
          {interfaceMode === 'chat' ? (
            <>
              {renderConversation()}
              {renderSuggestions()}
            </>
          ) : (
            <div className="rounded-4xl border border-white/70 bg-linear-to-tr from-indigo-50/90 via-white/95 to-slate-50/90 p-6 shadow-[0_30px_80px_rgba(79,70,229,0.18)]">
              <div className="text-center">
                <p className="text-[0.55rem] font-semibold uppercase tracking-[0.35em] text-slate-500">Modalità voce sensoriale</p>
                <h4 className="mt-2 text-lg font-semibold text-slate-900">Ascolta la risposta di Luce</h4>
                <p className="mt-1 text-sm text-slate-600">Scrivi qui sotto, io leggerò a voce usando il tuo sintetizzatore di sistema.</p>
              </div>
              <div className="mt-6 flex flex-col gap-6">
                <div className="flex items-center justify-center py-8">
                  <VoiceOrb isSpeaking={isSpeaking} />
                </div>
                {renderComposer()}
              </div>
            </div>
          )}
        </div>
      </div>
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/60 bg-white p-6 shadow-2xl">
            <h4 className="text-base font-semibold text-slate-900">Abilita voce premium</h4>
            <p className="mt-1 text-sm text-slate-600">Inserisci la password per usare la voce premium.</p>
            <form className="mt-4 space-y-3" onSubmit={handlePasswordSubmit}>
              <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Password
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (passwordError) setPasswordError('');
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 select-text focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Inserisci password"
                  autoFocus
                />
              </label>
              {passwordError && <p className="text-xs font-semibold text-red-500">{passwordError}</p>}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closePasswordModal}
                  className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-indigo-500"
                >
                  Conferma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

function ChatBubble({ variant = 'assistant', label = '', children, pending = false }) {
  const isUser = variant === 'user';
  const alignment = isUser ? 'justify-end' : 'justify-start';
  const bubbleClasses = isUser
    ? 'bg-linear-to-br from-indigo-500/95 via-indigo-500/90 to-indigo-600/90 text-white border border-indigo-300/60 shadow-[0_18px_36px_rgba(79,70,229,0.2)]'
    : 'bg-linear-to-br from-white/95 via-slate-50/90 to-slate-100/90 text-slate-700 border border-white/70 shadow-[0_18px_36px_rgba(15,23,42,0.12)]';
  return (
    <div className={`flex ${alignment}`}>
      <div
        className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm leading-relaxed ${bubbleClasses} ${pending ? 'opacity-80' : ''}`}
      >
        {label ? (
          <p className={`mb-1 text-[0.58rem] font-semibold uppercase tracking-[0.32em] ${isUser ? 'text-white/75' : 'text-slate-500'}`}>
            {label}
          </p>
        ) : null}
        <div className="whitespace-pre-wrap wrap-break-words">{children}</div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <span className="flex items-center gap-1">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:120ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:240ms]" />
      <span className="sr-only">Luce sta scrivendo...</span>
    </span>
  );
}
