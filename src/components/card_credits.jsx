import React from "react";
import cvPdf from "../assets/data/Giuseppe_Rubino_CV.pdf";

const SECTIONS = [
  {
    title: "Profilo",
    items: [
      "Giuseppe Rubino – Full-stack & AI Engineer autodidatta (laurea in Scienze e Tecniche Psicologiche, 110 e lode).",
      "Costruisco prodotti end-to-end: UX, backend API, modelli neurali, automazioni e deploy.",
      "Il sito e GitHub documentano i progetti chiave (Decod, Pixel-dèi, BrocaMetrics, automazioni AI) con codice e demo consultabili."
    ]
  },
  {
    title: "Delivery Principali",
    items: [
      "Decod – app desktop per trascrizione & diarizzazione con Faster-Whisper, Silero VAD, Resemblyzer, riconoscimento facciale e flussi Stripe/Firebase per licenze.",
      "Pixel-dèi – simulatore di ecosistemi sintetici data-oriented (NumPy, DearPyGui) che studia complessità, agenti e metriche scientifiche.",
      "LLM & Automation – pipeline Groq/OpenAI per chatbot vocali (Luce), automazioni PC con Python/SikuliX, orchestrazione REST e tool operativi.",
      "BrocaMetrics & ClassMetrics – web app React/Three.js/Chart.js per visualizzazioni 3D e reporting educativo con dataset interattivi."
    ]
  },
  {
    title: "Tooling & Stack",
    items: [
      "Frontend: React, Vite, Tailwind, Three.js, WebAudio, WebGL.",
      "Backend & Ops: Node.js, Python, Firebase, Firestore, Stripe, CI/CD per build Vite/Nuitka.",
      "AI/ML: Faster-Whisper, Silero VAD, Resemblyzer, facenet-pytorch, Piper TTS, NumPy, Groq/OpenAI LLM.",
      "Automation & Packaging: SikuliX, ffmpeg, DearPyGui, Nuitka/PyInstaller con gestione asset e modelli."
    ]
  },
  {
    title: "Riferimenti CV",
    items: [
      "Formazione: L-24 Scienze e Tecniche Psicologiche (UNIME), background in ricerca cognitiva e divulgazione.",
      "Competenze soft: leadership di progetto, comunicazione tecnica-clienti, gestione timeline MVP e cicli di iterazione rapida.",
      "Il curriculum dettagliato è disponibile in PDF e include timeline, responsabilità e risultati misurabili per ciascun progetto."
    ]
  },
  {
    title: "Special Thanks",
    items: [
      "Open-source & scientific community",
      "OpenAI, Groq e i team di ricerca che rendono disponibili modelli e API",
      "Clienti, mentor e colleghi che hanno contribuito alla validazione dei prodotti"
    ]
  }
];

export default function CardCredits() {
  return (
    <section className="w-full">
      <div className="mx-auto flex h-[75vh] w-full max-w-4xl flex-col gap-6 overflow-hidden rounded-4xl border border-white/60 bg-linear-to-b from-white/95 to-slate-100/85 p-6 shadow-[0_25px_70px_rgba(15,23,42,0.18)]">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-500">Professional Credits · 21·11·1995</p>
          <h2 className="text-2xl font-semibold text-slate-900 mt-2">Portfolio & Curriculum Highlights</h2>
          <p className="text-sm text-slate-500 mt-2">
            Estratto dei risultati principali presenti nel portfolio e nel curriculum ufficiale. Ogni progetto combina ricerca, sviluppo e distribuzione end-to-end.
          </p>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto pr-2">
          {SECTIONS.map((section) => (
            <div key={section.title} className="rounded-2xl bg-white/80 p-4 shadow-[0_12px_35px_rgba(15,23,42,0.08)] border border-white/70">
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
          <span>© {new Date().getFullYear()} Giuseppe Rubino – Portfolio & GitHub</span>
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
    </section>
  );
}
