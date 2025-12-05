// CardMedia.jsx
import React, { useState, useMemo } from "react";
import projects from '../media/data/projects.json';

/*
  CardMedia: supporta project.media | project.images | project.videos
  - ogni elemento può essere stringa o oggetto { src|url, type?, thumb?, poster?, alt?, id? }
  - usa il JSON importato come fallback se non è passata la prop `project`
  - tutti gli hook sono chiamati prima di qualunque return condizionale
*/

export default function CardMedia({ project }) {
  const [lightbox, setLightbox] = useState(null);

  // scegli il progetto effettivo: prop > primo progetto dal JSON importato > null
  const effectiveProject = project ?? (Array.isArray(projects) && projects.length > 0 ? projects[0] : null);

  // build asset map (filename -> url) using available bundler helpers (Vite / Webpack).
// build asset map (filename -> url) con glob Vite
  const assetMap = useMemo(() => {
    // importa TUTTE le immagini dentro projects
    // nested, worka sia con * che con **/*
    const modules = import.meta.glob('../media/img/projects/**/*', {
      eager: true,
      import: 'default',
      query: '?url'
    });


    const map = {};

    for (const k in modules) {
      const url = modules[k];

      // k è tipo: '../media/img/projects/a_home.png'
      const parts = k.split('/');
      const filename = parts[parts.length - 1];

      // mappa filename → url
      map[filename] = url;

      // opzionale: se vuoi supportare subfolder nel JSON
      // esempio "proj-2/bm_info.png"
      const projectsIndex = parts.indexOf('projects');
      if (projectsIndex >= 0) {
        const subpath = parts.slice(projectsIndex + 1).join('/');
        map[subpath] = url;
      }
    }

    return map;
  }, []);


  // helper: preload an image (or video poster) when user hovers/focus
  const preload = (url) => {
    try {
      if (!url) return;
      // only preload images here (video preload would require link rel=preload)
      if (/\.(png|jpe?g|gif|svg|webp)(\?|$)/i.test(url)) {
        const img = new Image();
        img.src = url;
      }
    } catch (e) { /* ignore */ }
  };

  // Resolve path helper:
  // - if absolute url (http/https) or starts with '/' => keep as-is
  // - if starts with '.' (./ ../) => resolve relative to this file (import.meta.url)
  // - else if found in assetMap => use mapped url
  // - else assume filename and map to probable locations via new URL
  const resolveAsset = (raw) => {
    if (!raw) return null;

    if (/^https?:\/\//i.test(raw) || raw.startsWith('/')) {
      return raw; // remoto o da public
    }

    // prova prima filename diretto
    if (assetMap[raw]) return assetMap[raw];

    // prova a normalizzare rimuovendo ./ o /
    const clean = raw.replace(/^\.?\//, '');
    if (assetMap[clean]) return assetMap[clean];

    // opzionale: supporto per subfolder in JSON
    if (assetMap[`projects/${clean}`]) return assetMap[`projects/${clean}`];

    // ultimo fallback: restituisce raw come URL assoluto
    // utile se l'immagine è in /public
    return raw;
  };


  // make media objects normalized
  const media = useMemo(() => {
    const p = effectiveProject;
    const out = [];

    const makeMediaObject = (item, forcedType, idx) => {
      if (!item) return null;

      if (typeof item === "string") {
        const inferredType = forcedType ?? (item.match(/\.(mp4|webm|ogg)(\?|$)/i) ? "video" : "image");
        return {
          id: `${(p && p.id) || "proj"}-m-${inferredType}-${idx}`,
          type: inferredType,
          src: resolveAsset(item),
          thumb: null,
          alt: ""
        };
      }

      const rawSrc = item.src ?? item.url ?? item.href ?? null;
      if (!rawSrc) return null;

      const type = item.type ?? forcedType ?? (rawSrc.match(/\.(mp4|webm|ogg)(\?|$)/i) ? "video" : "image");

      const resolvedSrc = resolveAsset(rawSrc);
      const resolvedThumb = resolveAsset(item.thumb ?? item.poster ?? item.preview ?? null);
      const resolvedPoster = resolveAsset(item.poster ?? null);

      return {
        id: item.id ?? `${(p && p.id) || "proj"}-m-${type}-${idx}`,
        type,
        src: resolvedSrc,
        thumb: resolvedThumb,
        alt: item.alt ?? item.title ?? "",
        poster: resolvedPoster,
        // allow optional priority flag in JSON (e.g. { src: "...", priority: true })
        priority: item.priority ?? false
      };
    };

    if (p && Array.isArray(p.media) && p.media.length > 0) {
      p.media.forEach((it, i) => {
        const m = makeMediaObject(it, undefined, i);
        if (m && (m.type === "image" || m.type === "video")) out.push(m);
      });
    } else if (p) {
      if (Array.isArray(p.images)) {
        p.images.forEach((it, i) => {
          const m = makeMediaObject(it, "image", i);
          if (m) out.push(m);
        });
      }
      if (Array.isArray(p.videos)) {
        p.videos.forEach((it, i) => {
          const m = makeMediaObject(it, "video", i + out.length);
          if (m) out.push(m);
        });
      }
    }

    return out;
  }, [effectiveProject, assetMap]); // assetMap in deps so it recomputes if built differently

  if (!effectiveProject) return <aside className=""></aside>;

  // small helper per-render to set classes after load
  const onImgLoad = (e) => {
    const el = e.currentTarget;
    el.classList.remove("opacity-0");
    el.classList.add("opacity-100");
  };

  return (
    <>
      <aside className="p-4 rounded-2xl bg-linear-to-b from-white to-gray-100 shadow flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Media</h3>
            <div className="text-xs text-gray-500">Foto e video del progetto</div>
          </div>
          <div className="text-xs text-gray-400">{media.length} elementi</div>
        </div>

        {media.length === 0 ? (
          <div className=""></div>
        ) : (
          <div className="grid grid-raw-3 sm:grid-raw-4 gap-3 mt-4">
            {media.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  // preload full-res before opening lightbox when possible
                  if (m.type === "image" && m.src) preload(m.src);
                  setLightbox(m);
                }}
                className="relative overflow-hidden rounded-xl focus:outline-none"
                title={m.alt ?? ""}
                aria-label={m.alt ?? (m.type === "video" ? "Video" : "Immagine")}
                onMouseEnter={() => {
                  // prefetch full-res on hover/focus
                  if (m.type === "image" && m.src) preload(m.src);
                }}
                onFocus={() => {
                  if (m.type === "image" && m.src) preload(m.src);
                }}
              >
                {m.type === "image" ? (
                  <img
                    src={m.thumb ?? m.src}
                    alt={m.alt ?? ""}
                    className="object-cover w-full h-24 sm:h-28 rounded-xl transition-opacity duration-300 opacity-0"
                    loading={m.priority ? "eager" : "lazy"}
                    decoding="async"
                    fetchpriority={m.priority ? "high" : undefined}
                    onLoad={onImgLoad}
                  />
                ) : (
                  <div className="w-full h-24 sm:h-28 rounded-xl flex items-center justify-center bg-gray-100 relative">
                    {m.thumb ? (
                      <img
                        src={m.thumb}
                        alt={m.alt ?? "video"}
                        className="object-cover w-full h-full"
                        loading={m.priority ? "eager" : "lazy"}
                        decoding="async"
                        fetchpriority={m.priority ? "high" : undefined}
                        onLoad={onImgLoad}
                      />
                    ) : (
                      <div className="text-xs text-gray-500">Video</div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <svg className="w-8 h-8 text-white/90 drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </aside>

      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setLightbox(null)}>
          <div className="max-w-[95%] max-h-[95%] rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            {lightbox.type === "image" ? (
              <img src={lightbox.src} alt={lightbox.alt ?? ""} className="max-w-full max-h-[80vh] object-contain" />
            ) : (
              <video controls className="max-w-full max-h-[80vh]" poster={lightbox.poster ?? lightbox.thumb ?? undefined}>
                <source src={lightbox.src} />
                Your browser does not support the video tag.
              </video>
            )}
            <div className="p-2 bg-white/90 flex items-center justify-between">
              <div className="text-sm text-gray-700">{lightbox.alt ?? ""}</div>
              <button onClick={() => setLightbox(null)} className="text-sm px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200">Chiudi</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
