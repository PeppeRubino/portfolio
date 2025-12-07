import React, { useEffect, useRef, useState } from 'react';
import Sidebar from './sidebar.jsx';
import libraries from '../assets/data/libraries.json';
import projectsData from '../assets/data/projects.json';
import HomePanel from './background/HomePanel.jsx';
import ProjectsPanel from './background/ProjectsPanel.jsx';
import AssistantPanel from './background/AssistantPanel.jsx';
import CreditsPanel from './background/CreditsPanel.jsx';
import SpotlightOverlay from './background/SpotlightOverlay.jsx';
import SidebarDrawer from './background/SidebarDrawer.jsx';

const SPLASH_MS = 1000;

export default function Background() {
  const [projects] = useState(projectsData);
  const [selected, setSelected] = useState(null);
  const [activePanel, setActivePanel] = useState('home');
  const [sidebarOpenMobile, setSidebarOpenMobile] = useState(false);
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
      backend: { panel: 'projects', id: 'proj-1' },
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
    'bg-gradient-to-b from-[#e6e8ec]/80 via-[#f3f4f6]/80 to-[#d7d9de]/70',
    'backdrop-blur-xl shadow-[0_35px_120px_rgba(15,23,42,0.22)]',
    'transition-all duration-700 ease-out',
    shellAnimated ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-[0.99] blur-sm',
  ].join(' ');

  const disablePanelsFloaters = floatersDisabled || !splashDone;

  return (
    <div ref={rootRef} className={shellClasses}>
      <SpotlightOverlay visible={!splashDone} />

      <div className="relative z-10 flex min-h-screen w-full flex-col md:flex-row">
        <div className="hidden shrink-0 md:flex md:w-20">
          <Sidebar active={activePanel} onChange={setActivePanel} />
        </div>

        <div className="flex items-center justify-between border-b border-white/50 bg-white/50 px-4 py-2 backdrop-blur-md md:hidden">
          <div className="text-sm font-semibold text-slate-800">G. Rubino</div>
          <button
            type="button"
            aria-label="Apri menu"
            onClick={() => setSidebarOpenMobile((prev) => !prev)}
            className="rounded-xl border border-white/60 bg-white/80 p-2 shadow-sm transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <svg className="h-5 w-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M4 6h16M4 12h16M4 18h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <SidebarDrawer
          open={sidebarOpenMobile}
          activePanel={activePanel}
          onSelect={(panel) => {
            setActivePanel(panel);
            setSidebarOpenMobile(false);
          }}
          onClose={() => setSidebarOpenMobile(false)}
        />

        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
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
