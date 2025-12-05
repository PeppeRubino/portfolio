// Floaters.jsx
import React, { useEffect, useRef, useState } from "react";
import './styles/floaters.css'; // aggiungi regole specifiche per i floaters qui

export default function Floaters({
  skills = [],
  containerRef = null,   // il ref dell'elemento che delimita l'area di movimento
  maxItems = 50,
  disabled = false,      // utile per nascondere su mobile
  speedMin = 15.0,
  speedMax = 30.0,
  slow = 1.5,
  margin = 100,
}) {
  const floatersRef = useRef([]);
  const elemRefs = useRef(new Map());
  const rafRef = useRef(null);
  const [paintTick, setPaintTick] = useState(0);

  // inizializza floaters quando cambiano skills o disabled
  useEffect(() => {
    if (!Array.isArray(skills) || skills.length === 0 || disabled) {
      floatersRef.current = [];
      elemRefs.current.clear();
      setPaintTick(t => t + 1);
      return;
    }

    const root = containerRef?.current || document.documentElement;
    const rect = root?.getBoundingClientRect();
    const W = rect ? rect.width : window.innerWidth;
    const H = rect ? rect.height : window.innerHeight;

    const items = skills.slice(0, maxItems).map((s, i) => {
      const x = Math.random() * W;
      const y = Math.random() * H;
      const baseSpeed = speedMin + Math.random() * (speedMax - speedMin);
      const angle = Math.random() * Math.PI * 2;
      const vx = Math.cos(angle) * baseSpeed * slow;
      const vy = Math.sin(angle) * baseSpeed * slow;
      const size = i % 3 === 0 ? 'big' : i % 3 === 1 ? 'mid' : 'small';
      return { id: i, text: s, x, y, vx, vy, size, paused: false };
    });

    floatersRef.current = items;
    setPaintTick(t => t + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skills, maxItems, disabled]);

  // RAF loop
  useEffect(() => {
    if (disabled) return;

    let last = performance.now();
    function step(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      const root = containerRef?.current || document.documentElement;
      const rect = root?.getBoundingClientRect();
      if (!rect) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      const W = rect.width;
      const H = rect.height;

      const arr = floatersRef.current;
      for (let i = 0; i < arr.length; i++) {
        const f = arr[i];
        if (f.paused) continue;
        f.x += f.vx * dt;
        f.y += f.vy * dt;

        if (f.x < -margin) f.x = W + margin;
        else if (f.x > W + margin) f.x = -margin;
        if (f.y < -margin) f.y = H + margin;
        else if (f.y > H + margin) f.y = -margin;

        const el = elemRefs.current.get(f.id);
        if (el) {
          el.style.transform = `translate3d(${f.x}px, ${f.y}px, 0)`;
        }
      }

      rafRef.current = requestAnimationFrame(step);
    }

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [disabled, containerRef, margin]);

  // hover handlers
  function handleEnter(id) {
    const arr = floatersRef.current;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].id === id) {
        arr[i].paused = true;
        const el = elemRefs.current.get(id);
        if (el) el.classList.add('highlight');
        break;
      }
    }
  }
  function handleLeave(id) {
    const arr = floatersRef.current;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].id === id) {
        arr[i].paused = false;
        const el = elemRefs.current.get(id);
        if (el) el.classList.remove('highlight');
        break;
      }
    }
  }

  const floatersForRender = floatersRef.current || [];

  // pointer-events on container should be none; each floater uses pointer-events:auto to allow hover
  return (
    <div className="floaters-layer absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
      {floatersForRender.map((f) => (
        <span
          key={f.id}
          ref={(el) => {
            if (el) {
              elemRefs.current.set(f.id, el);
              el.style.transform = `translate3d(${f.x}px, ${f.y}px, 0)`;
            } else {
              elemRefs.current.delete(f.id);
            }
          }}
          className={`floater ${f.size}`}
          onMouseEnter={() => handleEnter(f.id)}
          onMouseLeave={() => handleLeave(f.id)}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            transform: `translate3d(${f.x}px, ${f.y}px, 0)`,
            pointerEvents: 'auto',
            whiteSpace: 'nowrap',
            willChange: 'transform, opacity',
          }}
        >
          <span
            className="animate-chill"
            style={{
              '--chill-duration': `${40 + (f.id % 8) * 5}s`,
              animationDelay: `${(f.id % 7) * 0.6}s`,
              display: 'inline-block',
            }}
          >
            {f.text}
          </span>
        </span>
      ))}
    </div>
  );
}
