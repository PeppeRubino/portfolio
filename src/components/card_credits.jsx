import React from "react";
import cvPdf from "../assets/data/Giuseppe_Rubino_CV.pdf";
import about from "../assets/data/about.json";
import projects from "../assets/data/projects.json";

const highlightedProjects = Array.isArray(projects)
  ? projects
      .filter((project) => project?.favorite)
      .map((project) => project?.name)
      .filter(Boolean)
  : [];

const highlightedProjectsLabel = highlightedProjects.length ? highlightedProjects.join(", ") : null;

const profileLine = `${about?.name || "Giuseppe Rubino"} – AI‑Empowered Developer (laurea in Scienze e Tecniche Psicologiche${
  about?.bio?.includes("110") ? ", 110 e lode" : ""
}).`;

const SECTIONS = [
  {
    title: "Profilo",
    items: [
      profileLine,
      "Approccio: uso l’AI come acceleratore (prototipi, refactor, test, documentazione), mantenendo controllo su architettura, logica e validazione.",
      "Punto di forza: integrazione e orchestrazione di sistemi (UI, automazioni, pipeline dati, API, packaging), più che “coding manuale” fine a sé stesso.",
      highlightedProjectsLabel
        ? `Progetti in evidenza nel portfolio: ${highlightedProjectsLabel}.`
        : "Progetti in evidenza nel portfolio: disponibili nella sezione Progetti.",
    ],
  },
  {
    title: "Progetti (estratto)",
    items: [
      "Decod v2: tool desktop per ingest audio/video, VAD + trascrizione Whisper, diarizzazione/correzione e export (con gestione licenze/autenticazione).",
      "Pixel‑dèi: simulazione di ecosistemi sintetici con metriche e logging, orientata a esperimenti e analisi dei pattern.",
      "Luce (questo assistente): chat + voce, routing deterministico e knowledge base locale per risposte coerenti sul portfolio.",
      "BrocaMetrics / ClassMetrics: web app per visualizzazioni 3D e dashboard (Three.js/Chart.js) con UI responsive.",
      "Automazioni PC: macro robuste e controlli di stato per task ripetitivi (focus su affidabilità e ripresa sicura).",
    ],
  },
  {
    title: "Tooling & Stack",
    items: [
      "Frontend: React, Vite, Tailwind, Three.js (quando serve 3D).",
      "Backend/servizi: integrazioni REST, Firebase/Firestore, Stripe (dove presente nei progetti).",
      "AI/ML: Whisper/VAD, pipeline audio, embedding/diarizzazione (in base al progetto).",
      "Automation & packaging: SikuliX/ffmpeg, GUI Python, Nuitka/PyInstaller (in base al progetto).",
    ],
  },
  {
    title: "Riferimenti CV",
    items: [
      `Formazione: ${about?.university || "dettagli disponibili nel CV e nella sezione About"}.`,
      `Scuola: ${about?.school || "dettagli disponibili nel CV e nella sezione About"}.`,
      "Metodo di lavoro: analisi dei bisogni, iterazioni rapide e attenzione alla validazione (con un approccio pratico e misurabile).",
      "Il curriculum dettagliato è disponibile in PDF.",
    ],
  },
  {
    title: "Special Thanks",
    items: [
      "Open-source & scientific community",
      "OpenAI, Groq, Llama e i team di ricerca che rendono disponibili modelli e API",
      "Clienti, mentor e colleghi che hanno contribuito alla validazione dei prodotti",
    ],
  },
];

export default function CardCredits() {
  return (
    <section className="w-full mt-8 md:mt-0">
      <div className="mx-auto flex h-[75vh] w-full max-w-4xl flex-col gap-6 overflow-hidden rounded-4xl border border-white/60 bg-linear-to-b from-white/95 to-slate-100/85 p-6 shadow-[0_25px_80px_rgba(79,70,229,0.16)]">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Professional Credits</p>
          <h2 className="text-2xl font-semibold text-slate-900 mt-2">Portfolio & Curriculum Highlights</h2>
          <p className="text-sm text-slate-500 mt-2">
            Sintesi basata sui dati pubblicati nel portfolio e nel CV. Le descrizioni sono intenzionalmente concrete e verificabili.
          </p>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto pr-2">
          {SECTIONS.map((section) => (
            <div
              key={section.title}
              className="rounded-2xl bg-white/80 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.08)] border border-white/70"
            >
              <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-[0.2em]">{section.title}</h3>
              <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-slate-600">
                {section.items.map((item, idx) => (
                  <li key={`${section.title}-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/60 pt-4 text-sm text-slate-600">
          <span>© {new Date().getFullYear()} {about?.name || "Giuseppe Rubino"} – Portfolio</span>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={cvPdf}
              download="Giuseppe_Rubino_CV.pdf"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:-translate-y-0.5"
            >
              Scarica CV
            </a>
            <a
              href="https://github.com/PeppeRubino"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] transition hover:-translate-y-0.5"
            >
              Vai su GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

