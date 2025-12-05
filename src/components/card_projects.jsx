// src/components/card_projects.jsx
import React, { useEffect, useState, useRef } from "react";
import projectsData from "../media/data/projects.json"; // import DEFAULT dal JSON

/**
 * CardLeft
 * - props:
 *    - projects: array opzionale (se non passato usa projectsData)
 *    - onSelect: callback quando si seleziona un progetto
 *    - selectedId: id del progetto selezionato
 *    - githubToken: opzionale, aumenta rate-limit se fornito
 *
 * Il componente arricchisce ogni progetto con `languageBytes` e `languages` (percentuali)
 * se non sono già presenti, tentando di leggere da project.languagesUrl o project.languages_url.
 */

/* mappa colori GitHub (piccola) */
const GITHUB_COLORS = {
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  TypeScript: "#2b7489",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Java: "#b07219",
  C: "#555555",
  "C++": "#f34b7d",
  Go: "#00ADD8",
  PHP: "#4F5D95",
  Ruby: "#701516",
  default: "#d1d5db"
};

/* fetch languages da una languagesUrl completa (es. https://api.github.com/repos/owner/repo/languages) */
async function fetchLanguagesFromUrl(languagesUrl, githubToken = null) {
  if (!languagesUrl) return { bytes: {}, percentages: {} };

  const headers = { Accept: "application/vnd.github+json" };
  if (githubToken) headers.Authorization = `Bearer ${githubToken}`;

  try {
    const res = await fetch(languagesUrl, { headers });
    if (!res.ok) {
      // non throwiamo per non far cadere l'intera UI — logghiamo e ritorniamo oggetti vuoti
      console.warn("fetchLanguagesFromUrl: non ok", res.status, languagesUrl);
      return { bytes: {}, percentages: {} };
    }
    const bytesObj = await res.json(); // e.g. { Python: 12345, JavaScript: 6789 }
    const total = Object.values(bytesObj).reduce((a, b) => a + b, 0) || 0;
    if (total === 0) return { bytes: bytesObj, percentages: {} };

    // calcolo percentuali con 1 decimale, digit-by-digit
    const percentages = {};
    for (const [lang, bytes] of Object.entries(bytesObj)) {
      const pct = Math.round((bytes * 1000) / total) / 10; // 1 decimale
      percentages[lang] = pct;
    }
    return { bytes: bytesObj, percentages };
  } catch (err) {
    console.warn("fetchLanguagesFromUrl: errore fetch", err, languagesUrl);
    return { bytes: {}, percentages: {} };
  }
}

function renderLanguageBar(languages = {}) {
  const entries = Object.entries(languages || {});
  if (entries.length === 0) {
    return (
      <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
        <div className="text-xs text-gray-400 text-center py-1">Nessun dato</div>
      </div>
    );
  }

  // normalizziamo: se la somma non è 100, scalare in modo che sommi 100
  const totalPct = entries.reduce((s, [, pct]) => s + (typeof pct === "number" ? pct : 0), 0) || 0.000001;
  const normalized = entries.map(([lang, pct]) => {
    const safePct = typeof pct === "number" ? pct : 0;
    const finalPct = (safePct / totalPct) * 100;
    return [lang, finalPct];
  });

  return (
    <>
      <div
        className="w-full h-2 rounded-full overflow-hidden mb-2 flex"
        style={{ boxShadow: "inset 0 -1px 8px rgba(2,6,23,0.04)" }}
      >
        {normalized.map(([lang, pct]) => {
          const color = GITHUB_COLORS[lang] || GITHUB_COLORS.default;
          // dare visibilità anche a porzioni molto piccole
          const width = pct > 0 && pct < 0.5 ? 0.5 : pct;
          return (
            <div
              key={lang}
              title={`${lang} ${pct.toFixed(1)}%`}
              className="h-full"
              style={{ width: `${width}%`, background: color }}
            />
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {normalized.map(([lang, pct]) => {
          const color = GITHUB_COLORS[lang] || GITHUB_COLORS.default;
          return (
            <div
              key={lang}
              className="text-xs px-2 py-1 rounded-full text-gray-900 flex items-center gap-2"
              style={{ background: `${color}20` }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: color,
                  display: "inline-block"
                }}
              />
              <span>{lang} • {pct.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function CardLeft({ projects = null, onSelect = () => { }, selectedId = null, githubToken = null }) {
  // usa i progetti passati via prop, altrimenti il JSON locale
  const initialProjects = Array.isArray(projects) && projects.length > 0 ? projects : (Array.isArray(projectsData) ? projectsData : []);
  const [localProjects, setLocalProjects] = useState(initialProjects);

  // cache di URLs già fetchati
  const fetchedRef = useRef(new Set());
  // una guard per evitare loop di effect quando aggiorno lo stato
  const isEnrichingRef = useRef(false);

  useEffect(() => {
    // se cambiano le props esterne, aggiorna lo stato locale
    if (Array.isArray(projects) && projects.length > 0) {
      setLocalProjects(projects);
    }
  }, [projects]);

  useEffect(() => {
    // arricchisce i progetti che non hanno languages usando languagesUrl
    if (isEnrichingRef.current) return;
    isEnrichingRef.current = true;

    let mounted = true;
    (async () => {
      const updated = [...localProjects];
      let changed = false;

      await Promise.all(
        updated.map(async (p, idx) => {
          // se già ha dati, skip
          if (p.languages && Object.keys(p.languages).length > 0) return;

          // preferisci campi languagesUrl o languages_url
          const url = p.languagesUrl || p.languages_url || null;
          if (!url) return;

          if (fetchedRef.current.has(url)) return;
          fetchedRef.current.add(url);

          try {
            const { bytes, percentages } = await fetchLanguagesFromUrl(url, githubToken);
            if (!mounted) return;
            if (bytes && Object.keys(bytes).length > 0) {
              updated[idx] = { ...updated[idx], languageBytes: bytes, languages: percentages };
              changed = true;
            }
          } catch (err) {
            console.warn("CardLeft: enrich error", err, url);
          }
        })
      );

      if (mounted && changed) {
        setLocalProjects(updated);
      }
      isEnrichingRef.current = false;
    })();

    return () => { mounted = false; isEnrichingRef.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localProjects.length]); // l'effetto si attiva in relazione alla lunghezza iniziale

  return (
    <aside
      className="relative w-full max-w-md flex flex-col p-6 rounded-2xl overflow-y-auto"
      style={{
        background: "linear-gradient(rgb(250, 250, 250), rgb(239, 239, 239))",
        boxShadow: "rgba(15, 23, 42, 0.06) 0px 6px 12px",
      }}
    >

      <div className="h-full flex flex-col">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">Progetti (Solo)</h1>
          <p className="text-sm text-gray-500 mt-1">Lista progetti e % completamento</p>
        </header>

        <nav className="flex-1 overflow-auto pr-2">
          <ul className="space-y-4">
            {localProjects.map((p) => {
              const isSelected = selectedId === p.id;
              return (
                <li key={p.id}>
                  <button
                    onClick={() => onSelect(p)}
                    className={
                      `w-full text-left p-4 rounded-2xl transform transition-all flex flex-col gap-2 items-start ` +
                      (isSelected
                        ? `scale-102 shadow-2xl ring-2 ring-indigo-200`
                        : `hover:-translate-y-0.5 hover:shadow-lg`)
                    }
                    style={{
                      background: isSelected
                        ? "linear-gradient(180deg,#ffffff,#f3f4f6)"
                        : "linear-gradient(180deg,#fafafa,#efefef)",
                      boxShadow: isSelected
                        ? "0 8px 18px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.6)"
                        : "0 6px 12px rgba(15,23,42,0.06)"
                    }}
                  >
                    <div className="w-full flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-800">{p.name}</div>
                        {p.subtitle && <div className="text-xs text-gray-500 mt-1">{p.subtitle}</div>}
                      </div>

                      <div className="text-xs text-gray-400 ml-4">{p.createdAt}</div>
                    </div>

                    {/* lingua: pill progress */}
                    <div className="w-full mt-2">
                      {/* small bar container */}
                      {renderLanguageBar(p.languages || {})}
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

export default CardLeft;
