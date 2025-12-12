# Decod v2 - README

## Scopo
Decod v2 e' una suite desktop Windows che automatizza l'intero ciclo "carica audio/video -> ottieni trascrizione DOCX", integrando diarizzazione, riconoscimento facciale e licensing Stripe/Firebase pensato per studi professionali e reparti R&D.

## Stato
- **Maturita':** Beta stabile per uso professionale controllato.
- **Manutenzione:** attiva (patch mensili, supporto diretto autore).
- **Compatibilita':** solo Windows 10/11 x64; pipeline GPU opzionale.

## Requisiti
- **Linguaggi / runtime**
  - Python >= 3.10 (build ufficiale 64 bit).
  - Visual C++ Build Tools 14+, driver NVIDIA aggiornati per CUDA.
- **Librerie chiave**
  - faster-whisper 1.0+, PyTorch 2.2 (CPU o CUDA 12), torchaudio 2.2.
  - facenet-pytorch 2.5, Resemblyzer 0.23, Silero VAD (torchscript).
  - Stripe 9+, Firebase Admin SDK 6+, python-docx 1+, ffmpeg static bundle.
- **Servizi esterni**
  - Firebase Auth + Firestore (project produttivo con collezione `user_licenses` e doc `crypt_key/crypt_key`).
  - Stripe Checkout + PaymentIntents (prod/test).
  - Gmail SMTP (o provider SMTP equivalente) per e-mail operative.

## Installazione rapida
```powershell
git clone <repo> decod
cd decod
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy path\to\ffmpeg.exe models\
copy path\to\silero_vad.jit models\
```
Se serve CUDA diverso da quello in `requirements.txt`, installa la ruota torch corretta **prima** di lanciare `pip install -r requirements.txt`.

## Uso base
1. **Avvio GUI standard**
   ```powershell
.venv\Scripts\Activate.ps1
python main.py
   ```
2. **Forza lingua UI + modello**
   ```powershell
set DECOD_DEFAULT_LANG=it-IT
set DECOD_DEFAULT_MODEL=medium
python main.py --skip-auto-login
   ```
3. **Packaging Nuitka onefile (estratto)**
   ```powershell
python -m nuitka main.py ^
  --onefile --windows-disable-console ^
  --include-data-dir=models=models ^
  --include-data-dir=emb=emb ^
  --enable-plugin=tk-inter
   ```

## Configurazione essenziale
- `credential/auth_values.py`
  - `CRYPT_KEY` (fallback locale) e payload cifrati Stripe/Firebase/Gmail.
  - `STRIPE_PAYMENT_LINK`, `PRODUCT_PRICE_ID`, `SMTP_*`.
- `config.py`
  - `EMAIL_USER`, `PASSWORD_USER`, `KEY` per auto-login; aggiornati via GUI.
- Cartelle richieste all'avvio: `models/` (ffmpeg.exe, silero_vad.jit), `emb/`, `temp/`, `output/`.
- Variabili ambiente consigliate:
  - `GOOGLE_APPLICATION_CREDENTIALS` -> JSON service account Firestore.
  - `WHISPER_DEVICE` (`cpu`, `cuda`, `auto`).

## Link extra
- [Architettura dettagliata](ARCHITECTURE_decod.md)
- [Project overview / materiali marketing](../README_decod.md) *(separare doc pubblico se presente)*
- [Licensing & payments cheat-sheet](../ARCHITECTURE_decod.md#pagamenti) (sezione dedicata nel file architetturale)
