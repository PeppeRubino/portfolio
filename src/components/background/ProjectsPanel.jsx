import React from 'react';
import CardLeft from '../card_projects.jsx';
import CardInfo from '../card_projects_info.jsx';
import CardMedia from '../card_media.jsx';

export default function ProjectsPanel({
  projects = [],
  selected = null,
  onSelect = () => {},
  githubToken = null,
}) {
  return (
    <section className="w-full">
      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-3">
        <div className="w-full">
          <CardLeft projects={projects} onSelect={onSelect} selectedId={selected?.id} />
        </div>
        <div className="w-full">
          {selected ? (
            <CardInfo project={selected} onClose={() => onSelect(null)} githubToken={githubToken} />
          ) : (
            <div className="rounded-2xl border border-white/60 bg-white/60 p-6 text-sm text-slate-500">
              Seleziona un progetto per visualizzare dettagli e stack.
            </div>
          )}
        </div>
        <div className="w-full">
          {selected ? (
            <CardMedia project={selected} />
          ) : (
            <div className="rounded-2xl border border-white/60 bg-white/60 p-6 text-sm text-slate-500">
              Anteprime e media appariranno qui.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
