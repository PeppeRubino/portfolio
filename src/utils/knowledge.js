// utils/knowledge.js
import projects from "../assets/data/projects.json";
import about from "../assets/data/about.json";
import { detectDocPreferenceFromPrompt, matchProjectByText } from "./project_documents.js";

function containsAny(text, words) {
  if (!text) return false;
  const normalized = String(text).toLowerCase();
  return Array.isArray(words) && words.some((w) => normalized.includes(String(w).toLowerCase()));
}

function pickAboutFields(requestedFields = []) {
  const out = {};

  if (!Array.isArray(requestedFields) || requestedFields.length === 0) {
    if (about.bio) out.summary = about.bio;
    else if (about.general_info) out.summary = about.general_info;
    if (about.name) out.name = about.name;
    return out;
  }

  requestedFields.forEach((field) => {
    if (!field) return;
    const key = String(field);

    // alias/legacy
    if (key === "general") {
      if (about.general_info) out.general_info = about.general_info;
      return;
    }
    if (key === "school") {
      const value = about.school_info || about.school;
      if (value) out.school = value;
      return;
    }
    if (key === "university") {
      const value = about.university_info || about.university;
      if (value) out.university = value;
      return;
    }

    if (Object.prototype.hasOwnProperty.call(about, key) && about[key] != null) {
      out[key] = about[key];
    }
  });

  return out;
}

function projectsSummary(max = 5) {
  if (!Array.isArray(projects)) return [];
  return projects.slice(0, max).map((project) => ({
    id: project.id,
    name: project.name,
    subtitle: project.subtitle,
  }));
}

/**
 * analyzePrompt(prompt)
 * - returns:
 *   { stopModel: true, reason: "cv_request" }
 *   { stopModel: true, reason: "project_doc_confirm", data: { project, docPreference } }
 *   { stopModel: false, type: "project", data: projectObj }
 *   { stopModel: false, type: "about", subtype, data: aboutObj }
 *   { stopModel: false, type: "projects_list", data: projectsArray }
 *   { stopModel: false, type: "unknown" }
 */
export function analyzePrompt(prompt) {
  const lower = (prompt || "").toLowerCase();
  const normalizedTokens = lower
    .normalize("NFKC")
    .replace(/[^a-z0-9\u00c0-\u017f]+/g, " ")
    .trim();
  const tokens = normalizedTokens ? normalizedTokens.split(/\s+/) : [];
  const tokenSet = new Set(tokens);

  const aboutCategories = Array.isArray(about.categories) ? about.categories : [];
  const matchAboutCategory = () => {
    for (const category of aboutCategories) {
      if (!category || typeof category !== "object") continue;
      const keywords = Array.isArray(category.keywords)
        ? category.keywords.map((kw) => kw && kw.toLowerCase()).filter(Boolean)
        : [];
      const categoryTokens = Array.isArray(category.tokens)
        ? category.tokens.map((t) => t && t.normalize("NFKC").toLowerCase()).filter(Boolean)
        : [];

      const phraseHit = keywords.some((keyword) => lower.includes(keyword));
      const tokenHit = categoryTokens.length ? categoryTokens.some((t) => tokenSet.has(t)) : false;
      if (phraseHit || tokenHit) return category;
    }
    return null;
  };

  // 1) CV request -> stop model
  if (/\b(curriculum|cv|curriculum vitae)\b/.test(lower)) {
    return { stopModel: true, reason: "cv_request" };
  }

  // 2) project match by text/id/name/subtitle
  let project = matchProjectByText(lower);
  if (!project && Array.isArray(projects)) {
    project = projects.find((p) => {
      const name = (p.name || "").toLowerCase();
      const id = (p.id || "").toLowerCase();
      const subtitle = (p.subtitle || "").toLowerCase();
      return (name && lower.includes(name)) || (id && lower.includes(id)) || (subtitle && lower.includes(subtitle));
    });
  }
  if (project) {
    const docPreference = detectDocPreferenceFromPrompt(lower);
    if (docPreference.length) {
      return {
        stopModel: true,
        reason: "project_doc_confirm",
        data: { project, docPreference },
      };
    }
    return { stopModel: false, type: "project", data: project };
  }

  // 3) dynamic categories from about.json
  const matchedCategory = matchAboutCategory();
  if (matchedCategory) {
    const fields = Array.isArray(matchedCategory.fields) ? matchedCategory.fields : [];
    const data = pickAboutFields(fields);
    data.cvAvailable = true;
    if (matchedCategory.includeProjectsSummary) {
      data.projectsSummary = projectsSummary(5);
    }
    const subtype =
      matchedCategory.subtype || matchedCategory.id || matchedCategory.slug || matchedCategory.label || "custom";
    return { stopModel: false, type: "about", subtype, data };
  }

  // 4) owner/about requests
  const ownerKeywords = [
    "proprietario",
    "a chi appartiene",
    "chi ha creato",
    "chi ha fatto",
    "chi è giuseppe",
    "chi è giuseppe rubino",
    "dimmi qualcosa su giuseppe",
    "chi è il proprietario",
    "autore",
  ];
  if (containsAny(lower, ownerKeywords) || lower.includes("giuseppe")) {
    // If the user is asking about projects, return the list (avoid inferring details from titles).
    if (/\bprogett/.test(lower)) {
      return { stopModel: false, type: "projects_list", data: projects };
    }

    const wantsName = /\b(nome|come si chiama|chi è)\b/.test(lower);
    const wantsBio = /\b(bio|biografia|parlami|informazioni su|cosa sai)\b/.test(lower);
    const wantsSchool = /\b(scuola|liceo|istituto)\b/.test(lower);
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
    data.cvAvailable = true;
    return { stopModel: false, type: "about", subtype: "owner", data };
  }

  // 5) tech/stack (anche senza dire "progetto") -> lista progetti
  const techKeywords = [
    "tecnologie",
    "tecnologia",
    "stack",
    "linguaggi",
    "linguaggio",
    "framework",
    "librerie",
    "libreria",
    "tools",
    "tool",
  ];
  if (containsAny(lower, techKeywords)) {
    return { stopModel: false, type: "projects_list", data: projects };
  }

  // 6) generic projects
  if (lower.includes("progetto") || lower.includes("progetti")) {
    return { stopModel: false, type: "projects_list", data: projects };
  }

  // 7) vague help -> unknown
  if (/\b(cosa puoi fare|mi aiuti|come funziona|come posso|voglio sapere|sto cercando|puoi aiutarmi)\b/.test(lower)) {
    return { stopModel: false, type: "unknown" };
  }

  return { stopModel: false, type: "unknown" };
}
