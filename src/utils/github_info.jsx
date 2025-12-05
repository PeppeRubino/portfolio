// src/lib/github.js
// Utility per ottenere languages/tree e inferire moduli.
// Accepts public URLs (languagesUrl, treeUrl) or a githubToken (optional).
// Returns { languageBytes, languages, modules, loading, error }

const EXT_TO_MODULE = {
  ".py": "Python",
  ".ipynb": "Jupyter",
  ".js": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".jsx": "JavaScript",
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".html": "HTML",
  ".htm": "HTML",
  ".css": "CSS",
  ".scss": "CSS",
  ".java": "Java",
  ".c": "C",
  ".cpp": "C++",
  ".cc": "C++",
  ".cs": "C#",
  ".go": "Go",
  ".rs": "Rust",
  ".php": "PHP",
  ".rb": "Ruby",
  ".md": "Markdown",
  ".json": "JSON",
  ".yml": "YAML",
  ".yaml": "YAML",
  ".r": "R",
  ".sh": "Shell",
  ".ps1": "PowerShell",
  ".swift": "Swift",
  ".kt": "Kotlin",
  ".sikuli": "sikuliX",
  ".docx": "docx",
  ".png": "Assets",
  ".jpg": "Assets",
  ".jpeg": "Assets",
  ".svg": "Assets",
};

function safePercentages(langBytes) {
  const total = Object.values(langBytes || {}).reduce((acc, v) => acc + (v || 0), 0);
  if (!total) return {};
  const pcts = {};
  for (const [k, v] of Object.entries(langBytes)) {
    // calcolo fatto digit-by-digit: somma poi divisione
    pcts[k] = Math.round((v * 1000 / total)) / 10; // 1 decimale
  }
  return pcts;
}

async function fetchJson(url, githubToken) {
  const headers = { Accept: "application/vnd.github+json" };
  if (githubToken) headers["Authorization"] = `token ${githubToken}`;
  const res = await fetch(url, { headers });
  if (res.status === 404) return null;
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Fetch error ${res.status} ${res.statusText} - ${text}`);
  }
  return res.json();
}

function inferModulesFromTree(tree = []) {
  const modules = new Set();

  for (const entry of tree) {
    if (!entry || entry.type !== "blob") continue;
    const path = entry.path || "";
    // quick detection by filename:
    // extension:
    const m = path.match(/(\.[^.\/\\]+)$/);
    if (m) {
      const ext = m[1].toLowerCase();
      const mod = EXT_TO_MODULE[ext];
      if (mod) modules.add(mod);
      else {
        // fallback heuristics
        if (ext === ".lock") {
          if (path.includes("package-lock") || path.includes("yarn.lock")) modules.add("JavaScript");
        } else if (ext === ".gradle") modules.add("Java");
      }
    } else {
      // folder / name heuristics
      const lower = path.toLowerCase();
      if (lower.includes("three") && lower.endsWith(".js") === false) modules.add("Three.js");
      if (lower.endsWith("package.json")) modules.add("JavaScript");
    }
  }

  return Array.from(modules).sort();
}

function buildTreeUrlFallback(languagesUrl) {
  // from https://api.github.com/repos/OWNER/REPO/languages -> construct trees/master?recursive=1
  if (!languagesUrl) return null;
  try {
    const base = languagesUrl.replace(/\/languages\/?$/, "");
    return `${base}/git/trees/master?recursive=1`;
  } catch (e) {
    return null;
  }
}

export async function fetchGithubProjectData({ languagesUrl, treeUrl, githubToken } = {}) {
  // returns { languageBytes, languages, modules }
  if (!languagesUrl && !treeUrl) {
    return { languageBytes: {}, languages: {}, modules: [] };
  }

  // ensure we have sane urls
  let langUrl = languagesUrl || null;
  let treeUrlToTry = treeUrl || buildTreeUrlFallback(languagesUrl);

  // fetch languages (bytes)
  let languageBytes = {};
  try {
    if (langUrl) {
      const langJson = await fetchJson(langUrl, githubToken);
      if (langJson) languageBytes = langJson;
    }
  } catch (err) {
    // non fatale: log e prosegui
    console.warn("fetchGithubProjectData: languages error", err);
  }

  // fetch tree (may be big); try primary, then swap master/main if 404
  let treeEntries = [];
  try {
    if (treeUrlToTry) {
      let treeResp = await fetchJson(treeUrlToTry, githubToken);
      if (treeResp === null) {
        // try swapping master <-> main
        if (treeUrlToTry.includes("/master")) {
          const alt = treeUrlToTry.replace("/master", "/main");
          treeResp = await fetchJson(alt, githubToken);
        } else if (treeUrlToTry.includes("/main")) {
          const alt = treeUrlToTry.replace("/main", "/master");
          treeResp = await fetchJson(alt, githubToken);
        }
      }
      if (treeResp && Array.isArray(treeResp.tree)) treeEntries = treeResp.tree;
    }
  } catch (err) {
    console.warn("fetchGithubProjectData: tree error", err);
  }

  const modules = inferModulesFromTree(treeEntries);
  const languages = safePercentages(languageBytes);

  return { languageBytes, languages, modules };
}
