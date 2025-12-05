// src/components/CardInfo.jsx
import React, { useEffect, useState } from "react";
import { useGithubRepo } from "../utils/useGithubRepo.js";
import projects from '../media/data/projects.json'

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

/* utility usata altrove: aggiunge canale alpha esadecimale a #rrggbb */
function colorWithAlpha(hex, alphaHex = "20") {
  if (!hex) return `#d1d5db${alphaHex}`;
  const h = hex.replace("#", "");
  if (h.length === 6) return `#${h}${alphaHex}`;
  return hex; // fallback
}

function toApiRepoUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === "api.github.com" && u.pathname.startsWith("/repos/")) {
      return url.replace(/\/+$/, "");
    }
    if (u.hostname === "github.com") {
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        const owner = parts[0];
        const repo = parts[1].replace(/\.git$/, "");
        return `https://api.github.com/repos/${owner}/${repo}`;
      }
    }
  } catch (e) {}
  return null;
}

function formatIsoDate(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("it-IT", { year: "numeric", month: "short", day: "numeric" });
  } catch { return iso; }
}

/* renderLanguageBar: applica esattamente le regole di styling/normalizzazione del componente originale
   - calcolo percentuali a 1 decimale (digit-by-digit)
   - normalizzazione perché la somma sia 100
   - larghezza minima visibile 0.5%
   - pill con background color + "20" alpha
*/
function renderLanguageBar(languages = {}) {
  const entries = Object.entries(languages || {});
  if (entries.length === 0) {
    return (
      <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
        <div className="text-xs text-gray-400 text-center py-1">Nessun dato</div>
      </div>
    );
  }

  // convert values to numbers and compute total bytes-like
  const numeric = entries.map(([lang, v]) => [lang, Number(v) || 0]);
  const total = numeric.reduce((s, [, v]) => s + v, 0) || 0.000001;

  // compute percents with 1 decimal as in CardLeft
  const percents = numeric.map(([lang, bytes]) => {
    const pct = Math.round((bytes * 1000) / total) / 10; // 1 decimal
    return [lang, pct];
  });

  // normalize to sum 100
  const totalPct = percents.reduce((s, [, pct]) => s + pct, 0) || 0.000001;
  const normalized = percents.map(([lang, pct]) => [lang, (pct / totalPct) * 100]);
  
useEffect(() => {
  setProjects(projectsData);
}, []);
  return (
    <>
      <div
        className="w-full h-3 rounded-full overflow-hidden mb-3 flex"
        style={{ boxShadow: "inset 0 -1px 8px rgba(2,6,23,0.04)" }}
      >
        {normalized.map(([lang, pct]) => {
          const color = GITHUB_COLORS[lang] || GITHUB_COLORS.default;
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
              style={{ background: colorWithAlpha(color, "20") }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: color,
                  display: "inline-block",
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

export function CardInfo({ project = null, onClose = () => { }, githubToken = null }) {
  const { languageBytes, languages, modules, loading, error } = useGithubRepo(project, githubToken);

  const [repoCreatedAt, setRepoCreatedAt] = useState(null);
  const [repoLoading, setRepoLoading] = useState(false);
  const [repoError, setRepoError] = useState(null);

  useEffect(() => {
    let abort = false;
    const controller = new AbortController();

    async function fetchRepo() {
      setRepoError(null);
      setRepoCreatedAt(null);

      if (!project || project.createdAt) {
        setRepoLoading(false);
        return;
      }

      const rawUrl = project.repository || project.repositoryUrl || project.repo || null;
      const apiUrl = toApiRepoUrl(rawUrl);

      if (!apiUrl) {
        setRepoError(null);
        setRepoLoading(false);
        return;
      }

      setRepoLoading(true);
      try {
        const headers = { Accept: "application/vnd.github+json" };
        if (githubToken) headers["Authorization"] = `token ${githubToken}`;

        const res = await fetch(apiUrl, { signal: controller.signal, headers });
        if (abort) return;

        let data = null;
        try { data = await res.json(); } catch { data = null; }

        if (data?.created_at) {
          setRepoCreatedAt(data.created_at);
        } else {
          setRepoCreatedAt(null);
        }
      } catch (e) {
        if (e.name !== "AbortError") {
          setRepoCreatedAt(null);
        }
      } finally {
        if (!abort) setRepoLoading(false);
      }
    }

    fetchRepo();

    return () => { abort = true; controller.abort(); };
  }, [project, githubToken]);

  if (!project) return <div />;

  const effectiveModules = (project.modules && project.modules.length > 0) ? project.modules : modules || [];
  const description = project.description || "Nessuna descrizione fornita.";

  const isoDate = project.createdAt || repoCreatedAt || null;
  const formattedDate = isoDate ? formatIsoDate(isoDate) : null;
  const createdBadge = (() => {
    if (project.createdAt) return { text: `Creato: ${project.createdAt}`, title: `Fonte: campo createdAt` };
    if (repoLoading) return { text: "Creato: ottenimento da GitHub…", title: "Recupero created_at dal repository GitHub" };
    if (isoDate) return { text: `Creato: ${formattedDate}`, title: `ISO: ${isoDate}` };
  })();

  return (
    <aside
      className="relative w-full max-w-md flex flex-col p-6 rounded-2xl overflow-y-auto"
      style={{
        background: "linear-gradient(rgb(250, 250, 250), rgb(239, 239, 239))",
        boxShadow: "rgba(15, 23, 42, 0.06) 0px 6px 12px",
      }}
    >

      <button
        onClick={onClose}
        aria-label="Chiudi scheda progetto"
        title="Chiudi"
        className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-white"
        style={{
          background: "linear-gradient(180deg,#ff4d4f,#c91f1f)",
          boxShadow: "0 6px 18px rgba(201,31,31,0.24)",
          border: "1px solid rgba(0,0,0,0.06)",
          zIndex: 40,
          padding: 0,
        }}
      >
        <span className="text-[12px] leading-none" style={{ transform: "translate(0, -1px)" }} aria-hidden>×</span>
      </button>

      <div style={{ height: 6, background: "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(245,247,250,0.9) 20%, rgba(250,250,252,1) 50%, rgba(245,247,250,0.9) 80%, rgba(255,255,255,0) 100%)" }} />

      <div className="flex flex-col overflow-y-clip scrollbar-thin">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 leading-tight">{project.name}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {project.category && (
                <div className="text-xs text-gray-800 px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.55)", boxShadow: "0 8px 20px rgba(2,6,23,0.06)" }}>
                  {project.category}
                </div>
              )}

              {createdBadge && (
                <div className="text-xs text-gray-800 px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.55)", boxShadow: "0 8px 20px rgba(2,6,23,0.06)" }} title={createdBadge.title}>
                  {createdBadge.text}
                </div>
              )}
            </div>
          </div>

          <div aria-hidden className="w-9" />
        </div>

        <div className="mt-4 overflow-auto" style={{ maxHeight: "calc(100vh - 260px)", paddingRight: 8 }}>
          <section className="mb-6">
            <h3 className="text-sm font-medium text-gray-800 mb-2">Descrizione</h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{description}</p>
          </section>

          <section className="mb-6">
            <h3 className="text-sm font-medium text-gray-800 mb-3">Moduli usati</h3>
            {effectiveModules.length === 0 ? (
              <div className="text-xs text-gray-500">Nessun modulo elencato.</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {effectiveModules.map((m, i) => (
                  <div key={i} className="text-sm px-3 py-1 rounded-full" style={{ background: "linear-gradient(180deg,#ffffff,#f3f4f6)", boxShadow: "0 12px 28px rgba(2,6,23,0.05)", color: "#0f172a" }}>
                    {m}
                  </div>
                ))}
              </div>
            )}
          </section>

          {(loading || repoLoading) && (
            <div className="mb-4 text-sm text-gray-500">Caricamento dati GitHub…</div>
          )}

          {(error || repoError) && (
            <div className="mb-4 text-sm text-red-600">Errore: {error || repoError}</div>
          )}

          {languages && Object.keys(languages).length > 0 && (
            <section className="mb-4">
              <h3 className="text-sm font-medium text-gray-800 mb-2">Linguaggi</h3>

              {renderLanguageBar(languages)}

            </section>
          )}
        </div>

        <div className="mt-4 flex items-center justify-end gap-3">
          <button onClick={() => console.log("Apri progetto", project.id)} className="px-4 py-2 rounded-2xl text-sm font-medium text-white" style={{ background: "linear-gradient(180deg,#0f172a,#0b1220)", boxShadow: "0 20px 50px rgba(2,6,23,0.14)" }}>
            Apri progetto
          </button>
        </div>
      </div>
    </aside>
  );
}

export default CardInfo;
