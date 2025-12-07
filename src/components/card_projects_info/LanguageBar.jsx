import React from "react";
import { GITHUB_COLORS, colorWithAlpha } from "./utils.js";

export default function LanguageBar({ languages = {} }) {
  const entries = Object.entries(languages || {});
  if (entries.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-400">
        Nessun dato disponibile.
      </div>
    );
  }

  const numeric = entries.map(([lang, value]) => [lang, Number(value) || 0]);
  const total = numeric.reduce((sum, [, value]) => sum + value, 0) || 1;
  const percents = numeric.map(([lang, value]) => {
    const pct = Math.round((value * 1000) / total) / 10;
    return [lang, pct];
  });
  const normalized = percents.map(([lang, pct]) => [lang, pct <= 0 ? 0 : pct]);
  const sumNormalized = normalized.reduce((sum, [, pct]) => sum + pct, 0) || 1;
  const segments = normalized.map(([lang, pct]) => [lang, (pct / sumNormalized) * 100]);

  return (
    <>
      <div className="mb-3 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
        {segments.map(([lang, pct]) => {
          const color = GITHUB_COLORS[lang] || GITHUB_COLORS.default;
          const width = pct > 0 && pct < 0.5 ? 0.5 : pct;
          return (
            <div
              key={lang}
              title={`${lang} ${pct.toFixed(1)}%`}
              className="h-full"
              style={{ width: `${width}%`, backgroundColor: color }}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        {segments.map(([lang, pct]) => {
          const color = GITHUB_COLORS[lang] || GITHUB_COLORS.default;
          return (
            <div
              key={lang}
              className="flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium text-gray-900"
              style={{ backgroundColor: colorWithAlpha(color, "30") }}
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: color }}
              />
              {lang} • {pct.toFixed(1)}%
            </div>
          );
        })}
      </div>
    </>
  );
}
