// src/components/CardHome.jsx
import React, { useState, useEffect, useRef } from "react";
import me from '../media/img/me.png';
import './styles/card_home.css'; // stili non-animazione (sizing, hover, media queries)

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
    <span className={`typewriter inline-flex items-center ${className}`} aria-live="polite">
      <span className="typewriter-text">{visible}</span>
      <span className="typewriter-cursor" aria-hidden>{blink ? "│" : " "}</span>
    </span>
  );
}

/* CardHome: versione senza floaters */
export function CardHome({
  name = "Giuseppe Rubino",
  roles = [
    "Bachelor in Psychology",
    "AI-powered Developer",
    "Web & Frontend dev",
    "Automation (Python, SikuliX)",
    "GitHub / Project Enthusiast",
    "Creative Technologist"
  ],
  bio = "Dottore in Scienze e Tecniche Psicologiche (110 e lode) con formazione autonoma in IA, sviluppo software e data analysis, specializzato in modelli neurali, automazioni e web app."
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
        className="card h-full w-full max-w-md p-6 backdrop-blur-sm rounded-2xl nmj animate-fadeIn relative z-10"
        style={{
          background: 'linear-gradient(180deg,#ffffffcc,#f3f4f6cc)',
          boxShadow: '0 10px 30px rgba(15,23,42,0.12)'
        }}
      >
        <div className="h-full flex flex-col relative z-10">
          <header className="mb-6 text-center">
            <img
              src={me}
              alt="Foto profilo"
              className="w-24 h-24 md:w-32 md:h-32 rounded-full mx-auto mb-4 shadow-md animate-photoEntrance"
              style={{ objectFit: 'cover' }}
            />
            <h1 className="text-xl md:text-2xl font-semibold text-gray-800 animate-slideUp">{name}</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1 animate-slideUp">
              <span className="inline-flex items-center gap-1">I'm <Typewriter words={roles} delay={1500} /></span>
            </p>
          </header>

          <section className="flex-1">
            <p className="text-gray-600 text-center mb-6 animate-fadeIn delay-400">{bio}</p>
            <div className="flex justify-center space-x-4 flex-wrap">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-indigo-600 transition transform hover:scale-110 hover:rotate-3 animate-bounceIn"
              >
                GitHub
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-indigo-600 transition transform hover:scale-110 hover:rotate-3 animate-bounceIn delay-200"
              >
                LinkedIn
              </a>
              <a
                href="mailto:email@example.com"
                className="text-gray-500 hover:text-indigo-600 transition transform hover:scale-110 hover:rotate-3 animate-bounceIn delay-400"
              >
                Contattami
              </a>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}

export default CardHome;
