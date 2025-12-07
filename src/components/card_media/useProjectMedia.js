import { useMemo } from 'react';
import fallbackProjects from '../../assets/data/projects.json';

function buildAssetMap() {
  const modules = import.meta.glob('../../assets/media/projects/**/*', {
    eager: true,
    import: 'default',
    query: '?url',
  });
  const map = {};
  for (const key in modules) {
    const url = modules[key];
    const parts = key.split('/');
    const filename = parts[parts.length - 1];
    map[filename] = url;
    const idx = parts.indexOf('projects');
    if (idx >= 0) {
      const subpath = parts.slice(idx + 1).join('/');
      map[subpath] = url;
    }
  }
  return map;
}

function resolveAsset(raw, assetMap) {
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw) || raw.startsWith('/')) return raw;
  if (assetMap[raw]) return assetMap[raw];
  const clean = raw.replace(/^\.?\//, '');
  if (assetMap[clean]) return assetMap[clean];
  if (assetMap[`projects/${clean}`]) return assetMap[`projects/${clean}`];
  return raw;
}

export function preloadAsset(url) {
  try {
    if (!url) return;
    if (/\.(png|jpe?g|gif|svg|webp)(\?|$)/i.test(url)) {
      const img = new Image();
      img.src = url;
    }
  } catch {
    // ignore
  }
}

export default function useProjectMedia(project) {
  const assetMap = useMemo(() => buildAssetMap(), []);
  const effectiveProject = project ?? (Array.isArray(fallbackProjects) && fallbackProjects.length > 0 ? fallbackProjects[0] : null);

  const media = useMemo(() => {
    const p = effectiveProject;
    if (!p) return [];
    const out = [];

    const makeMediaObject = (item, forcedType, idx) => {
      if (!item) return null;
      if (typeof item === 'string') {
        const inferredType = forcedType ?? (item.match(/\.(mp4|webm|ogg)(\?|$)/i) ? 'video' : 'image');
        return {
          id: `${(p && p.id) || 'proj'}-m-${inferredType}-${idx}`,
          type: inferredType,
          src: resolveAsset(item, assetMap),
          thumb: null,
          alt: '',
        };
      }

      const rawSrc = item.src ?? item.url ?? item.href ?? null;
      if (!rawSrc) return null;

      const type = item.type ?? forcedType ?? (rawSrc.match(/\.(mp4|webm|ogg)(\?|$)/i) ? 'video' : 'image');
      const previewRaw =
        item.preview ??
        item.previewUrl ??
        item.previewSrc ??
        null;

      const captionText =
        item.caption ??
        item.description ??
        item.title ??
        item.alt ??
        "";

      return {
        id: item.id ?? `${(p && p.id) || 'proj'}-m-${type}-${idx}`,
        type,
        src: resolveAsset(rawSrc, assetMap),
        thumb: resolveAsset(item.thumb ?? item.poster ?? null, assetMap),
        preview: resolveAsset(previewRaw, assetMap),
        caption: captionText,
        alt: item.alt ?? item.title ?? '',
        poster: resolveAsset(item.poster ?? null, assetMap),
        priority: item.priority ?? false,
      };
    };

    if (Array.isArray(p.media) && p.media.length > 0) {
      p.media.forEach((itm, idx) => {
        const normalized = makeMediaObject(itm, undefined, idx);
        if (normalized && (normalized.type === 'image' || normalized.type === 'video')) {
          out.push(normalized);
        }
      });
      return out;
    }

    if (Array.isArray(p.images)) {
      p.images.forEach((itm, idx) => {
        const normalized = makeMediaObject(itm, 'image', idx);
        if (normalized) out.push(normalized);
      });
    }

    if (Array.isArray(p.videos)) {
      p.videos.forEach((itm, idx) => {
        const normalized = makeMediaObject(itm, 'video', idx + out.length);
        if (normalized) out.push(normalized);
      });
    }

    return out;
  }, [effectiveProject, assetMap]);

  return { effectiveProject, media };
}
