// File: src/components/Sidebar.jsx
import React, { useMemo, useEffect, useState } from 'react';
import './styles/sidebar.css';

export default function Sidebar({ active, onChange, widthClass = 'w-20' }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // mount animation trigger (staggered by CSS using --delay)
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const buttons = useMemo(
    () => [
      { key: 'home', label: 'Home', title: 'Home', icon: HomeIcon },
      { key: 'projects', label: 'Projects', title: 'Projects', icon: ProjectsIcon },
      { key: 'microphone', label: 'Microphone', title: 'Microphone', icon: MicrophoneIcon },
      { key: 'credits', label: 'Credits', title: 'Credits', icon: CreditsIcon },
    ],
    []
  );

  return (
    <nav
      aria-label="Main sidebar"
      className={`
        fixed left-0 top-0 h-full ${widthClass}
        flex flex-col items-center py-6
        backdrop-blur-sm rounded-r-2xl z-40
        ${mounted ? 'buttons-mounted' : ''}
      `}
      style={{
        background: "linear-gradient(180deg,#fafafa,#efefef)",
        boxShadow: "4px 0 12px rgba(15,23,42,0.06)"
      }}
    >
      <div className="flex flex-col space-y-5 mt-2">
        {buttons.map((b, idx) => {
          const selected = active === b.key;

          return (
            <button
              key={b.key}
              title={b.title}
              aria-pressed={selected}
              onClick={() => onChange(selected ? null : b.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(selected ? null : b.key);
                }
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                // update CSS vars used by the highlight
                e.currentTarget.style.setProperty('--mx', `${x}px`);
                e.currentTarget.style.setProperty('--my', `${y}px`);
              }}
              // --delay used for staggered mount animation
              style={{
                ['--delay']: `${idx * 70}ms`,
                background: selected
                  ? "linear-gradient(180deg,#ffffff,#f3f4f6)"
                  : "linear-gradient(180deg,#fafafa,#efefef)",
                boxShadow: selected
                  ? "0 6px 14px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.6)"
                  : "0 4px 10px rgba(15,23,42,0.05)",
              }}
              className={`
                reveal-wrapper
                w-14 h-14 rounded-2xl flex items-center justify-center
                transition-transform duration-300 relative focus:outline-none
                ${selected
                  ? "selected-btn"
                  : "not-selected-btn"}
              `}
            >
              {/* Apple Reveal highlight */}
              <div
                className="reveal-highlight"
                style={{
                  left: 'var(--mx, 50%)',
                  top: 'var(--my, 50%)',
                }}
              />

              {/* subtle pressed bloom (layer above highlight, below icon) */}
              <div className="reveal-press" aria-hidden="true" />

              <b.icon className="w-7 h-7 text-gray-700 relative z-10" aria-hidden="true" />
              <span className="sr-only">{b.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-auto mb-4 text-xs text-gray-400">G. Rubino</div>
    </nav>
  );
}

/* --- Icon components --- */

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 10.5L12 4l9 6.5" />
      <path d="M5 21V11.5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1V21" />
    </svg>
  );
}

function ProjectsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="14" rx="2" />
      <path d="M8 8h8" />
    </svg>
  );
}

function MicrophoneIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 1v11" />
      <path d="M19 11a7 7 0 0 1-14 0" />
      <path d="M12 21v2" />
    </svg>
  );
}

function CreditsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="8" r="3" />
      <path d="M21 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
    </svg>
  );
}
