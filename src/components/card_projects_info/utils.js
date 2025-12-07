export const GITHUB_COLORS = {
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  TypeScript: "#2b7489",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Java: "#b07219",
  C: "#555555",
  "C++": "#f34b7d",
  Go: "#00ADD8",
  PHP: "#4F5D95",
  Ruby: "#701516",
  default: "#d1d5db",
};

export function colorWithAlpha(hex, alphaHex = "20") {
  if (!hex) return `#d1d5db${alphaHex}`;
  const h = hex.replace("#", "");
  if (h.length === 6) return `#${h}${alphaHex}`;
  return hex;
}

export function toApiRepoUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "api.github.com" && parsed.pathname.startsWith("/repos/")) {
      return url.replace(/\/+$/, "");
    }
    if (parsed.hostname === "github.com") {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        const owner = parts[0];
        const repo = parts[1].replace(/\.git$/, "");
        return `https://api.github.com/repos/${owner}/${repo}`;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

export function formatIsoDate(iso) {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("it-IT", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}
