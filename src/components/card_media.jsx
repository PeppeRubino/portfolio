import React, { useState } from "react";
import useProjectMedia, { preloadAsset } from "./card_media/useProjectMedia.js";
import MediaGrid from "./card_media/MediaGrid.jsx";
import MediaLightbox from "./card_media/MediaLightbox.jsx";

export default function CardMedia({ project }) {
  const [lightbox, setLightbox] = useState(null);
  const { effectiveProject, media } = useProjectMedia(project);

  if (!effectiveProject) return null;

  return (
    <>
      <aside className="flex flex-col rounded-[30px] border border-white/60 bg-linear-to-b from-white/95 via-slate-50/90 to-slate-100/85 p-6 shadow-[0_25px_70px_rgba(15,23,42,0.18)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Media</h2>
            <p className="text-sm text-slate-500 mt-1">
              Anteprime silenziose in loop e disponibile la versione completa al clic.
            </p>
          </div>
          <div className="text-xs text-slate-400">{media.length} elementi</div>
        </div>

        <MediaGrid
          media={media}
          onSelect={(item) => setLightbox(item)}
          onPreload={preloadAsset}
        />
      </aside>

      <MediaLightbox item={lightbox} onClose={() => setLightbox(null)} />
    </>
  );
}
