import React, { useEffect, useRef, useState } from "react";
import { generateAnswer } from "../utils/llm_wrapper.jsx";
import { analyzePrompt } from "../utils/knowledge.js";
import luce from "../media/img/luce.png";


export default function ChatWidget({ className = "" }) {
  const [input, setInput] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCvButton, setShowCvButton] = useState(false);

  // controllo tipo di voce (default: false -> usa voce di sistema / Windows)
  const [useCustomVoice, setUseCustomVoice] = useState(false);

  const messagesRef = useRef(null);
  const utteranceRef = useRef(null);
  // NEW: ref per sbloccare audio (evitiamo multiple unlock)
  const audioUnlockedRef = useRef(false);

  useEffect(() => {
    return () => {
      if (window?.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [history, loading]);

  // === unlock audio: da chiamare dentro gesto utente per bypassare policy autoplay ===
  function unlockAudio() {
    try {
      if (audioUnlockedRef.current) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        console.debug("[unlockAudio] Web Audio API non disponibile");
        audioUnlockedRef.current = true;
        return;
      }
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      g.gain.value = 0; // silenzioso
      o.connect(g);
      g.connect(ctx.destination);
      o.start(0);
      setTimeout(() => {
        try { o.stop(); } catch (e) { }
        try { ctx.close(); } catch (e) { }
      }, 50);
      audioUnlockedRef.current = true;
      console.debug("[unlockAudio] audio sbloccato");
    } catch (e) {
      console.warn("[unlockAudio] errore", e);
      audioUnlockedRef.current = true;
    }
  }

  // === TTS con selezione voce italiana opzionale ===
  // sostituisci l'esistente speakText con questa
  async function speakText(text) {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      console.warn("SpeechSynthesis non disponibile");
      return;
    }

    console.debug("[speakText] chiamata con testo:", text);

    // attendi voices (come prima)
    const ensureVoices = () => new Promise(resolve => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length) return resolve(v);
      const onVoices = () => {
        const vs = window.speechSynthesis.getVoices();
        if (vs && vs.length) {
          window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
          return resolve(vs);
        }
        window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
        return resolve([]);
      };
      window.speechSynthesis.addEventListener("voiceschanged", onVoices);
      setTimeout(() => {
        const vs = window.speechSynthesis.getVoices() || [];
        window.speechSynthesis.removeEventListener("voiceschanged", onVoices);
        resolve(vs);
      }, 700);
    });

    const voices = await ensureVoices();

    // Se c'è già qualcosa in riproduzione, cancel + piccolo delay per stabilizzare.
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      try {
        window.speechSynthesis.cancel();
        // aspetta un attimo per far scatenare gli eventuali eventi di cleanup
        await new Promise(r => setTimeout(r, 40));
      } catch (e) {
        console.warn("[speakText] cancel() ha fallito", e);
      }
    }

    const utter = new SpeechSynthesisUtterance(text);

    // scegli voce (manteniamo la logica esistente)
    const preferred = ["Elsa", "Elisa", "Lucia", "Maria"];
    const italianVoices = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith("it"));
    let chosen = null;
    if (useCustomVoice) {
      chosen = voices.find(v => preferred.some(p => v.name.includes(p)) && v.lang && v.lang.toLowerCase().startsWith("it"))
        || italianVoices[0] || voices[0] || null;
    } else {
      // non forziamo utter.voice così il browser userà la voce di sistema; ma se vuoi suggerire:
      chosen = voices.find(v => v.default) || italianVoices[0] || null;
    }
    if (chosen && useCustomVoice) utter.voice = chosen;

    utter.lang = "it-IT";
    utter.rate = 0.95;

    // safety: evita risolvere infinitamente; fallback timeout
    const SAFETY_TIMEOUT = 15000; // 15s

    return new Promise((resolve, reject) => {
      let finished = false;
      const cleanup = () => {
        finished = true;
        try { utter.onstart = utter.onend = utter.onerror = null; } catch (e) { }
      };

      const finishOk = () => {
        if (finished) return;
        cleanup();
        setIsSpeaking(false);
        resolve();
      };

      const finishErr = (ev) => {
        if (finished) return;
        cleanup();
        setIsSpeaking(false);
        // se l'errore è "interrupted" consideralo ok (non rigettiamo)
        const errName = ev && ev.error ? ev.error : (ev && ev.type) ? ev.type : null;
        if (errName === "interrupted") {
          console.warn("[speakText] utter interrupted (ignored)", ev);
          return resolve();
        }
        console.error("[speakText] onerror non-interrupted", ev);
        return reject(ev);
      };

      utter.onstart = () => {
        console.debug("[speakText] started speaking");
        setIsSpeaking(true);
      };
      utter.onend = () => {
        console.debug("[speakText] finished speaking");
        finishOk();
      };
      utter.onerror = (ev) => {
        console.debug("[speakText] error event:", ev);
        finishErr(ev);
      };

      // safety timeout
      const to = setTimeout(() => {
        if (!finished) {
          console.warn("[speakText] safety timeout reached, resolving");
          finishOk();
        }
        clearTimeout(to);
      }, SAFETY_TIMEOUT);

      try {
        window.speechSynthesis.speak(utter);
      } catch (err) {
        console.error("[speakText] speak() threw", err);
        finishErr(err);
      }
    });
  }


  async function handleSend(e) {
    if (e?.preventDefault) e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    // IMPORTANT: sblocchiamo audio ADESSO, dentro il gesto utente
    try { unlockAudio(); } catch (err) { console.warn("unlockAudio failed", err); }

    // append user message to history (assistant null placeholder)
    setHistory(h => [...h, { user: text, assistant: null }]);
    setInput("");
    setLoading(true);

    // debug
    console.debug("[handleSend] user input:", text, "audioUnlocked:", audioUnlockedRef.current);

    // analizza intent prima di chiamare il modello
    const analysis = analyzePrompt(text);

    // CV request -> blocco e mostra bottone (non chiamare il modello)
    if (analysis.stopModel && analysis.reason === "cv_request") {
      setShowCvButton(true);
      const msg = "Posso fornirti il mio curriculum. Premi il pulsante per scaricarlo o visualizzarlo.";

      // aggiorna la history con messaggio guida (senza audio)
      setHistory(h => {
        const copy = [...h];
        const last = copy.length - 1;
        copy[last] = {
          ...copy[last],
          assistant: msg
        };
        return copy;
      });

      // Parla il messaggio (timeout breve per evitare race con React)
      setTimeout(() => {
        speakText(msg).catch(err => console.warn("TTS cv_request error:", err));
      }, 50);

      setLoading(false);
      return;
    }

    if (analysis.type === "irrelevant") {
      const msg = "Preferisco rispondere solo a domande riguardanti il mio portfolio.";

      // non rispondere con audio — solo testo gentile (ma poi attiviamo TTS)
      setHistory(h => {
        const copy = [...h];
        const last = copy.length - 1;
        copy[last] = {
          ...copy[last],
          assistant: msg
        };
        return copy;
      });

      // Parla il messaggio (timeout breve per evitare race con React)
      setTimeout(() => {
        speakText(msg).catch(err => console.warn("TTS irrelevant error:", err));
      }, 50);

      setLoading(false);
      return;
    }

    try {
      // Passiamo il context (project / about / projects_list) al generateAnswer
      const reply = await generateAnswer(text, history, { type: analysis.type, data: analysis.data });

      // aggiorniamo la history con la risposta
      setHistory(h => {
        const copy = [...h];
        const last = copy.length - 1;
        copy[last] = { ...copy[last], assistant: reply };
        return copy;
      });

      // TTS (solo se non siamo in irrelevant, e non per il cv_request)
      // speakText ora dovrebbe partire senza blocchi grazie a unlockAudio() chiamato sopra
      try {
        await speakText(reply);
      } catch (ttsErr) {
        console.warn("TTS reply error:", ttsErr);
      }
    } catch (err) {
      console.error("[handleSend] errore generale:", err);
      const fallback = "Mi dispiace, si è verificato un errore.";
      setHistory(h => {
        const copy = [...h];
        const last = copy.length - 1;
        copy[last] = { ...copy[last], assistant: fallback };
        return copy;
      });

      // anche per il fallback proviamo a parlare
      setTimeout(() => {
        speakText(fallback).catch(e => console.warn("TTS fallback error:", e));
      }, 50);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // Simple CV download handler (adatta path)
  function handleDownloadCV() {
    const url = "/data/Giuseppe_Rubino_CV.pdf";
    const a = document.createElement("a");
    a.href = url;
    a.download = "Giuseppe_Rubino_CV.pdf";
    a.click();
  }

  return (
    <section className="w-full flex items-center justify-center my-16">
      <div className="w-full max-w-md p-6 rounded-3xl bg-linear-to-b from-gray-50 to-gray-100">
        <div className="flex flex-col items-center justify-center gap-6">

          {/* Header controls: mic + voice toggle */}
          <div className="w-full flex items-center justify-between pb-2">
            <div className="flex items-center gap-4">
              <div
                className={`relative w-10 h-10 rounded-full overflow-hidden bg-white shadow-lg ${isSpeaking ? "scale-105" : ""
                  }`}
              >
                <img src={luce} alt="avatar" className="w-full h-full object-cover" />
              </div>


              <div className="text-sm text-gray-600">Luce</div>
            </div>

            {/* Voice toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUseCustomVoice(v => !v)}
                className={`px-3 py-1 rounded-full text-sm transition ${useCustomVoice ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700"}`}
                aria-pressed={useCustomVoice}
                type="button"
              >
                {useCustomVoice ? "Voce Personalizzata" : "Voce del tuo Sistema"}
              </button>
            </div>
          </div>

          {/* MICROFONO + (solo ripple circles) - aumentata separazione dal header */}
          <div className="relative flex flex-col items-center gap-6 w-full mt-4">
            <div className={`relative p-6 rounded-full bg-white shadow-lg transition-all duration-300 mb-10 ${isSpeaking ? "scale-110" : ""}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-700" viewBox="0 0 24 24" fill="currentColor">
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

            {/* niente onde orizzontali qui */}
          </div>

          {/* Area relativa: qui inseriamo il pulsante CV in posizione assoluta
              in modo che compaia sopra la chat senza spostare gli altri elementi */}
          <div className="relative w-full">


            {/* Input (form) – questo rimane nel flow normale */}
            <form onSubmit={handleSend} className="w-full relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Scrivi un messaggio e premi Invio..."
                rows={2}
                disabled={loading}
                className="w-full resize-none rounded-2xl bg-white/95 px-6 py-4 pr-16 text-gray-800 placeholder-gray-400 shadow-xl focus:outline-none focus:ring-4 focus:ring-gray-300/50 transition-all duration-200 text-lg"
              />

              {showCvButton && (
                <button
                  onClick={handleDownloadCV}
                  type="button"
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-indigo-700 border border-indigo-200 text-sm font-medium shadow hover:bg-indigo-50 transition"
                  aria-label="Scarica il curriculum di Giuseppe Rubino"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  CV
                </button>
              )}
            </form>



          </div>

        </div>
      </div>
    </section>
  );

}
