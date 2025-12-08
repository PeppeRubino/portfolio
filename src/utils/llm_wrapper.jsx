// utils/llm_wrapper.jsx
const RAW_GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_KEY =
  typeof RAW_GROQ_API_KEY === "string" ? RAW_GROQ_API_KEY.trim() : "";

/**
 * System prompt principale - in italiano.
 */
const SYSTEM_PROMPT = {
  role: "system",
  content: `Ti chiami Luce e sei l'assistente virtuale del portfolio di Giuseppe Rubino.
Parla in italiano con un tono caldo, professionale e cordiale: evita frasi meccaniche e aggiungi piccole sfumature empatiche senza essere prolissa.
Usa i dati forniti per formulare risposte naturali: riassumi, riformula e proponi follow-up utili.

IMPORTANTISSIMO: quando parli di Giuseppe Rubino **usa sempre la terza persona singolare**.
- Puoi citare il suo nome completo una sola volta per risposta, poi prova a usare "lui", "il suo", "di Giuseppe".
- Non dire mai "io", "mio" o "nostro" riferendoti a informazioni che riguardano lui (es.: "il suo curriculum", "la sua esperienza").
- Non affermare "ti mando il mio curriculum": dì "posso farti scaricare il suo curriculum".

Usa la prima persona solo quando descrivi quello che fai tu (Luce), es.: "Posso guidarti tra i progetti", "Posso inviarti il suo CV".

Se la domanda è ambigua o troppo generale, poni una domanda di chiarimento breve (es.: "Intendi la biografia, i progetti o il CV?").
Se manca l'informazione richiesta, dillo onestamente e suggerisci alternative (es.: mostrare i progetti disponibili, offrire il CV, chiedere chiarimenti).
Rifiuta gentilmente richieste non pertinenti al portfolio. Mantieni le risposte concise salvo richiesta esplicita di approfondimento o valutazione.
Evita ripetizioni superflue e varia la struttura delle frasi in modo naturale.`
};

function containsAny(text, arr) {
  if (!text) return false;
  const t = String(text).toLowerCase();
  return arr.some(w => t.includes(w.toLowerCase()));
}

export function normalizeHistory(rawHistory) {
  const msgs = [];
  if (!rawHistory || !rawHistory.length) return msgs;

  rawHistory.forEach(item => {
    if (item && typeof item === "object" && "user" in item) {
      const userText = item.user ? String(item.user) : null;
      const assistantText = item.assistant ? String(item.assistant) : null;
      if (userText) msgs.push({ role: "user", content: userText });
      if (assistantText) msgs.push({ role: "assistant", content: assistantText });
      return;
    }
    if (item && typeof item === "object" && item.role && item.content) {
      msgs.push({ role: item.role, content: String(item.content) });
      return;
    }
    if (Array.isArray(item) && item.length === 2) {
      const [u, a] = item;
      if (u) msgs.push({ role: "user", content: String(u) });
      if (a) msgs.push({ role: "assistant", content: String(a) });
      return;
    }
    if (typeof item === "string") {
      msgs.push({ role: "user", content: item });
    }
  });

  return msgs;
}

/**
 * generateAnswer(prompt, chatHistory, context)
 */
export async function generateAnswer(prompt, chatHistory = [], context = null) {
  if (!prompt || !String(prompt).trim()) return "Dimmi pure, sono qui per aiutarti!";

  const userPrompt = String(prompt).trim();
  const normalized = normalizeHistory(chatHistory);

  // keyword sets
  const ownerKeywords = ["proprietario", "a chi appart", "chi è il proprietario", "chi ha creato", "autore", "chi è giuseppe", "chi è giuseppe rubino"];
  const projectKeywords = ["progetto", "progetti", "mostrami il progetto", "info sul progetto"];
  const vagueKeywords = ["cosa puoi fare", "come funziona", "mi aiuti", "sto cercando", "dove trovo", "voglio sapere"];

  // 0) if context indicates stopModel (cv_request), handle immediately
  if (context && context.stopModel) {
    if (context.reason === "cv_request") {
      return "Certo, posso farti scaricare il suo curriculum. Premi il pulsante per ottenerlo oppure dimmi se preferisci una breve sintesi.";
    }
  }

  // 1) if user asks about owner but there's NO context, ask quick clarification
  if (!context && containsAny(userPrompt, ownerKeywords)) {
    return "Vuoi informazioni sull'autore del portfolio (Giuseppe Rubino)? Posso mostrarti la biografia, i dettagli scolastici, l'elenco dei progetti o il CV. Cosa preferisci?";
  }

  // 2) if mentions "project" but no context -> ask which or offer list
  if (!context && containsAny(userPrompt, projectKeywords) && !containsAny(userPrompt, ["nome", "dettaglio", "quale"])) {
    return "Cerchi informazioni su un progetto in particolare o vuoi che ti mostri la lista completa dei progetti?";
  }

  // 3) vague question and no context -> propose options
  if (!context && containsAny(userPrompt, vagueKeywords)) {
    return "Posso aiutarti con la biografia, i progetti o il CV. Quale preferisci che approfondisca?";
  }

  // --- build messages
  const messagesToSend = [];
  messagesToSend.push(SYSTEM_PROMPT);

  // 4) context: project
  if (context && context.type === "project" && context.data) {
    const p = context.data;
    const modules = Array.isArray(p.modules) ? p.modules.join(", ") : (p.modules || "");
    const langs = p.languages ? (typeof p.languages === "string" ? p.languages : JSON.stringify(p.languages)) : "";
    messagesToSend.push({
      role: "system",
      content: `Dati progetto (usa questi fatti per rispondere in modo naturale; non inventare altro):
ID: ${p.id || ""}
Nome: ${p.name || ""}
Sottotitolo: ${p.subtitle || ""}
Descrizione: ${p.description || ""}
Moduli: ${modules}
Creato il: ${p.createdAt || ""}
Linguaggi: ${langs}

Istruzioni: se la domanda richiede dettagli non presenti qui, dillo e chiedi cosa l'utente vuole sapere esattamente (es.: "Vuoi sapere le tecnologie usate o lo scopo del progetto?").`
    });
  }

  // 5) context: about (formatta i campi dell'oggetto in testo leggibile)
  else if (context && context.type === "about" && context.data) {
    const aboutObj = context.data;
    let aboutText = "";

    if (typeof aboutObj === "string") {
      aboutText = aboutObj;
    } else if (typeof aboutObj === "object") {
      const keysOrder = ["name", "summary", "bio", "general_info", "school", "university", "age"];
      const lines = [];

      keysOrder.forEach(k => {
        if (aboutObj[k]) lines.push(`${k.charAt(0).toUpperCase() + k.slice(1)}: ${aboutObj[k]}`);
      });

      // aggiungi projectsSummary e cvAvailable in modo leggibile
      if (Array.isArray(aboutObj.projectsSummary) && aboutObj.projectsSummary.length) {
        lines.push("Projects summary:");
        aboutObj.projectsSummary.forEach(p => {
          lines.push(`- ${p.name}${p.subtitle ? " — " + p.subtitle : ""}${p.id ? " (" + p.id + ")" : ""}`);
        });
      }

      if (aboutObj.cvAvailable) {
        lines.push("CV available: yes");
      }

      // eventuali altri campi stringa/numero
      Object.keys(aboutObj).forEach(k => {
        if (!keysOrder.includes(k) && k !== "projectsSummary" && k !== "cvAvailable") {
          const v = aboutObj[k];
          if (typeof v === "string" || typeof v === "number") lines.push(`${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}`);
        }
      });

      aboutText = lines.join("\n");
    } else {
      aboutText = String(aboutObj);
    }

    messagesToSend.push({
      role: "system",
      content: `Dati personali disponibili (usa questi fatti per rispondere in modo naturale; non inventare altro):
${aboutText}

Istruzioni: se l'utente chiede "cosa sai dirmi su di lui", usa il riassunto e proponi opzioni: biografia breve, dettagli scolastici, elenco progetti o scaricare il CV. Se l'informazione richiesta non è presente, dillo e suggerisci il percorso alternativo (es.: "vuoi che ti mostri i progetti o che ti mandi il CV?").`
    });
  }

  // 6) context: projects_list
  else if (context && context.type === "projects_list" && Array.isArray(context.data)) {
    const summary = context.data.map(p => `- ${p.name || p.id || "unknown"}: ${p.subtitle || ""}`).join("\n");
    messagesToSend.push({
      role: "system",
      content: `Disponibili questi progetti (usa l'elenco solo per orientare la risposta):
${summary}

Istruzioni: suggerisci possibili follow-up (es.: "Vuoi informazioni su uno di questi progetti in particolare?").`
    });
  } else {
    // no structured context provided
    messagesToSend.push({
      role: "system",
      content: `Non sono stati forniti dati strutturati. Rispondi solo se la domanda è chiaramente pertinente al portfolio; altrimenti poni una domanda di chiarimento o suggerisci opzioni utili (biografia, lista progetti, scaricare CV).`
    });
  }

  // 7) cronologia e user prompt
  if (normalized.length) messagesToSend.push(...normalized.slice(-10));
  messagesToSend.push({ role: "user", content: userPrompt });

  // 8) chiamata API
  try {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: messagesToSend,
        temperature: 0.35,
        max_tokens: 520
      }),
      timeout: 30000
    });

    if (!resp.ok) throw new Error(`Chat error ${resp.status}`);

    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content || "";
    return String(reply).trim();
  } catch (err) {
    console.error("[generateAnswer] Errore Groq:", err);
    return "Mi dispiace, c’è stato un problema tecnico nel generare la risposta. Prova a riformulare o chiedi la lista dei progetti.";
  }
}
