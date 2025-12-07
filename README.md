# Portfolio Giuseppe Rubino

Il sito è una single-page React + Vite che mette in scena introduzione personale, catalogo progetti e assistente vocale “Luce”. Il design è impostato su un involucro sfumato e pannelli scrollabili, con gradienti, icone e documenti locali (ARCHITECTURE/README). Luce usa Groq Llama 3.1, Web Speech e un hook custom per TTS; i progetti leggono dati JSON, metadati GitHub e anteprime media per restituire un’esperienza completa.

## Struttura essenziale

- `public/index.html`: contiene i riferimenti al favicon (`icona.ico`) e all’icona Apple (`icona.png`) più il nodo di mount `#root`.
- `src/components/background.jsx`: gestisce la shell, il sidebar desktop, la nav mobile e il cambio di panel.
- `src/components/card_*`: card dedicate a progetti, media, info e assistente.
- `src/assets/data/projects.json`: descrive progetti, media e documenti scaricabili (ARCHITECTURE/README locali).
- `src/components/chatbot`: contiene Luce, il composer e il voice hook che orchestrano la chat LLM/TTS.

## Comandi

```bash
npm install
npm run dev    # sviluppo
npm run build  # produzione
npm run preview
```

Il deploy è configurato con `gh-pages` (script `deploy`). Il progetto utilizza React 19, Tailwind 4 e Vite 7.
