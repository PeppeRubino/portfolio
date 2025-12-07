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
      <aside className="flex flex-col rounded-2xl border border-white/60 bg-linear-to-b from-white to-slate-100 p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Media</h3>
            <div className="text-xs text-gray-500">Foto e video del progetto</div>
          </div>
          <div className="text-xs text-gray-400">{media.length} elementi</div>
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
