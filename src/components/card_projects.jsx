// src/components/card_projects.jsx
import React, { useEffect, useState } from "react";
import projectsData from "../assets/data/projects.json"; // import DEFAULT dal JSON

/**
 * CardLeft
 * - props:
 *    - projects: array opzionale (se non passato usa projectsData)
 *    - onSelect: callback quando si seleziona un progetto
 *    - selectedId: id del progetto selezionato
 */

export function CardLeft({
  projects = null,
  onSelect = () => {},
  selectedId = null,
}) {
  // usa i progetti passati via prop, altrimenti il JSON locale
  const initialProjects =
    Array.isArray(projects) && projects.length > 0
      ? projects
      : Array.isArray(projectsData)
      ? projectsData
      : [];

  const [localProjects, setLocalProjects] = useState(initialProjects);

  // 👇 nuovo: rileviamo se siamo su mobile (< 768px)
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  // 👇 nuovo: id del progetto in “focus” da mobile
  const [mobileFocusId, setMobileFocusId] = useState(null);

  useEffect(() => {
    // se cambiano le props esterne, aggiorna lo stato locale
    if (Array.isArray(projects) && projects.length > 0) {
      setLocalProjects(projects);
    }
  }, [projects]);

  useEffect(() => {
    // aggiorna isMobile su resize
    function handleResize() {
      if (typeof window === "undefined") return;
      setIsMobile(window.innerWidth < 768);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    // se da fuori viene deselezionato il progetto, togli anche il focus mobile
    if (!selectedId) {
      setMobileFocusId(null);
    }
  }, [selectedId]);

  // ordiniamo una sola volta la lista di base
  const sortedProjects = [...localProjects].sort(
    (a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite))
  );

  // 👇 qui succede la magia:
  // se siamo su mobile e c'è un focus, mostriamo SOLO quel progetto
  const visibleProjects =
    isMobile && mobileFocusId
      ? sortedProjects.filter((p) => p.id === mobileFocusId)
      : sortedProjects;

  const handleClickProject = (p) => {
    if (!isMobile) {
      // desktop: comportamento classico
      onSelect(p);
      return;
    }

    // mobile: toggle focus + selezione
    if (mobileFocusId === p.id) {
      // secondo tap: togli focus e deseleziona
      setMobileFocusId(null);
      onSelect(null);
    } else {
      // primo tap (o altro progetto): focus su questo
      setMobileFocusId(p.id);
      onSelect(p);
    }
  };

  return (
    <aside
      className="relative w-full max-w-md md:max-w-none flex flex-col p-6 rounded-[30px] border border-white/50 bg-gradient-to-b from-white/95 via-slate-50/90 to-slate-100/85 shadow-[0_25px_70px_rgba(15,23,42,0.18)]"
      style={{ maxHeight: '75vh' }}
    >
      <div className="h-full flex flex-col">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Progetti</h1>
          <p className="text-sm text-gray-500 mt-1">Progetti sviluppati da me</p>
        </header>

        <nav
          className="flex-1 overflow-y-auto pr-3 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"
          style={{ maxHeight: 'calc(75vh - 120px)' }}
        >
          <ul className="space-y-4">
            {visibleProjects.map((p) => {
              const isSelected = selectedId === p.id;
              const isFavorite = Boolean(p.favorite);
              const tags = [];

              if (isFavorite) {
                tags.push({
                  key: "favorite",
                  label: "Prioritario",
                  icon: <StarIcon className="w-3.5 h-3.5 text-amber-500" />,
                  className: "text-amber-700 bg-amber-50/90",
                });
              }

              const catList =
                Array.isArray(p.categories) && p.categories.length
                  ? p.categories
                  : p.category
                  ? [p.category]
                  : [];

              catList.forEach((cat, idx) => {
                const badge = getCategoryBadge(cat);
                if (!badge) return;
                tags.push({
                  key: `category-${idx}`,
                  label: badge.label,
                  icon: (
                    <TagIcon className={`w-3 h-3 ${badge.iconColor}`} />
                  ),
                  className: `${badge.text} ${badge.bg}`,
                });
              });

              return (
                <li key={p.id}>
              <button
                onClick={() => handleClickProject(p)}
                className={
                  `group relative w-full text-left p-4 rounded-2xl transform transition-all flex flex-col gap-2 items-start ${isFavorite && !isSelected ? 'hover:shadow-[0_15px_40px_rgba(251,191,36,0.25)] focus-visible:shadow-[0_15px_40px_rgba(251,191,36,0.35)]' : ''}` +
                  (isSelected
                    ? ` scale-102 shadow-2xl ring-2 ring-indigo-200`
                    : ` hover:-translate-y-0.5`)
                }
                style={{
                  background: isSelected
                    ? "linear-gradient(180deg,#ffffff,#f3f4f6)"
                    : "linear-gradient(180deg,#fafafa,#efefef)",
                  boxShadow: isSelected
                    ? isFavorite
                      ? "0 8px 24px rgba(251,191,36,0.25), inset 0 1px 0 rgba(255,255,255,0.6)"
                      : "0 8px 18px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.6)"
                    : "0 6px 12px rgba(15,23,42,0.06)",
                  border: isSelected ? "1px solid transparent" : "1px solid transparent",
                }}
              >
                    <div className="w-full flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-medium text-gray-800">
                          {p.name}
                        </div>
                        {p.subtitle && (
                          <div className="text-xs text-gray-500 mt-1">
                            {p.subtitle}
                          </div>
                        )}
                        {tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-1">
                            {tags.map((tag) => (
                              <span
                                key={tag.key}
                                className={`inline-flex items-center gap-1 text-[0.65rem] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${tag.className}`}
                              >
                                {tag.icon}
                                {tag.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {p.createdAt && (
                        <div className="text-xs text-gray-400 ml-4">
                          {p.createdAt}
                        </div>
                      )}
                    </div>

                    {/* barra stilistica grigia */}
                    <div className="w-full mt-2">
                      <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden"></div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

function StarIcon(props) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.146 3.513a1 1 0 00.95.69h3.688c.969 0 1.371 1.24.588 1.81l-2.985 2.17a1 1 0 00-.364 1.118l1.146 3.513c.3.921-.755 1.688-1.54 1.118l-2.985-2.17a1 1 0 00-1.176 0l-2.985 2.17c-.784.57-1.838-.197-1.54-1.118l1.146-3.513a1 1 0 00-.364-1.118L2.62 8.94c-.783-.57-.38-1.81.588-1.81h3.688a1 1 0 00.95-.69l1.146-3.513z" />
    </svg>
  );
}

function TagIcon(props) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" {...props}>
      <path d="M2 6.5V2.667A1.667 1.667 0 013.667 1h3.833c.442 0 .866.176 1.179.489L14 6.81a1.667 1.667 0 010 2.357l-3.834 3.834a1.667 1.667 0 01-2.357 0L2.49 7.683A1.667 1.667 0 012 6.5z" />
    </svg>
  );
}

const CATEGORY_BADGES = {
  "Web APP": {
    label: "Web App",
    text: "text-emerald-800",
    bg: "bg-emerald-50/90",
    iconColor: "text-emerald-500",
  },
  "Sito Web": {
    label: "Web",
    text: "text-sky-800",
    bg: "bg-sky-50/90",
    iconColor: "text-sky-500",
  },
  Automazione: {
    label: "Automation",
    text: "text-rose-800",
    bg: "bg-rose-50/90",
    iconColor: "text-rose-500",
  },
  App: {
    label: "App",
    text: "text-indigo-800",
    bg: "bg-indigo-50/90",
    iconColor: "text-indigo-500",
  },
  "Rete Neurale": {
    label: "AI / ML",
    text: "text-purple-800",
    bg: "bg-purple-50/90",
    iconColor: "text-purple-500",
  },
  "AI / ML": {
    label: "AI / ML",
    text: "text-purple-800",
    bg: "bg-purple-50/90",
    iconColor: "text-purple-500",
  },
  Simulation: {
    label: "Simulation",
    text: "text-amber-900",
    bg: "bg-amber-50/90",
    iconColor: "text-amber-500",
  },
};

function getCategoryBadge(category) {
  if (!category) return null;
  return (
    CATEGORY_BADGES[category] || {
      label: category,
      text: "text-slate-800",
      bg: "bg-slate-50/90",
      iconColor: "text-slate-500",
    }
  );
}

export default CardLeft;
