import { useCallback, useEffect, useRef, useState } from 'react';

export default function useLuceSpeech(useCustomVoice = false) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioUnlockedRef = useRef(false);

  useEffect(() => () => {
    if (window?.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const unlockAudio = useCallback(() => {
    try {
      if (audioUnlockedRef.current) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) {
        audioUnlockedRef.current = true;
        return;
      }
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(0);
      setTimeout(() => {
        try { osc.stop(); } catch { }
        try { ctx.close(); } catch { }
      }, 50);
      audioUnlockedRef.current = true;
    } catch (err) {
      console.warn('[unlockAudio] errore', err);
      audioUnlockedRef.current = true;
    }
  }, []);

  const speakText = useCallback(async (text = '') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('SpeechSynthesis non disponibile');
      return;
    }

    const ensureVoices = () => new Promise((resolve) => {
      const existing = window.speechSynthesis.getVoices();
      if (existing && existing.length) return resolve(existing);
      const handler = () => {
        const loaded = window.speechSynthesis.getVoices();
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(loaded || []);
      };
      window.speechSynthesis.addEventListener('voiceschanged', handler);
      setTimeout(() => {
        const loaded = window.speechSynthesis.getVoices() || [];
        window.speechSynthesis.removeEventListener('voiceschanged', handler);
        resolve(loaded);
      }, 700);
    });

    const voices = await ensureVoices();

    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      try {
        window.speechSynthesis.cancel();
        await new Promise((resolve) => setTimeout(resolve, 40));
      } catch (err) {
        console.warn('[speakText] cancel() ha fallito', err);
      }
    }

    const utter = new SpeechSynthesisUtterance(text);
    const basePreferred = ['Lucia', 'Elisa', 'Maria', 'Elsa'];
    const customPreferred = ['Giorgia', 'Paola', 'Alice', 'Isabella'];
    const italianVoices = voices.filter(
      (voice) => voice.lang && voice.lang.toLowerCase().startsWith('it'),
    );

    let chosen = null;
    if (useCustomVoice) {
      chosen =
        voices.find(
          (voice) =>
            customPreferred.some((name) => voice.name.includes(name)) &&
            voice.lang &&
            voice.lang.toLowerCase().startsWith('it'),
        ) ||
        italianVoices[0] ||
        voices[0] ||
        null;
    } else {
      chosen =
        voices.find(
          (voice) =>
            basePreferred.some((name) => voice.name.includes(name)) &&
            voice.lang &&
            voice.lang.toLowerCase().startsWith('it'),
        ) ||
        italianVoices.find((voice) =>
          basePreferred.some((name) => voice.name.includes(name)),
        ) ||
        italianVoices[0] ||
        voices.find((voice) => voice.default) ||
        null;
    }

    if (chosen) utter.voice = chosen;
    utter.lang = 'it-IT';
    utter.rate = 1.15;

    const SAFETY_TIMEOUT = 15000;

    return new Promise((resolve, reject) => {
      let finished = false;
      const cleanup = () => {
        finished = true;
        try {
          utter.onstart = null;
          utter.onend = null;
          utter.onerror = null;
        } catch { }
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
        const errName = ev && ev.error ? ev.error : ev?.type;
        if (errName === 'interrupted') {
          return resolve();
        }
        return reject(ev);
      };

      utter.onstart = () => setIsSpeaking(true);
      utter.onend = finishOk;
      utter.onerror = finishErr;

      const timeoutId = setTimeout(() => {
        if (!finished) {
          console.warn('[speakText] safety timeout reached');
          finishOk();
        }
        clearTimeout(timeoutId);
      }, SAFETY_TIMEOUT);

      try {
        window.speechSynthesis.speak(utter);
      } catch (err) {
        console.error('[speakText] speak() threw', err);
        finishErr(err);
      }
    });
  }, [useCustomVoice]);

  return { isSpeaking, speakText, unlockAudio };
}
