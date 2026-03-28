import { useRef } from "react";
import { Upload, RefreshCw } from "lucide-react";

interface Props {
  uploadedImage: string | null;
  dragOver: boolean;
  onFileSelect: (file: File) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (v: boolean) => void;
  onReset: () => void;
}

export default function PhotoUploadArea({
  uploadedImage, dragOver, onFileSelect, onDrop, onDragOver, onReset,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <p className="uppercase tracking-widest text-[10px] sm:text-xs text-stone-400 font-sans mb-2 sm:mb-3">Ваше фото</p>
      <div
        className={`aspect-[3/4] border border-dashed flex flex-col items-center justify-center cursor-pointer relative overflow-hidden transition-colors ${dragOver ? "border-stone-900 bg-stone-50" : "border-stone-300 bg-white"}`}
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); onDragOver(true); }}
        onDragLeave={() => onDragOver(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploadedImage ? (
          <img src={uploadedImage} alt="Загруженное фото" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-3 p-4 sm:p-8 text-center">
            <div className="w-10 h-10 border border-stone-300 flex items-center justify-center rounded-full">
              <Upload size={16} className="text-stone-400" />
            </div>
            <div>
              <p className="uppercase tracking-widest text-[10px] sm:text-xs text-stone-400 font-sans">Загрузите фото</p>
              <p className="font-sans text-[10px] sm:text-xs text-stone-300 mt-1">в полный рост</p>
            </div>
          </div>
        )}
        {uploadedImage && (
          <button onClick={(e) => { e.stopPropagation(); onReset(); }} className="absolute top-2 right-2 bg-white/90 border border-stone-200 text-stone-500 p-1.5">
            <RefreshCw size={12} />
          </button>
        )}
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFileSelect(f); }} />
    </div>
  );
}
