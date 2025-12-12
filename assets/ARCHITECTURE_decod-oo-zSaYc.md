# Decod v2 - Architecture

## Scopo del documento
Descrivere esclusivamente l'architettura interna di Decod v2: componenti, dipendenze, flussi e decisioni progettuali che permettono alla suite desktop di erogare trascrizioni con diarizzazione e licensing. Per installazione e utilizzo consultare il README.

## Panoramica
Decod e' organizzato in tre blocchi principali:
1. **Runtime Core** (`main.py`, `config.py`, `credential/`): bootstrap, recupero segreti da Firestore, gestione config persistente.
2. **Experience Layer** (`gui/`, `media/`): UI Tkinter, match speaker/facce, orchestrazione pagamenti.
3. **Processing Layer** (`utils/`, `models/`): pipeline audio/video, trascrizione Whisper, diarizzazione, salvataggio DOCX.

La comunicazione avviene principalmente tramite:
- Eventi Tkinter e callback `root.after` tra GUI e pipeline.
- Thread dedicati per la trascrizione per non bloccare l'interfaccia.
- File system condiviso per cache (`emb/`, `temp/`) e output (`output/`).
- API esterne (Firebase/Stripe/Gmail) tramite moduli `credential/*.py` e `utils/payment_utils.py`.

## Principi di design
- **Local-first:** tutti i file sensibili restano su disco dell'utente; la rete serve solo per licenze e pagamenti.
- **Thread separation:** pipeline CPU/GPU gira fuori dal main thread Tkinter con sincronizzazione tramite callback.
- **Deterministic caching:** `emb/` mantiene cache VAD/Whisper e embedding per accelerare run successive.
- **Fail-fast networking:** il bootstrap blocca l'app se Firestore o Stripe non rispondono, prevenendo stati incoerenti.
- **Packager-friendly:** `fs_utils.resource_path` e asset statici permettono bundle Nuitka/PyInstaller senza patch manuali.

## Componenti principali
### Runtime Core
| Path | Responsabilita' | Dipendenze |
| --- | --- | --- |
| `main.py` | Bootstrap app, init decryptor, login silente, mount GUI principale. | `credential.decryptor`, `config`, `gui.main_gui`. |
| `credential/decryptor.py` | Recupera chiave Fernet da Firestore (o fallback locale), decripta i token per altri moduli. | `google-cloud-firestore`, `cryptography`. |
| `credential/auth.py` | Signup/login Firebase, gestione licenze (`user_licenses`), persistenza config cifrata. | `requests`, `firebase_admin`, `python-docx`. |
| `config.py` | File Python riscritto runtime con credenziali e preferenze. | Accesso file system. |

### Experience Layer
| Path | Responsabilita' | Dipendenze |
| --- | --- | --- |
| `gui/main_gui.py` | UI principale, gestione file e progress widget, avvio thread pipeline. | `tkinter`, `threading`, `utils.transcriber`. |
| `gui/match_gui.py`, `gui/helper_gui_2.py` | Matching speaker/facce, preview audio, preferenze di associazione. | `sounddevice`, `utils.face_recognition`. |
| `gui/payment_gui.py` | Setup certificati, modale Stripe, avvio PaymentPoller. | `ssl`, `webbrowser`, `utils.payment_utils`. |
| `gui/phase_manager_gui.py` | Stato pipeline e timer visuali. | `tkinter`. |

### Processing Layer
| Path | Responsabilita' | Dipendenze |
| --- | --- | --- |
| `utils/transcriber.py` | Orchestrazione pipeline (estrazione audio, Whisper, diarizzazione, cleanup). | `faster_whisper`, `numpy`, `docx`. |
| `utils/vad_utils.py` | VAD Silero, gestione segmenti e cache. | `torch`, `silero-vad`. |
| `utils/video_utils.py` | Estrazione audio/video via ffmpeg, normalizzazione livelli. | `ffmpeg`, `numpy`. |
| `utils/face_recognition.py` | Rilevazione e clustering volti con facenet-pytorch. | `torch`, `facenet-pytorch`, `opencv`. |
| `utils/payment_utils.py` | Polling Stripe, verifica pagamenti, update Firestore. | `stripe`, `requests`. |
| `utils/fs_utils.py` | `resource_path`, cleanup cartelle runtime, compatibilita' bundle. | `os`, `shutil`. |

## Flussi chiave
1. **Avvio e decrypt**
   - `main.py` -> `credential.decryptor.init_decryptor()` -> Firestore `crypt_key/crypt_key` -> Fernet key in memoria.
   - Scrive certificato CA su `%TEMP%` e setta `SSL_CERT_FILE`.
   - Tenta login silente con dati in `config.py`; se fallisce apre `gui/auth_gui`.
2. **Transcrizione completa**
   - L'utente seleziona file -> `gui.main_gui` avvia thread `Transcriber`.
   - `transcriber.py` usa `video_utils`/`vad_utils` per preparare l'audio e carica il modello Whisper (cache globale).
   - Output segmenti -> `face_recognition` + `match_gui` per allineare speaker/facce -> `save_docx`.
3. **Licensing e pagamenti**
   - `auth.py` verifica licenza Firestore, se scaduta lancia `payment_gui`.
   - `payment_gui` apre checkout Stripe e avvia `PaymentPoller`.
   - `PaymentPoller` verifica PaymentIntent -> aggiorna Firestore -> invia e-mail di conferma via Gmail SMTP.
4. **Packaging**
   - Comando Nuitka (in `three.txt`) include asset, moduli e certificati.
   - `fs_utils.resource_path` risolve path runtime, `setup_ssl_cert` copia `cacert.pem` vicino all'eseguibile estratto.

## Modello dati
- **Config locale (`config.py`)**
  - `EMAIL_USER`, `PASSWORD_USER`, `KEY`, `LANG_UI`, `MODEL_PRESET`.
  - Sovrascritto runtime; cifrato con Fernet prima del salvataggio.
- **Cache VAD/Whisper (`emb/*.npy`)**
  - Segmenti VAD con timestamp, embedding speaker (Resemblyzer), mapping `speaker_id -> face_id`.
- **Firestore**
  - Collezione `user_licenses`: `{uid, email, key, expiration, tier}`.
  - Doc `crypt_key/crypt_key`: contiene `encrypted_key`, `nonce`, `version`.
- **Stripe**
  - Checkout Session id e PaymentIntent id salvati localmente per riprendere il polling.

## Decisioni e trade-off
- **Tkinter + threading:** scelti per velocita' di sviluppo; il main thread non puo' bloccare I/O, quindi si usano worker e callback.
- **Config come modulo Python:** facilita gli update ma rischia conflitti manuali; accettato perche' l'app gira in single-user mode.
- **Cache su disco:** accelera run successive ma impone pulizia manuale (`Clear cache`); mancano quote automatiche.
- **Dipendenza da Firebase/Stripe:** senza rete l'app non parte; trade-off per tutelare licensing e pagamenti.
- **Nuitka onefile:** pacchetto unico riduce errori utente ma aumenta tempi di build e debugging rispetto a PyInstaller.

## Debiti noti
- Mancanza di test end-to-end automatizzati sulla pipeline multithread.
- Nessun retry sofisticato per Firestore/Stripe oltre al fail-fast iniziale.
- GUI e pipeline condividono parte dello stato globale (`config.py`, singleton `Transcriber`), rendendo piu' complesso il refactor verso plugin modulari.
