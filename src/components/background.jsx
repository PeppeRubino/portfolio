import React, { useEffect, useRef, useState } from 'react';
import Sidebar from './sidebar.jsx';
import libraries from '../assets/data/libraries.json';
import projectsData from '../assets/data/projects.json';
import HomePanel from './background/HomePanel.jsx';
import ProjectsPanel from './background/ProjectsPanel.jsx';
import AssistantPanel from './background/AssistantPanel.jsx';
import CreditsPanel from './background/CreditsPanel.jsx';
import SpotlightOverlay from './background/SpotlightOverlay.jsx';

const SPLASH_MS = 1000;

export default function Background() {
  const [projects] = useState(projectsData);
  const [selected, setSelected] = useState(null);
  const [activePanel, setActivePanel] = useState('home');
  const [floatersDisabled, setFloatersDisabled] = useState(false);
  const [shellAnimated, setShellAnimated] = useState(false);
  const [splashDone, setSplashDone] = useState(false);
  const rootRef = useRef(null);
  const token = import.meta.env.VITE_GITHUB_API_KEY;

  useEffect(() => {
    if (activePanel !== 'projects') setSelected(null);
  }, [activePanel]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) {
      setShellAnimated(true);
      setSplashDone(true);
      return;
    }
    const t = setTimeout(() => {
      setShellAnimated(true);
      setSplashDone(true);
    }, SPLASH_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function updateDisabled() {
      setFloatersDisabled(window.innerWidth < 768);
    }
    updateDisabled();
    window.addEventListener('resize', updateDisabled);
    return () => window.removeEventListener('resize', updateDisabled);
  }, []);

  const handleFocusSelection = (focusKey) => {
    const mapping = {
      frontend: { panel: 'projects', id: 'proj-2' },
    backend: { panel: 'microphone' },
      ai: { panel: 'projects', id: 'proj-6' },
      assistant: { panel: 'microphone' },
    };
    const target = mapping[focusKey];
    if (!target) return;
    setActivePanel(target.panel);
    if (target.id) {
      const match = projects.find((proj) => proj.id === target.id);
      if (match) setSelected(match);
    }
  };

  const shellClasses = [
    'relative min-h-screen w-full overflow-hidden',
    'bg-linear-to-b from-[#e6e8ec]/80 via-[#f3f4f6]/80 to-[#d7d9de]/70',
    'backdrop-blur-xl shadow-[0_35px_120px_rgba(15,23,42,0.22)]',
    'transition-all duration-700 ease-out',
    shellAnimated ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-[0.99] blur-sm',
  ].join(' ');

  const disablePanelsFloaters = floatersDisabled || !splashDone;

  const mobileNavButtons = [
    {
      key: 'home',
      label: 'Home',
      subtitle: 'Intro',
      gradient: 'from-white/90 via-slate-50/90 to-slate-100/90',
      text: 'text-slate-900',
    },
    {
      key: 'projects',
      label: 'Progetti',
      subtitle: 'Work',
      gradient: 'from-amber-50/90 via-white to-amber-100/80',
      text: 'text-amber-900',
    },
    {
      key: 'microphone',
      label: 'Assistant',
      subtitle: 'Luce',
      gradient: 'from-emerald-50/90 via-white to-emerald-100/70',
      text: 'text-emerald-900',
    },
    {
      key: 'credits',
      label: 'Credits',
      subtitle: 'CV',
      gradient: 'from-indigo-50/90 via-white to-indigo-100/60',
      text: 'text-indigo-900',
    },
  ];

  return (
    <div ref={rootRef} className={shellClasses}>
      <SpotlightOverlay visible={!splashDone} />

        <div className="md:hidden">
          <nav
            className="fixed inset-x-4 top-4 z-50 flex items-center justify-between gap-3 rounded-[28px] border border-white/60 bg-linear-to-br from-white/95 via-slate-50/90 to-slate-100/85 p-3 shadow-[0_20px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl"
          >
            {mobileNavButtons.map((button) => {
              const active = activePanel === button.key;
              return (
                <button
                  key={button.key}
                  type="button"
                  onClick={() => setActivePanel(button.key)}
                  className={`flex-1 rounded-2xl border border-white/70 bg-linear-to-br ${button.gradient} p-2 text-left transition-all duration-200 ${active ? 'shadow-lg scale-102' : 'hover:-translate-y-0.5'}`}
                  aria-pressed={active}
                >
                  <div className="text-[0.55rem] font-semibold uppercase tracking-[0.3em] text-slate-500">
                    {button.subtitle}
                  </div>
                  <div className={`text-sm font-semibold ${button.text}`}>{button.label}</div>
                </button>
              );
            })}
          </nav>
        </div>

      <div className="relative z-10 flex min-h-screen w-full flex-col md:flex-row">
        <div className="hidden shrink-0 md:flex md:w-20">
          <Sidebar active={activePanel} onChange={setActivePanel} />
        </div>

        <main className="flex-1 px-4 pb-6 pt-22 md:px-6 md:pt-6 lg:px-8">
          <div className="mx-auto w-full max-w-screen">
            {activePanel === 'home' && (
              <HomePanel
                libraries={libraries}
                disabledFloaters={disablePanelsFloaters}
                onSelectFocus={handleFocusSelection}
              />
            )}

            {activePanel === 'projects' && (
              <ProjectsPanel
                projects={projects}
                selected={selected}
                onSelect={setSelected}
                githubToken={token}
              />
            )}

            {activePanel === 'microphone' && (
              <AssistantPanel
                libraries={libraries}
                disabledFloaters={disablePanelsFloaters}
              />
            )}

            {activePanel === 'credits' && (
              <CreditsPanel
                libraries={libraries}
                disabledFloaters={disablePanelsFloaters}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
