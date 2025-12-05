// Background.jsx
import React, { useState, useEffect, useRef } from 'react';
import './styles/background.css';
import Sidebar from './sidebar.jsx';
import ChatWidget from './card_chabot.jsx';
import CardInfo from './card_projects_info.jsx';
import CardLeft from './card_projects.jsx';
import CardHome from './card_home.jsx';
import CardMedia from './card_media.jsx';
import CardCredits from './card_credits.jsx';
import Floaters from './floaters.jsx';
import libraries from '../media/data/libraries.json';

const SPLASH_MS = 1000;


function LibraryAnimation() {
  const maskRef = useRef(null);
  const contentRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const mask = maskRef.current;
    const content = contentRef.current;
    if (!mask || !content) return;

    let y = mask.offsetHeight;
    let last = performance.now();
    let totalHeight = Math.floor(content.offsetHeight / 2);
    let maskHeight = mask.offsetHeight;

    function loop(now) {
      const dt = (now - last) / 1000;
      last = now;

      const currentMaskHeight = mask.offsetHeight;
      const measured = Math.floor(content.offsetHeight / 2);
      if (measured > 0) totalHeight = measured;

      if (currentMaskHeight !== maskHeight) {
        y = currentMaskHeight;
        maskHeight = currentMaskHeight;
      }

      y -= 30 * dt; // speed 30 px/sec
      if (y <= -totalHeight) {
        y += totalHeight;
      }
      content.style.transform = `translateY(${y}px)`;

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={maskRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      <div
        ref={contentRef}
        className="flex flex-col gap-4 will-change-transform text-gray-300 text-lg opacity-20 items-center"
      >
        {/* COPY 1 */}
        {libraries.map((lib, idx) => (
          <div key={"a-" + idx}>{lib}</div>
        ))}
        {/* COPY 2 */}
        {libraries.map((lib, idx) => (
          <div key={"b-" + idx}>{lib}</div>
        ))}
      </div>
    </div>
  );
}

export default function Background() {
  const [projects, setProjects] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activePanel, setActivePanel] = useState('home');
  const [splashDone, setSplashDone] = useState(false);
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
  const [disabledOnMobile, setDisabledOnMobile] = useState(false);
  const rootRef = useRef(null);
  const token = process.env.REACT_GITHUB_TOKEN;


  // refs per le singole aree dove vogliamo i floaters
  const homeRef = useRef(null);
  const chatRef = useRef(null);
  const creditsRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch('/data/projects.json');
        const data = await res.json();
        if (mounted) setProjects(data);
      } catch (e) {
        console.error('Errore caricamento projects.json', e);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (activePanel !== 'projects') setSelected(null);
  }, [activePanel]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    root.classList.add('apple-reveal');
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      root.classList.add('animate');
      setSplashDone(true);
      return;
    }
    const t = setTimeout(() => {
      root.classList.add('animate');
      setSplashDone(true);
    }, SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  // disable floaters on small screens
  useEffect(() => {
    function updateDisabled() {
      setDisabledOnMobile(window.innerWidth < 768);
    }
    updateDisabled();
    window.addEventListener('resize', updateDisabled);
    return () => window.removeEventListener('resize', updateDisabled);
  }, []);

  return (
    <div ref={rootRef} className="general-background apple-reveal min-h-screen flex flex-col md:flex-row">
      {/* Splash overlay */}
      {!splashDone && (
        <div className="spotlight-overlay" aria-hidden="true">
          <div className="spotlight-bg" />
          <div className="spotlight-center">
            <div className="dev-name">G. Rubino</div>
            <div className="spotlight-sweep" />
          </div>
        </div>
      )}

      {/* Sidebar desktop */}
      <div className="hidden md:flex md:flex-col md:shrink-0 md:w-20">
        <Sidebar active={activePanel} onChange={setActivePanel} />
      </div>

      {/* Top bar mobile (hamburger) */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <div className="text-sm font-medium text-gray-800">G. Rubino</div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Apri menu"
            onClick={() => setSidebarOpenMobile(s => !s)}
            className="p-2 rounded-md focus:outline-none focus:ring"
          >
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Overlay sidebar mobile — width ridotta + background semitrasparente */}
      {sidebarOpenMobile && (
        <div
          className="md:hidden fixed inset-0 z-40 "
          onClick={() => setSidebarOpenMobile(false)}
        >
          {/* backdrop: meno scuro per far vedere che è un overlay leggero */}
          <div className="absolute inset-0 bg-black/20" />

          {/* sidebar drawer: larghezza leggermente più piccola e sfondo semi-trasparente con blur */}
          <div
            className="absolute left-0 top-0 bottom-0 w-full bg-white/35 backdrop-blur-sm p-4 shadow-lg"
            onClick={(e) => e.stopPropagation()}
            style={{ borderRight: '1px solid rgba(0,0,0,0.06)' }}
          >
            <Sidebar
              active={activePanel}
              onChange={(p) => { setActivePanel(p); setSidebarOpenMobile(false); }}
            />
          </div>
        </div>
      )}

      {/* Main content: centriamo orizzontalmente con un max-width per evitare spostamenti a destra */}
      <main className="flex-1 px-4 md:px-6 lg:px-8 py-6">
        <div className="w-full max-w-screen mx-auto"> {/* <-- questo centra il contenuto su desktop */}

          {activePanel === 'home' && (
            <div className="w-full flex items-center justify-center py-8">
              {/* wrapper relativo: qui limitiamo i floaters alla card home */}
              <div ref={homeRef} className="w-full max-w-[1000px] mx-auto flex items-center justify-center min-h-[60vh] relative">
                <Floaters
                  skills={libraries}
                  containerRef={homeRef}
                  maxItems={20}
                  disabled={disabledOnMobile || !splashDone}
                  speedMin={7}
                  speedMax={18}
                  slow={1}
                  margin={40}
                />
                <CardHome className="w-full" />
              </div>
            </div>
          )}

{activePanel === 'projects' && (
  <div className="h-full">
    {/* Grid responsive: 1 colonna su mobile, 3 colonne uguali su md+ */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      {/* LEFT column (lista) */}
      <div className="w-full">
        <CardLeft projects={projects} onSelect={setSelected} selectedId={selected?.id} />
      </div>

      {/* MIDDLE column (info) */}
      <div className="w-full flex items-start justify-center">
        <div className="w-full">
          {selected ? (
            <CardInfo project={selected} onClose={() => setSelected(null)} githubToken={token} />
          ) : (
            <div className="">
            </div>
          )}
        </div>
      </div>

      {/* RIGHT column (media) */}
      <div className="w-full flex items-start justify-center">
        <div className="w-full">
          {selected ? (
            <CardMedia project={selected} />
          ) : (
            <div className="">
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}


          {activePanel === 'microphone' && (
            <div className="w-full h-full relative flex items-center justify-center">
              {/* wrapper relativo per il chat widget */}
              <div ref={chatRef} className="relative w-full max-w-[900px] mx-auto min-h-[60vh] flex items-center justify-center">
                <Floaters
                  skills={libraries}
                  containerRef={chatRef}
                  maxItems={18}
                  disabled={disabledOnMobile || !splashDone}
                  speedMin={6}
                  speedMax={14}
                  slow={1}
                  margin={30}
                />
                <ChatWidget className="" />
              </div>
            </div>
          )}

          {activePanel === 'credits' && (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="max-w-xl text-center relative flex items-center justify-center min-h-[60vh]">
                <LibraryAnimation />
                {/* wrapper relativo per credits */}
                <div ref={creditsRef} className="relative w-full">
                  <Floaters
                    skills={libraries}
                    containerRef={creditsRef}
                    maxItems={14}
                    disabled={disabledOnMobile || !splashDone}
                    speedMin={5}
                    speedMax={12}
                    slow={1}
                    margin={20}
                  />
                  <CardCredits />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
