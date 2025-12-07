// Floaters.jsx
import React, { useEffect, useRef, useState } from "react";

const SIZE_CLASS = {
  big: "text-[1.75rem] md:text-[2.35rem] font-semibold",
  mid: "text-[1.12rem] md:text-[1.35rem] font-medium",
  small: "text-base md:text-[1.05rem] font-normal",
};

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
  const [, setPaintTick] = useState(0);

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
        return { id: i, text: s, x, y, vx, vy, size, paused: false, highlighted: false, opacity: 1 };
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
      const wrapMargin = Math.max(margin, 60);
      const fadeZone = Math.max(80, wrapMargin * 0.6);

      for (let i = 0; i < arr.length; i++) {
        const f = arr[i];
        if (f.paused) continue;
        f.x += f.vx * dt;
        f.y += f.vy * dt;

        if (f.x < -wrapMargin) f.x = W + wrapMargin;
        else if (f.x > W + wrapMargin) f.x = -wrapMargin;
        if (f.y < -wrapMargin) f.y = H + wrapMargin;
        else if (f.y > H + wrapMargin) f.y = -wrapMargin;

        let opacity = 0.2;
        if (f.x < 0 || f.x > W) {
          opacity = 0;
        } else if (f.x < fadeZone) {
          opacity = Math.max(0, (f.x / fadeZone) * 0.2);
        } else if (f.x > W - fadeZone) {
          opacity = Math.max(0, ((W - f.x) / fadeZone) * 0.2);
        }
        f.opacity = opacity;

        const el = elemRefs.current.get(f.id);
        if (el) {
          const scale = f.highlighted ? 1.05 : 1;
          el.style.transform = `translate3d(${f.x}px, ${f.y}px, 0) scale(${scale})`;
          el.style.opacity = f.opacity;
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
        arr[i].highlighted = true;
        setPaintTick((t) => t + 1);
        break;
      }
    }
  }
  function handleLeave(id) {
    const arr = floatersRef.current;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].id === id) {
        arr[i].paused = false;
        arr[i].highlighted = false;
        setPaintTick((t) => t + 1);
        break;
      }
    }
  }

  const floatersForRender = floatersRef.current || [];

  // pointer-events on container should be none; each floater uses pointer-events:auto to allow hover
  return (
    <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
      {floatersForRender.map((f) => (
        <span
          key={f.id}
          ref={(el) => {
            if (el) {
              elemRefs.current.set(f.id, el);
              const scale = f.highlighted ? 1.05 : 1;
              el.style.transform = `translate3d(${f.x}px, ${f.y}px, 0) scale(${scale})`;
            } else {
              elemRefs.current.delete(f.id);
            }
          }}
          onMouseEnter={() => handleEnter(f.id)}
          onMouseLeave={() => handleLeave(f.id)}
          className={[
            "absolute left-0 top-0 inline-block select-none pointer-events-auto",
            "text-slate-400/70 tracking-tight will-change-transform transition duration-200",
            SIZE_CLASS[f.size] || SIZE_CLASS.small,
            f.highlighted
              ? "text-indigo-500 drop-shadow-[0_12px_32px_rgba(79,70,229,0.25)]"
              : "hover:text-indigo-400/80"
          ].join(" ")}
          style={{
            transform: `translate3d(${f.x}px, ${f.y}px, 0)`,
            whiteSpace: 'nowrap',
            opacity: f.highlighted ? Math.min(1, (f.opacity ?? 0.2) + 0.5) : (f.opacity ?? 0.2),
          }}
        >
          {f.text}
        </span>
      ))}
    </div>
  );
}
