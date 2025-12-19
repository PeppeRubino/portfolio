// src/components/card_projects.jsx
import React, { useEffect, useState } from "react";
import projectsData from "../assets/data/projects.json"; // import DEFAULT dal JSON
import tagDefinitions from "../assets/data/project_tags.json";

const TAG_ALIAS_LOOKUP = Object.entries(tagDefinitions).reduce(
  (acc, [key, def]) => {
    if (Array.isArray(def.aliases)) {
      def.aliases.forEach((alias) => {
        acc[alias] = key;
      });
    }
    return acc;
  },
  {}
);

const TAG_ICON_COMPONENTS = {
  star: StarIcon,
  tag: TagIcon,
};

const TAG_ICON_SIZE = {
  star: "w-3.5 h-3.5",
  tag: "w-3 h-3",
};

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
      className="relative mt-8 md:mt-0 w-full max-w-md md:max-w-none flex flex-col p-6 rounded-[30px] border border-white/50 bg-linear-to-b from-white/95 via-slate-50/90 to-slate-100/85 shadow-[0_25px_80px_rgba(79,70,229,0.16)]"
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
              const tagKeys = Array.isArray(p.tags) ? [...p.tags] : [];

              if (tagKeys.length === 0) {
                const catList =
                  Array.isArray(p.categories) && p.categories.length
                    ? p.categories
                    : p.category
                    ? [p.category]
                    : [];

                catList.forEach((cat) => {
                  const aliasKey = TAG_ALIAS_LOOKUP[cat];
                  if (aliasKey && !tagKeys.includes(aliasKey)) {
                    tagKeys.push(aliasKey);
                  }
                });
              }

              tagKeys.forEach((tagKey, idx) => {
                const definition = tagDefinitions[tagKey];
                if (!definition) return;
                const IconComponent =
                  TAG_ICON_COMPONENTS[definition.icon] || TagIcon;
                const sizeClass = TAG_ICON_SIZE[definition.icon] || "w-3 h-3";

                tags.push({
                  key: `${tagKey}-${idx}`,
                  label: definition.label || tagKey,
                  icon: (
                    <IconComponent
                      className={`${sizeClass} ${
                        definition.iconColor || ""
                      }`.trim()}
                    />
                  ),
                  className: `${definition.text ?? ""} ${
                    definition.bg ?? ""
                  }`.trim(),
                });
              });

              return (
                <li key={p.id}>
              <button
                onClick={() => handleClickProject(p)}
                className={`group relative w-full text-left p-4 rounded-2xl transform transition-all flex flex-col gap-2 items-start overflow-hidden cursor-pointer ${
                  isSelected
                    ? "scale-100 shadow-[0_25px_60px_rgba(15,23,42,0.2)] ring-1 ring-slate-200"
                    : "hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(15,23,42,0.18)]"
                }`}
                style={{
                  background: isSelected
                    ? "linear-gradient(180deg,#ffffff,#eef2ff,#f3f4f6)"
                    : "linear-gradient(180deg,#fafafa,#efefef)",
                  boxShadow: isSelected
                    ? "0 12px 30px rgba(15,23,42,0.14), inset 0 1px 0 rgba(255,255,255,0.9)"
                    : "0 6px 18px rgba(15,23,42,0.08)",
                  border: isSelected ? "1px solid transparent" : "1px solid transparent",
                }}
              >
                <span
                  className={`pointer-events-none absolute inset-[4px] rounded-[24px] bg-linear-to-br from-indigo-100/35 to-transparent opacity-0 transition-all duration-300 ${
                    isSelected ? "opacity-60" : "group-hover:opacity-40"
                  }`}
                  aria-hidden
                />
                    <div className="w-full flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                  <div className="text-sm font-medium text-gray-800 flex items-center gap-2">
                          <span>{p.name}</span>
                          {isFavorite && (
                            <span className="inline-flex items-center justify-center rounded-full bg-indigo-50/90 px-2 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-indigo-700">
                              <StarIcon className="w-3 h-3 text-indigo-500" aria-hidden />
                            </span>
                          )}
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

export default CardLeft;
