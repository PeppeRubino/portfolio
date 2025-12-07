# Architettura

## Flusso generale
1. **Bootstrap (`main.py`)**
   - Disattiva il JIT di Numba, inizializza il decryptor (`credential.decryptor.init_decryptor`) per ottenere la chiave Fernet da Firestore e decriptare segreti/cache locali.
   - Applica `gui.payment_gui.setup_ssl_cert()` per copiare il certificato `cacert.pem` in una cartella scrivibile e impostare le variabili `SSL_CERT_FILE` / `REQUESTS_CA_BUNDLE` prima di importare Stripe o Requests.
   - Tenta il login silente usando `config.py` (EMAIL_USER, PASSWORD_USER, KEY); in caso di fallimento apre la GUI di autenticazione (`gui/auth_gui.py`).

2. **Autenticazione (`gui/auth_gui.py`, `credential/auth.py`)**
   - Gestisce registrazione/login via Firebase Auth REST API.
   - Salva opzionalmente le credenziali cifrate in `config.py` dopo averle riconvertite con Fernet.
   - Verifica l’esistenza di una licenza valida in Firestore (`user_licenses/{uid}`) e ne controlla la scadenza.

3. **GUI principale (`gui/main_gui.py`)**
   - Fornisce i selector di lingua e modello, la lista file, i controlli di avvio e il `ProgressWidget`.
   - Aggiorna `config.py` quando cambia la lingua, in modo da mantenere la preferenza tra esecuzioni.
   - Avvia un thread dedicato per la trascrizione (`self._run_transcription`) mantenendo la UI responsiva grazie a callback `root.after`.

4. **Pipeline di trascrizione (`utils/transcriber.py`)**
   - Estrae l’audio con `utils.video_utils.process_video_audio` (per i video) o normalizza il file tramite `enhance_audio_with_compressor` (per gli audio).
   - Esegue VAD con `utils.vad_utils.get_speech_segments`, memorizzando i risultati in `emb/<nome>_cache.npy` per saltare ricalcoli futuri.
   - Carica il modello Faster-Whisper (`utils.transcription.get_cached_whisper_model`) e produce segmenti testuali.
   - Lancia la diarizzazione: costruisce candidati speaker con Resemblyzer, apre la GUI di matching (`gui/match_gui`, `gui/helper_gui_2`) e sfrutta facoltativamente i volti pre-rilevati (`utils.face_recognition.VideoFacePresence`).
   - Applica la correzione delle ripetizioni (`utils.fix_repetitions`) e salva l’output in DOCX via `utils.save_docx`.

5. **Pagamenti e licenze (`gui/payment_gui.py`, `utils/payment_utils.py`)**
   - Allo scadere della chiave trial o mensile mostra la finestra Stripe: avvisa l’utente, apre il link di checkout e avvia `PaymentPoller`.
   - Il poller interroga Stripe (Checkout Sessions, PaymentIntents, Charges) finché non riceve una conferma o scade la finestra temporale; a pagamento rilevato aggiorna Firestore e invia la mail di conferma.
   - Riutilizza il certificato SSL forzato dal bootstrap, così da evitare problemi di CA in ambienti chiusi.

## Moduli principali
- **`credential/`**
  - `decryptor.py`: logica di bootstrap dei segreti (lettura Firestore, decrypt, iniezione negli altri moduli).
  - `auth.py`: registrazione/login, invio e-mail, validazione licenze, gestione config.
  - `auth_values.py`: archivio dei token cifrati (Stripe, Firebase, Gmail, ecc.).

- **`gui/`**
  - `main_gui.py`: finestra principale, gestione file, progressione pipeline e thread.
  - `match_gui.py`, `helper_gui_2.py`: matching speaker/facce, gestione drag&drop, preview audio via `sounddevice`.
  - `payment_gui.py`: setup SSL, interfaccia pagamenti, pulsanti e messaggi.
  - `phase_manager_gui.py`: visualizzazione dei passi con timer e barre di avanzamento.
  - `style_gui.py`: palette colori, font, costanti grafiche.

- **`utils/`**
  - `transcriber.py`: orchestratore dell’intera pipeline.
  - `vad_utils.py`: loader Silero locale e heuristics anti-musica/applausi.
  - `video_utils.py`: estrazione audio via ffmpeg e salvataggio file temporanei.
  - `fs_utils.py`: risoluzione dei path compatibile con eseguibili Nuitka/PyInstaller (`resource_path`).
  - `face_recognition.py`: rilevazione e clustering dei volti con `facenet-pytorch`.
  - `payment_utils.py`: Poller Stripe, aperture browser, gestione dialoghi di attesa.

## Cartelle runtime
- **`temp/`**: contiene WAV temporanei, thumbs dei volti, metadata. Viene ricreata/ripulita via `remove_dirs("temp")`.
- **`emb/`**: raccoglie cache VAD/Whisper (`*_cache.npy`) e embedding parlanti/volti riutilizzati per futuri progetti.
- **`output/`**: directory finale per i `.docx`.
- **`models/`**: asset binari forniti con l’app (ffmpeg.exe, silero_vad.jit, eventuali DLL ausiliarie).

## Servizi esterni
- **Firebase Auth / Firestore**: unico canale per l’ottenimento della chiave Fernet e per la gestione delle licenze; senza connessione l’applicazione termina con errore.
- **Stripe**: usato solo per il checkout e la verifica dei pagamenti; tutte le API passano dai moduli Python `stripe` e `requests`.
- **Gmail SMTP**: invia le e-mail di registrazione e conferma pagamento usando le credenziali decryptate a runtime.

## Packaging / Deployment
- Il file `three.txt` riepiloga il comando `python -m nuitka ...` con plugin Tk, icone, splash screen, include di dati (certificati, librerie soundfile, modelli) e `--nofollow-import` per ridurre la dimensione.
- `fs_utils.resource_path` verifica `_MEIPASS`, il path dell’eseguibile e la cartella `.dist` per trovare asset in contesti “frozen”.
- La GUI non richiede privilegi elevati; per la distribuzione basta fornire l’eseguibile insieme alle cartelle `models/`, `emb/` (vuota) e alle risorse grafiche.

## Test interni
- `tests/test_core_utils.py` (suite `unittest`) copre funzioni pure come `format_time`, `get_translation`, `fix_repetitions` e `credential.auth.is_key_expired`. Serve agli sviluppatori e non viene distribuita con l’eseguibile finale.
