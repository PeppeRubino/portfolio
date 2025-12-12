# Pixel-dei Simulator - Architecture

## Scopo del documento
Illustrare come e' costruito il simulatore Pixel-dei: componenti software, regole di comunicazione, modelli dati e decisioni architetturali che abilitano le simulazioni evolutive. Non tratta l'uso dell'applicazione o i risultati scientifici (vedi README e PROJECT_OVERVIEW).

## Panoramica
Pixel-dei e' diviso in quattro layer coordinati dal loop `Simulation`:
1. **World Layer** (`world/`): genera e aggiorna mappe ambientali (elevazione, clima, risorse).
2. **Pixel Layer** (`pixel/`): mantiene lo stato di milioni di agenti come array NumPy condivisi.
3. **Simulation Layer** (`simulation/`): orchestrazione tick-by-tick, metriche e scheduling renderer.
4. **Presentation Layer** (`gui/`, `rendering/`): GUI DearPyGui, overlay, renderer headless.

La comunicazione e' tutta in-process: i layer condividono strutture NumPy e passano riferimenti diretti; l'I/O su disco e' limitato a CSV e mappe `.npz`.

## Principi di design
- **Data-Oriented Design:** tutti gli agenti vivono in array strutturati; l'update scorre su colonne per sfruttare NumPy.
- **Riproducibilita':** seme globale e configurazioni CLI vengono serializzati nelle metriche per rigenerare run identiche.
- **Isolamento world/pixel:** il mondo fornisce solo campi scalari campionabili; il Pixel Manager applica le regole locali senza dipendenze circolari.
- **Renderer plug-in:** GUI DearPyGui e renderer headless implementano la stessa interfaccia e possono essere scambiati senza toccare il loop core.
- **Zero servizi esterni:** l'intero stack lavora offline cosi' da poter girare in cluster privati o laptop senza rete.

## Componenti
### World Layer (`src/world/`)
- `map_generator.py`: noise multi-scala, generazione campi `elevation`, `temperature`, `humidity`, `pressure`.
- `environment.py`: definisce i canali ambientali (LIGHT, ORGANIC_SOUP, ecc.) e i sampler.
- `resources.py`: `ResourceGrid` (tensor NumPy) per nutrienti/gas con operatori di diffusione e evaporazione.
- `biome.py`: classificatore di biomi piu' palette colori.
- `world.py`: container principale, orchestrazione processi ambientali e hooking verso Simulation.

### Pixel Layer (`src/pixel/`)
- `pixel_manager.py`: array strutturati (`capacity x features`), maschere boolean, allocazione/spawn/morte.
- `genome.py` e `traits.py`: definizione tratti genetici e decodifica in parametri metabolici.
- `metabolism.py`, `reproduction.py`, `behaviors.py`: funzioni vettoriali per consumo risorse, divisione, movimento.
- `identity.py`: naming specie e gestione lineage.

### Simulation Layer (`src/simulation/`)
- `core.py`: classe `Simulation`, orchestrazione degli step (`update_world`, `update_pixels`, `render/frame`).
- `metrics.py`: `RunRecorder` per campionare e salvare CSV, conversione `tick -> year`.
- `commands/`, `config/`: parsing CLI (Typer) e preset YAML condivisi.

### Presentation Layer
- `gui/dpg_app.py`: inizializza DearPyGui, crea viewport, gestisce eventi UI.
- `gui/dpg_world_view.py`, `gui/dpg_sidebar.py`, `gui/dpg_topbar.py`: overlay grafici, controlli run, stats.
- `rendering/debug_renderer.py`: renderer headless per run batch con log testuale.

## Flussi chiave
1. **Bootstrap simulazione**
   - `python -m src.main ...` -> parsing CLI (Typer) -> set del seed globale.
   - Carica config YAML opzionale, crea `World` (da mappa `.npz` o generatori procedurali).
   - Inizializza `ResourceGrid` e `PixelManager` rispettando `capacity`.
   - Costruisce `Simulation(world, pixel_manager, resource_grid, renderer, recorder)`.
2. **Loop di simulazione**
   - `Simulation.step()`:
     1. `world.update()` aggiorna parametri climatici, diffusion, gas.
     2. `pixel_manager.update()` applica metabolismo, movimento, riproduzione, morte e compattazione array.
     3. Il renderer selezionato legge i buffer e disegna GUI o produce log headless.
     4. `RunRecorder.update(tick)` campiona se ha raggiunto l'intervallo impostato.
3. **Persistenza/output**
   - Alla chiusura o raggiunto `max_ticks`, `RunRecorder.save()` scrive `data/metrics/metrics_<label>_<run_id>.csv`.
   - Mappe climatiche possono essere salvate/riusate tramite `numpy.savez` (passaggio manuale).

## Modello dati
- **World fields**
  - Matrici 2D float32 per `elevation`, `temperature`, `humidity`, `light`, `organic_soup`, `pressure`.
  - Ogni cella mappa 1:1 con coordinate pixel in `PixelManager`.
- **Pixel arrays**
  - `positions` (int32 n x 2), `energy`, `organics`, `minerals`, `alive`, `species_id`, `genome`, `traits`.
  - `capacity` definisce la dimensione massima; `count` indica quanti agenti sono attivi.
- **Metrics CSV**
  - Header YAML-like con `run_id`, `seed`, `label`, CLI args.
  - Campi per tick/anni, popolazione, energia media/varianza, diversita' tratti, `global_o2`, `global_co2`.

## Decisioni e trade-off
- **NumPy puro vs GPU:** garantisce portabilita' e profiling semplice, ma scala meno di una pipeline CUDA dedicata.
- **Assenza di checkpoint:** riduce complessita' ma impedisce resume di run lunghe; accettato per mantenere storage minimale.
- **DearPyGui come unica GUI:** scelta per performance e API immediate-mode; trade-off e' il requisito OpenGL 3.3.
- **File YAML opzionali:** abilitano preset condivisi ma introducono duplicita' di configurazione (CLI + YAML), percio' il CLI override prevale sempre.
- **Renderer headless limitato:** non copre tutte le feature GUI (es. inspector dettagliato); accettato per velocizzare batch server-side.

## Debiti tecnici noti
- Nessun sistema di plugin per generatori di mappe o rule-set: oggi serve modificare direttamente i moduli core.
- Mancanza di validazione schema per i file `.npz` di mappa (gli errori emergono solo a runtime).
- Metriche salvano solo aggregati; non esiste cronologia completa per singolo pixel.
