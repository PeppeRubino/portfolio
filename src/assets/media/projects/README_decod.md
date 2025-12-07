# Decod v2

Decod v2 e' una GUI desktop per Windows dedicata alla trascrizione avanzata di file audio/video, con diarizzazione multi-speaker, riconoscimento facciale, post-processing automatico e gestione delle licenze via Firebase + Stripe. L'app punta a offrire un flusso "seleziona file -> ottieni .docx formattato" anche a utenti non tecnici.

## Funzionalita' principali
- **Trascrizione Whisper** con modelli fast/medium/accurate (faster-whisper + PyTorch) e scelta dinamica della lingua UI (it/en/fr/...)
- **Pipeline di diarizzazione completa**: VAD Silero locale, clustering con Resemblyzer, associazione manuale tramite GUI e fallback sugli embedding salvati in `emb/`
- **Face recognition sui video** (MTCNN + InceptionResnet) per suggerire speaker coerenti tra audio e volto
- **Post-processing intelligente**: normalizzazione audio/video (ffmpeg), correzione ripetizioni, docx formattati e opzionale LanguageTool
- **Licensing integrato**: login/signup via Firebase Auth, verifica/renew di chiavi in Firestore e pagamenti Stripe con poller
- **Packaging pensato per distribuzione**: supporto a Nuitka onefile con splash, certificati SSL copiati automaticamente e gestione delle risorse tramite `resource_path`

## Struttura del progetto
```
Decod/
|-- main.py                # bootstrap decryptor + login + avvio GUI
|-- config.py              # preferenze utente (lingua, cache credenziali)
|-- credential/            # auth Firebase/Stripe + decryptor
|-- gui/                   # tutte le finestre Tkinter (login, app principale, match speaker, pagamenti...)
|-- utils/                 # pipeline di trascrizione, diarizzazione, VAD, salvataggio docx, face-recognition, Stripe poller
|-- emb/                   # cache di embedding e thumbs dei volti
|-- models/                # asset runtime (ffmpeg.exe, silero_vad.jit, ...)
|-- output/                # trascrizioni .docx generate
|-- test/                  # clip di esempio
`-- three.txt              # comando Nuitka consigliato e appunti operativi
```

## Prerequisiti
### Ambiente
- Windows 10/11 64 bit
- Python 3.10 (consigliata build x64 ufficiale)
- Visual C++ Build Tools + driver GPU NVIDIA aggiornati se si vuole usare CUDA

### Dipendenze Python
Installabili tutte tramite `requirements.txt`:
```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```
> Torch 2.2 e torchaudio 2.2 vengono gia' elencati: se serve CUDA differente, installa la ruota corretta **prima** del resto e rimuovi le righe corrispondenti dal file.

### Asset locali
- `models/ffmpeg.exe`: binario ffmpeg 64 bit; quello attuale nel repo funziona out-of-the-box.
- `models/silero_vad.jit`: peso TorchScript del modello Silero VAD.
- Facoltativo: copia qui altri binari richiesti (es. dll di libsndfile se distribuisci come exe).

### Segreti e licenze
- `credential/auth_values.py` deve contenere i token cifrati (API Stripe, Firebase, Gmail...) prodotti con la stessa `CRYPT_KEY` usata in produzione.
- Il decryptor (`credential/decryptor.py`) recupera la chiave Fernet dal documento Firestore `crypt_key/crypt_key`. Per ambienti offline puoi:
  1. Impostare la variabile `CRYPT_KEY` in `credential/auth_values.py` (bytes) e modificare `_get_crypt_key_prefer_firestore` per usarla direttamente, oppure
  2. Cambiare l'URL di Firestore verso un backend interno.
- Firebase Auth/Firestore: crea il progetto, abilita email+password, crea la collezione `user_licenses` con campi `email`, `key`, `expiration` e popola `crypt_key/crypt_key`.
- Stripe: configura un prodotto "licenza mensile" e sostituisci `STRIPE_PAYMENT_LINK`/`PRODUCT_PRICE_ID` con i tuoi valori cifrati.

## Avvio dell'applicazione
1. Assicurati che `ffmpeg.exe` e `silero_vad.jit` siano presenti e che la macchina abbia accesso a internet per recuperare la chiave di decrypt, Firebase e Stripe.
2. Attiva il virtualenv e lancia:
   ```powershell
   venv\Scripts\Activate.ps1
   python main.py
   ```
3. All'avvio:
   - `credential.decryptor` inizializza i segreti (fallisce se Firestore non risponde).
   - `gui.payment_gui.setup_ssl_cert` copia `cacert.pem` in una cartella temporanea e forza le variabili `SSL_CERT_FILE`, requisito per Stripe dietro firewall/packager.
   - L'app tenta il login silente usando `config.py` (`EMAIL_USER`, `PASSWORD_USER`, `KEY`). In caso negativo apre la GUI di login/registrazione (`gui/auth_gui.py`).
4. Dopo il login si apre `TranscriptionApp`:
   - scegli lingua UI e modello Whisper (fast/medium/accurate);
   - carica un file audio/video (`.mp3`, `.wav`, `.mp4`, `.mkv`, `.avi`, `.mov`);
   - avvia la trascrizione. La pipeline gira in un thread separato e aggiorna la barra fasi (`gui/phase_manager_gui.ProgressWidget`).
5. Per i video viene lanciata prima `utils.video_utils.process_video_audio`, poi `VideoFacePresence` per popolare la GUI di match speaker (`gui/match_gui`); per l'audio-only viene creato un WAV migliorato in `temp/`.
6. Al termine ricevi due notifiche:
   - prompt "file salvato" e finestra `helper_gui_1` per ricordare la cartella;
   - trascrizione DOCX salvata in `output/<nome file>.docx` con testi tipo `[mm:ss] Speaker: frase`.

### Cartelle runtime
- `temp/`: buffer audio/video e facce estratte. Viene ripulita da `remove_dirs("temp")` al termine di ogni file.
- `emb/`: contiene sia cache `_cache.npy` (VAD/Whisper) sia embedding dei parlanti (un `.npy` per speaker). Usa il bottone "Clear Cache" per ripulire se gli abbinamenti diventano incoerenti.
- `output/`: risultanti finali.

## Gestione pagamenti e licenze
1. L'utente puo' registrarsi con email/password: `credential.auth.signup` crea l'utente su Firebase Auth, genera una chiave trial (7 giorni) e invia la mail professionale via Gmail SMTP.
2. Quando una chiave e' scaduta l'app propone `gui.payment_gui.show_payment_window`:
   - apre il checkout Stripe pubblico (`STRIPE_PAYMENT_LINK`);
   - avvia `utils.payment_utils.PaymentPoller` che interroga Stripe (Checkout Sessions -> PaymentIntents -> Charges) ogni n secondi con SSL pinning;
   - al pagamento rilevato chiama `perform_firebase_update_after_payment`, aggiorna `user_licenses` con nuova `key/expiration` e invia mail di conferma.
3. Tutte le richieste HTTP devono poter raggiungere Firebase/Stripe; usa un proxy di sistema se necessario.

## Packaging con Nuitka (facoltativo)
Il file `three.txt` contiene il comando completo gia' testato per generare un eseguibile onefile con splash-screen, icona, certifi bundle e tutte le dipendenze principali:
```powershell
python -m nuitka main.py --onefile --windows-console-mode=force ... --output-dir build
```
Adatta percorsi/nomi e assicurati che:
- il virtualenv contenga tutte le dipendenze;
- `numba/`, `librosa/util/example_data/` e gli asset elencati siano inclusi con `--include-data-*`;
- dopo il build copi `models/` accanto all'eseguibile o dentro il bundle (ffmpeg + silero).

## Consigli operativi
- **GPU opzionale**: se non c'e' CUDA, Torch ricade su CPU e `fast-whisper` usa `int8`. Puoi forzare CPU settando `DEFAULT_DEVICE = "cpu"`.
- **Lingua UI**: il menu a tendina salva permanentemente la scelta riscrivendo `config.py` (vedi `_update_config_file`). Evita di committare il file modificato.
- **Pulizia cache**: elimina periodicamente `emb/` e `temp/` per ridurre l'occupazione disco e garantire che i nuovi speaker vengano richiesti nella GUI.
- **Debug decryptor**: lancia `python -m credential.decryptor` dopo aver impostato `debug=True` in `init_decryptor` per verificare Firestore.
- **Verifiche Stripe**: imposta `STRIPE_LOG=debug` ed esegui `check_recent_payment` da REPL per controllare la connettivita' SSL in ambienti filtrati.

## Domande frequenti
- **Errore "Impossibile inizializzare decryptor" all'avvio**: Firestore non e' raggiungibile o la chiave e' errata. Controlla proxy, API key e documento `crypt_key`.
- **Finestra principale si blocca**: una richiesta di rete in `gui/payment_gui` sta girando sul thread UI. Chiudi e riapri con una connessione stabile o sposta le operazioni lente in thread separati.
- **Le facce non vengono rilevate**: verifica che `opencv-python` trovi i codec necessari e che la GPU sia disponibile; puoi ridurre `sample_every_sec` in `utils.face_recognition.VideoFacePresence`.
- **Il docx non ha grammatica corretta**: installa Java + `language_tool_python` e assicurati che `LT_AVAILABLE` diventi True.

## Informativa e Disclaimer
- **Titolare e responsabilità**: Decod App e' sviluppata e distribuita da Giuseppe Rubino. L'applicazione funziona integralmente in locale e non invia file audio/video o trascrizioni a server esterni, salvo esplicite azioni dell'utente.
- **Trattamento dei dati**: caricando file audio o video potenzialmente contenenti dati personali o sensibili, l'utente rimane l'unico responsabile della liceita' dell'uso e della conservazione dei contenuti generati (cache `temp/`, `emb/`, documenti `output/`).
- **Uso consentito**: la licenza mensile concede unicamente l'utilizzo personale/professionale del software cosi' com'e'. Non viene garantita idoneita' per impieghi forensi, probatori o in ambiti regolamentati. Gli output non sono certificati.
- **Limitazioni**: non sono fornite garanzie espresse o implicite su accuratezza, continuita' del servizio o compatibilita' con normative di settore (GDPR, HIPAA, ecc.). L'utente e' tenuto a verificare la conformita' del proprio uso e ad adottare misure di sicurezza adeguate (backup, cifratura, cancellazione della cache).
- **Supporto**: per chiarimenti o richieste scrivere a giusepperubino.psy@virgilio.it. L'utilizzo dell'applicazione implica l'accettazione integrale di quanto sopra.

---
Per personalizzazioni piu' spinte (nuovi modelli Whisper, esportazioni differenti, o sistemi di licensing diversi) consulta direttamente i moduli `utils/transcriber.py`, `gui/main_gui.py` e `credential/auth.py`.
