import { useRef } from "react";
import { ImagePlus, X } from "lucide-react";

// Photos of the actual room, added to the PDF (2 per page). They're never uploaded: they
// stay in this browser with the rest of the draft until Start over clears it.
export function RoomPhotos({ images, onAddImages, onRemoveImage }) {
  const inputRef = useRef(null);

  const handleFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length) onAddImages(files);
    // Reset so selecting the exact same file(s) again later still fires onChange.
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {images.map((img, i) => (
          <div key={img.id} className="rc-fade-in relative aspect-[4/3] overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.05]">
            <img src={img.previewUrl} alt={`Room photo ${i + 1}`} className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onRemoveImage(img.id)}
              aria-label={`Remove photo ${i + 1}`}
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/60 text-white backdrop-blur-sm transition-[background-color,transform] duration-100 hover:bg-slate-900/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white active:scale-90"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-white/60 transition-[background-color,border-color,transform] duration-150 hover:border-blue-400/60 hover:bg-blue-500/10 hover:text-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 active:scale-[0.97] ${
            images.length ? "" : "col-span-3 aspect-auto py-6"
          }`}
        >
          <ImagePlus className="h-5 w-5" />
          <span className="text-xs font-semibold">{images.length ? "Add more" : "Add room photos"}</span>
          {!images.length && <span className="text-xs text-white/45">Take new ones or choose from your library</span>}
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFilesSelected} className="hidden" />
      <p className="text-xs leading-relaxed text-white/45">
        Added to the PDF report, two per page. Photos stay on this device — they're never uploaded or stored, and
        closing the page discards them.
      </p>
    </div>
  );
}
