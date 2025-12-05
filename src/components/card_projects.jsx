// src/components/card_projects.jsx
import React, { useEffect, useState } from "react";
import projectsData from "../media/data/projects.json"; // import DEFAULT dal JSON

/**
 * CardLeft
 * - props:
 *    - projects: array opzionale (se non passato usa projectsData)
 *    - onSelect: callback quando si seleziona un progetto
 *    - selectedId: id del progetto selezionato
 */

export function CardLeft({ projects = null, onSelect = () => { }, selectedId = null }) {
  // usa i progetti passati via prop, altrimenti il JSON locale
  const initialProjects = Array.isArray(projects) && projects.length > 0 ? projects : (Array.isArray(projectsData) ? projectsData : []);
  const [localProjects, setLocalProjects] = useState(initialProjects);

  useEffect(() => {
    // se cambiano le props esterne, aggiorna lo stato locale
    if (Array.isArray(projects) && projects.length > 0) {
      setLocalProjects(projects);
    }
  }, [projects]);

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

export default CardLeft;