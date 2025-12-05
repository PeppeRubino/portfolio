import React, { useEffect, useRef, useState } from "react";

export default function CardCredits({
  title = "Credits",
  sections = [
    {
      title: "Development",
      items: [
        "Giuseppe Rubino – Lead Developer",
        "AI/ML Systems",
        "Frontend Architecture"
      ]
    },
    {
      title: "Design",
      items: ["UI/UX Concepts", "Interaction Design"]
    },
    {
      title: "Special Thanks",
      items: ["Open Source Community", "Psychology & Cognitive Science Dept."]
    }
  ],
  speed = 30 // px/sec
}) {
  const wrapperRef = useRef(null);
  const maskRef = useRef(null);
  const contentRef = useRef(null);
  const rafRef = useRef(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const mask = maskRef.current;
    const content = contentRef.current;
    if (!mask || !content) return;

    let y = mask.offsetHeight; // Start with text below the visible area
    let last = performance.now();
    let totalHeight = Math.floor(content.offsetHeight / 2);
    let maskHeight = mask.offsetHeight;

    function loop(now) {
      const dt = (now - last) / 1000;
      last = now;

      // Update measurements in case of resize or font load
      const currentMaskHeight = mask.offsetHeight;
      const measured = Math.floor(content.offsetHeight / 2);
      if (measured > 0) totalHeight = measured;

      // If mask height changes (e.g., due to resize), reset y to new mask height to restart from bottom
      if (currentMaskHeight !== maskHeight) {
        y = currentMaskHeight;
        maskHeight = currentMaskHeight;
      }

      if (!paused && totalHeight > 0) {
        y -= speed * dt;
        // When we've scrolled one copy, cycle by adding the height of one copy
        if (y <= -totalHeight) {
          y += totalHeight;
        }
        content.style.transform = `translateY(${y}px)`;
      } else {
        // Keep the transform when paused to avoid jumps on resume
        content.style.transform = `translateY(${y}px)`;
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [paused, speed, sections]); // Restart if sections change

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="relative w-full flex justify-center items-center min-h-[340px] md:min-h-[480px] p-4 md:p-6"
    >
      <div className="
        w-full max-w-sm md:max-w-lg
        p-4 md:p-6
        rounded-2xl md:rounded-3xl
        shadow-md md:shadow-xl
        backdrop-blur-sm
        relative z-10
        bg-[linear-gradient(180deg,#ffffffcc,#f3f4f6cc)]
      ">
        {/* Title */}
        <h2 className="text-center text-lg md:text-2xl font-semibold text-gray-800 mb-4 md:mb-6 animate-fadeIn">
          {title}
        </h2>
        {/* Scroll Mask */}
        <div ref={maskRef} className="h-64 md:h-96 overflow-hidden relative">
          <div
            ref={contentRef}
            className="flex flex-col gap-4 md:gap-6 py-2 will-change-transform"
          >
            {/* COPY 1 */}
            {sections.map((s, idx) => (
              <div key={"a-" + idx}>
                <h3 className="text-xs md:text-base font-semibold text-gray-700 mb-1 md:mb-2">
                  {s.title}
                </h3>
                <ul className="list-none p-0 m-0">
                  {s.items.map((item, i) => (
                    <li key={i} className="text-[0.65rem] md:text-sm text-gray-600 py-0.5 md:py-1">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {/* COPY 2 (identica alla prima per loop senza stacchi) */}
            {sections.map((s, idx) => (
              <div key={"b-" + idx}>
                <h3 className="text-xs md:text-base font-semibold text-gray-700 mb-1 md:mb-2">
                  {s.title}
                </h3>
                <ul className="list-none p-0 m-0">
                  {s.items.map((item, i) => (
                    <li key={i} className="text-[0.65rem] md:text-sm text-gray-600 py-0.5 md:py-1">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        {/* Footer */}
        <p className="text-center mt-4 md:mt-6 text-[0.6rem] md:text-xs text-gray-500">
          © {new Date().getFullYear()} – All Rights Reserved
        </p>
      </div>
    </div>
  );
}