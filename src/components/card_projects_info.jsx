import React, { useMemo } from "react";
import LanguageBar from "./card_projects_info/LanguageBar.jsx";
import useGithubMetadata from "./card_projects_info/useGithubMetadata.js";
import { formatIsoDate } from "./card_projects_info/utils.js";

function resolveDocumentUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/")) return path;
  try {
    return new URL(path, import.meta.url).href;
  } catch {
    return path;
  }
}

export default function CardInfo({ project, onClose = () => {}, githubToken = null }) {
  const {
    languages,
    modules: fetchedModules,
    loading,
    error,
    repoCreatedAt,
    repoLoading,
    repoError,
  } = useGithubMetadata(project, githubToken);

  if (!project) return null;

  const effectiveModules =
    (project.modules && project.modules.length > 0 ? project.modules : fetchedModules) || [];
  const description = project.description || "Nessuna descrizione fornita.";
  const isoDate = project.createdAt || repoCreatedAt || null;
  const formattedDate = isoDate ? formatIsoDate(isoDate) : null;

  const createdBadge = (() => {
    if (project.createdAt) {
      return { text: `Creato: ${project.createdAt}`, title: "Fonte: campo createdAt" };
    }
    if (repoLoading) {
      return { text: "Creato: ottenimento da GitHub…", title: "Recupero created_at dal repository" };
    }
    if (isoDate) {
      return { text: `Creato: ${formattedDate}`, title: `ISO: ${isoDate}` };
    }
    return null;
  })();

  const statusMessage = error || repoError;

  const handleOpenProject = () => {
    const url = project.repository || project.repositoryUrl || project.repo;
    if (url) window.open(url, "_blank");
  };

  const documentLinks = useMemo(() => {
    if (!project.documents || !project.documents.length) return [];
    return project.documents
      .map((doc) => {
        if (!doc) return null;
        const url = doc.url ?? resolveDocumentUrl(doc.path);
        if (!url) return null;
        return { ...doc, url };
      })
      .filter(Boolean);
  }, [project.documents]);

  return (
    <aside className="relative flex h-full w-full flex-col rounded-[30px] border border-white/50 bg-linear-to-b from-white/95 to-slate-100/85 p-6 shadow-[0_25px_80px_rgba(79,70,229,0.16)]">

      <div className="mb-4 h-1 w-full rounded-full bg-linear-to-r from-white/0 via-white/70 to-white/0" />

      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{project.name}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {project.category && (
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow">
                {project.category}
              </span>
            )}
            {project.favorite && (
              <span className="rounded-full bg-indigo-100/80 px-3 py-1 text-xs font-semibold text-indigo-700 shadow">
                Prioritario
              </span>
            )}
            {createdBadge && (
              <span
                className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow"
                title={createdBadge.title}
              >
                {createdBadge.text}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-1">
          <section className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700">Descrizione</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{description}</p>
          </section>

          <section className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700">Moduli usati</h3>
            {effectiveModules.length === 0 ? (
              <div className="mt-2 text-xs text-slate-500">Nessun modulo elencato.</div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {effectiveModules.map((module, idx) => (
                  <span
                    key={`${module}-${idx}`}
                    className="rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-800 shadow"
                  >
                    {module}
                  </span>
                ))}
              </div>
            )}
          </section>

          {(loading || repoLoading) && (
            <div className="mb-4 text-sm text-slate-500">Caricamento dati GitHub…</div>
          )}

          {statusMessage && (
            <div className="mb-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600 border border-rose-200">
              Errore: {statusMessage}
            </div>
          )}

          {Object.keys(languages).length > 0 && (
            <section className="mb-4">
              <h3 className="text-sm font-semibold text-slate-700">Linguaggi</h3>
              <div className="mt-3">
                <LanguageBar languages={languages} />
              </div>
            </section>
          )}

          {documentLinks.length > 0 && (
            <section className="mb-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-[0.3em] text-slate-500">
                Documenti
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {documentLinks.map((doc) => (
                  <a
                    key={doc.label || doc.path || doc.url}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow transition hover:-translate-y-0.5 hover:border-slate-300"
                  >
                    {doc.label}
                    <span className="text-[0.6rem] text-slate-400">Download</span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>

            <div className="mt-4 flex items-center justify-end">
              <button
                type="button"
                onClick={handleOpenProject}
                className="rounded-2xl bg-linear-to-b from-slate-900 to-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-[0_20px_45px_rgba(2,6,23,0.22)] transition hover:-translate-y-0.5"
              >
            Apri progetto
          </button>
        </div>
      </div>
    </aside>
  );
}
