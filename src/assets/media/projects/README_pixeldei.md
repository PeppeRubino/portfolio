# Pixel-dei Simulator - README

## Scopo
Pixel-dei e' un simulatore 2D di ecosistemi sintetici usato per esperimenti rapidi su evoluzione, metabolismo ed equilibrio climatico. Questo documento guida ricercatori e tecnici nell'installazione e nell'esecuzione in locale o headless.

## Stato
- **Maturita':** Alpha avanzata (feature-complete per esperimenti interni, API soggette a refactor).
- **Manutenzione:** manutenzione continua dallo sviluppatore principale con release trimestrali.
- **Compatibilita':** Windows 10+, macOS 12+, qualsiasi Linux recente con OpenGL >= 3.3.

## Requisiti
- **Linguaggi / runtime**
  - Python >= 3.10
  - OpenGL 3.3 per la GUI DearPyGui
- **Librerie principali**
  - NumPy 1.26+, noise 1+, DearPyGui 1.11+, Typer 0.9+, Rich 13+, dataclasses-json 0.6+
  - Optional: Arcade 2.6+ (debug renderer), Pillow 10+ per asset GUI
- **Servizi esterni**
  - Nessuno obbligatorio; per logging remoto integrare un endpoint HTTP custom.

## Installazione rapida
```bash
git clone <repo> pixel-dei
cd pixel-dei
python -m venv .venv
source .venv/bin/activate  # su Windows: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
mkdir -p data/metrics
```

## Uso base
1. **GUI interattiva**
   ```bash
python -m src.main --seed 42 --size 1024 512 --pixels 300
   ```
2. **Run headless con export CSV**
   ```bash
python -m src.main --headless --duration 24000 --seed 77 --label test-batch
   ```
3. **Caricare una mappa pre-generata**
   ```bash
python -m src.main --map data/maps/earth_like.npz --pixels 800 --no-gui
   ```

## Configurazione essenziale
- `config/default.yml`
  - `world.size`, `world.seed`, `simulation.ticks`, `renderer` (gui/headless).
- CLI override critici:
  - `--map <path.npz>`: salta la generazione procedurale e impone un pianeta specifico.
  - `--pixels <int>` e `--capacity <int>`: controllano memoria occupata dai buffer NumPy.
  - `--headless` + `--label <name>`: richiesti per batch automatizzati.
- Directory obbligatorie
  - `data/metrics/` per i CSV; ripulire manualmente quando cresce oltremisura.
  - `data/maps/` per mappe salvate e condivisibili tra run.

## Link extra
- [Architettura tecnica completa](ARCHITECTURE_pixeldei.md)
- [Panoramica scientifica / note di ricerca](PROJECT_OVERVIEW.md) *(se disponibile nel repo)*
- [Guida CLI avanzata](README_EXTENDED.md) per elenco completo dei flag
