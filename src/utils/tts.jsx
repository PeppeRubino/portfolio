// utils/tts.jsx
const API_KEY = "sk_ada4ab4fe1b28ff871d8c75ce9e943e59c043a7de947867a"; // inserisci qui la tua chiave ElevenLabs
const VOICE_ID = "QttbagfgqUCm9K0VgUyT"; // Aida - Italian promotional content

export async function speakText(text) {
  if (!text) return;

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2", // modello più naturale e multilingue
          voice_settings: {
            stability: 0.7, // quanto la voce è fedele alla voce Aida
            similarity_boost: 0.7, // quanto varia la voce
          },
        }),
      }
    );

    if (!res.ok) throw new Error(`TTS API error: ${res.status}`);
    const audioData = await res.arrayBuffer();

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioCtx.decodeAudioData(audioData);
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioCtx.destination);
    source.start();

  } catch (err) {
    console.error("ElevenLabs TTS error:", err);
  }
}
