// utils/knowledge.js
import projects from "../media/data/projects.json"; // adatta il path se necessario
import about from "../media/data/about.json";

/**
 * Funzioni di utilità
 */
function containsAny(text, arr) {
  if (!text) return false;
  const t = String(text).toLowerCase();
  return arr.some(w => t.includes(w.toLowerCase()));
}

function pickAboutFields(requestedFields = []) {
  // restituisce un oggetto con solo i campi presenti in about
  const out = {};
  if (!Array.isArray(requestedFields) || requestedFields.length === 0) {
    // default: piccolo riassunto e nome
    if (about.bio) out.summary = about.bio;
    else if (about.general_info) out.summary = about.general_info;
    if (about.name) out.name = about.name;
    return out;
  }

  requestedFields.forEach(f => {
    if (f === "name" && about.name) out.name = about.name;
    if (f === "age" && about.age) out.age = about.age;
    if (f === "bio" && about.bio) out.bio = about.bio;
    if (f === "school" && (about.school_info || about.school)) out.school = about.school_info || about.school;
    if (f === "university" && (about.university_info || about.university)) out.university = about.university_info || about.university;
    if (f === "general" && about.general_info) out.general_info = about.general_info;
  });

  return out;
}

/**
 * analyzePrompt
 * - ritorna oggetti del tipo:
 *    { stopModel: true, reason: "cv_request" }
 *    { stopModel: false, type: "project", data: projectObj }
 *    { stopModel: false, type: "about", subtype: "general|school|university|owner", data: {...} }
 *    { stopModel: false, type: "projects_list", data: projectsArray }
 *    { stopModel: false, type: "unknown" }
 */
function projectsSummary(max = 5) {
  if (!Array.isArray(projects)) return [];
  return projects.slice(0, max).map(p => ({
    id: p.id,
    name: p.name,
    subtitle: p.subtitle
  }));
}

export function analyzePrompt(prompt) {
  const lower = (prompt || "").toLowerCase();

  // 1) richiesta CV -> blocco e mostra bottone
  if (/\b(curriculum|cv|curriculum vitae)\b/.test(lower)) {
    return { stopModel: true, reason: "cv_request" };
  }

  // 2) cerca project per id, name, subtitle
  const project = projects.find(p => {
    const name = (p.name || "").toLowerCase();
    const id = (p.id || "").toLowerCase();
    const subtitle = (p.subtitle || "").toLowerCase();
    return (name && lower.includes(name)) || (id && lower.includes(id)) || (subtitle && lower.includes(subtitle));
  });
  if (project) {
    return { stopModel: false, type: "project", data: project };
  }

  // 3) richieste sull'autore / proprietario
  const ownerKeywords = [
    "proprietario", "a chi appartiene", "chi ha creato", "chi ha fatto", "chi è giuseppe",
    "chi è giuseppe rubino", "dimmi qualcosa su giuseppe", "chi è il proprietario", "autore"
  ];
  if (containsAny(lower, ownerKeywords) || lower.includes("giuseppe")) {
    const wantsName = /\b(nome|come si chiama|chi è)\b/.test(lower);
    const wantsBio = /\b(bio|biografia|parlami|informazioni su|cosa sai)\b/.test(lower);
    const wantsSchool = /\b(scuola|liceo|istituto|bisazza)\b/.test(lower);
    const wantsUni = /\b(universit|laurea|unime|scienze e tecniche)\b/.test(lower);
    const wantsAge = /\b(età|anni)\b/.test(lower);
    const wantsGeneral = /\b(cosa fai|che lavoro|mi occupo|cosa sai)\b/.test(lower);

    const fields = [];
    if (wantsName) fields.push("name");
    if (wantsBio) fields.push("bio");
    if (wantsSchool) fields.push("school");
    if (wantsUni) fields.push("university");
    if (wantsAge) fields.push("age");
    if (wantsGeneral) fields.push("general");

    const data = fields.length ? pickAboutFields(fields) : pickAboutFields([]);

    // --- arricchisci i dati con metainfo utili per il modello (non il PDF intero)
    data.cvAvailable = true; // indica che il CV esiste ed è scaricabile
    data.projectsSummary = projectsSummary(5); // array sintetico di progetti (id, name, subtitle)

    return { stopModel: false, type: "about", subtype: "owner", data };
  }

  // 4) about: scuola / università / generali (keyword-specific)
  if (lower.includes("scuola") || lower.includes("liceo") || lower.includes("bisazza")) {
    const data = pickAboutFields(["school"]);
    data.cvAvailable = true;
    return { stopModel: false, type: "about", subtype: "school", data };
  }
  if (lower.includes("università") || lower.includes("universita") || lower.includes("laurea") || lower.includes("unime")) {
    const data = pickAboutFields(["university"]);
    data.cvAvailable = true;
    return { stopModel: false, type: "about", subtype: "university", data };
  }
  if (/\b(chi sei|su di te|informazioni su|informazioni|dimmi qualcosa su|cosa sai)\b/.test(lower)) {
    const data = pickAboutFields(["bio", "general"]);
    data.cvAvailable = true;
    data.projectsSummary = projectsSummary(5);
    return { stopModel: false, type: "about", subtype: "general", data };
  }

  // 5) progetti generici
  if (lower.includes("progetto") || lower.includes("progetti")) {
    return { stopModel: false, type: "projects_list", data: projects };
  }

  // 6) frasi vaghe o richieste di aiuto -> unknown (invita a chiarire)
  if (/\b(cosa puoi fare|mi aiuti|come funziona|come posso|voglio sapere|sto cercando|puoi aiutarmi)\b/.test(lower)) {
    return { stopModel: false, type: "unknown" };
  }

  // 7) fallback -> unknown (invito a chiarire, non rifiuto)
  return { stopModel: false, type: "unknown" };
}