// src/components/CardHome.jsx
import React, { useState, useEffect, useRef } from "react";
import me from '../assets/media/me.png';
import brandingIcon from '../assets/media/icona.png';

/* Typewriter (React-friendly, con cursor lampeggiante) */
function Typewriter({ words = [], delay = 2000, className = "" }) {
  const [index, setIndex] = useState(0);       // quale parola
  const [subIndex, setSubIndex] = useState(0); // quanti caratteri mostrati
  const [deleting, setDeleting] = useState(false);
  const [blink, setBlink] = useState(true);

  // velocità base (ms) — puoi modificare
  const TYPING_SPEED = 60;
  const DELETING_SPEED = 90;
  const RANDOM_JITTER = 80; // per rendere meno "meccanico"

  // typing / deleting effect
  useEffect(() => {
    if (!words || words.length === 0) return;

    const current = words[index];
    let timeoutId;

    if (!deleting) {
      // typing forward
      if (subIndex < current.length) {
        const jitter = Math.floor(Math.random() * RANDOM_JITTER);
        timeoutId = setTimeout(() => setSubIndex((s) => s + 1), TYPING_SPEED + jitter);
      } else {
        // parola completata -> attesa prima di cancellare
        timeoutId = setTimeout(() => setDeleting(true), delay);
      }
    } else {
      // deleting
      if (subIndex > 0) {
        const jitter = Math.floor(Math.random() * (RANDOM_JITTER / 2));
        timeoutId = setTimeout(() => setSubIndex((s) => s - 1), DELETING_SPEED + jitter);
      } else {
        // parola cancellata -> passa alla successiva
        setDeleting(false);
        setIndex((i) => (i + 1) % words.length);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [subIndex, index, deleting, delay, words]);

  // cursore lampeggiante
  useEffect(() => {
    const id = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(id);
  }, []);

  // rendering (aria-live per screen reader)
  const visible = words && words.length ? words[index].substring(0, subIndex) : "";
  return (
    <span className={`inline-flex items-center ${className}`} aria-live="polite">
      <span className="typewriter-text">{visible}</span>
      <span className="typewriter-cursor" aria-hidden>{blink ? "|" : " "}</span>
    </span>
  );
}

/* CardHome: versione senza floaters */
export function CardHome({
  name = "Giuseppe Rubino",
  roles = [
    "AI transcription & diarization",
    "LLM + automation pipelines",
    "Synthetic ecosystem simulations",
    "Full-stack product delivery",
    "Vision-guided desktop apps",
  ],
  bio = "Full-stack engineer con background in Scienze e Tecniche Psicologiche: progetto web app end-to-end, modelli neurali e sistemi AI generativi. Mi piace trasformare i brief in prototipi e MVP rapidi, curando UX, API e deploy.",
  onSelectFocus = () => {}
}) {
  const wrapperRef = useRef(null);

  // mobile detection (solo per comportamento futuro o adattamenti CSS/JS)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.matchMedia('(pointer: coarse), (max-width: 768px)').matches);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div ref={wrapperRef} className="card-wrapper relative w-full flex justify-center items-center" style={{ minHeight: 420 }}>
      {/* NOTA: floaters rimossi — qui resta solo la card principale */}

      <aside
          className="relative z-10 h-full w-full max-w-4xl rounded-4xl border border-white/60 bg-linear-to-br from-white/95 via-slate-50/90 to-slate-100/80 p-6 md:p-10 shadow-[0_25px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl"
      >
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-8 select-none">
          <div
            className="w-32 h-32 md:w-44 md:h-44 rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(15,23,42,0.2)] ring-4 ring-white/40"
            style={{ flexShrink: 0 }}
          >
            <img
              src={me}
              alt="Foto profilo"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="flex-1 flex flex-col gap-5 select-none">
              <div className="flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-gray-500">
            Full-stack / AI engineering
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden />
          </div>
              <div className="flex flex-col md:flex-row md:items-end md:gap-3">
                <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">{name}</h1>
                <span className="text-sm font-medium text-slate-500">Autodidatta · Nato il 21·11·1995</span>
              </div>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed">
                {bio}
              </p>
              <p className="text-sm text-slate-500 leading-relaxed">
                Sul sito trovi anche{" "}
                <button
                  type="button"
                  onClick={() => onSelectFocus('assistant')}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold text-indigo-700 bg-white/90 border border-indigo-100 shadow-[0_12px_30px_rgba(79,70,229,0.15)] hover:shadow-[0_16px_36px_rgba(79,70,229,0.25)] transition"
                >
                  Luce
                </button>
                , il mio assistente AI pronta a guidarti tra i progetti in tempo reale.
              </p>
              <div className="text-sm text-indigo-600 font-semibold flex items-center gap-2">
                <span>Focus:</span>
                <Typewriter words={roles} delay={1400} className="font-semibold text-slate-900" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 select-none md:grid-cols-3">
              {[
                { title: "Frontend", chip: "UI Layer", items: ["React", "Vite", "Tailwind"], key: "frontend" },
                { title: "Backend & Ops", chip: "APIs & Deploy", items: ["Node.js", "Python", "REST/API"], key: "backend" },
                { title: "AI / Automation", chip: "LLM & CV", items: ["LLM", "Whisper", "Computer Vision"], key: "ai" },
              ].map((block) => (
                <button
                  key={block.title}
                  type="button"
                  onClick={() => onSelectFocus(block.key)}
                  className="flex h-full flex-col rounded-[22px] border border-white/60 bg-linear-to-br from-indigo-50/90 via-white to-white/95 p-4 text-left shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 cursor-pointer"
                >
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
                    {block.chip}
                  </div>
                  <div className="text-base font-semibold text-slate-900">{block.title}</div>
                  <div className="flex-1 text-sm leading-6 text-slate-600">{block.items.join(" / ")}</div>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="https://github.com/PeppeRubino"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-5 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition duration-150 hover:-translate-y-0.5 cursor-pointer"
              >
                GitHub
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-5 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition duration-150 hover:-translate-y-0.5 cursor-pointer"
              >
                LinkedIn
              </a>
              <a
                href="mailto:peppe.rubino95@gmail.com"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-5 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition duration-150 hover:-translate-y-0.5 cursor-pointer"
              >
                Contattami
              </a>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default CardHome;
