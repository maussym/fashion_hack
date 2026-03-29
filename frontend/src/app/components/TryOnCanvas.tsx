import { ChevronRight, Layers, Shirt } from "lucide-react";
import { CatalogItem } from "../lib/types";
import { useT } from "../lib/i18n";
import PhotoUploadArea from "./PhotoUploadArea";
import TryOnResultArea from "./TryOnResultArea";

type TryOnMode = "single" | "outfit";

interface Props {
  mode: TryOnMode;
  onModeChange: (m: TryOnMode) => void;
  uploadedImage: string | null;
  result: string | null;
  processing: boolean;
  message: string | null;
  error: string | null;
  dragOver: boolean;
  canRun: boolean;
  selectedProductData: CatalogItem | undefined;
  selectedOutfitItems: string[];
  onFileSelect: (file: File) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragOver: (v: boolean) => void;
  onTryOn: () => void;
  onReset: () => void;
}

export default function TryOnCanvas({
  mode, onModeChange, uploadedImage, result, processing, message, error,
  dragOver, canRun, selectedProductData, selectedOutfitItems,
  onFileSelect, onDrop, onDragOver, onTryOn, onReset,
}: Props) {
  const t = useT();
  return (
    <div>
      <div className="flex gap-2 mb-5 sm:mb-6">
        <button onClick={() => onModeChange("single")} className={`flex items-center gap-2 text-xs uppercase tracking-widest px-4 sm:px-5 py-2.5 border transition-colors ${mode === "single" ? "bg-stone-900 text-white border-stone-900" : "border-stone-300 text-stone-500 active:bg-stone-50"}`}>
          <Shirt size={13} />
          {t("tryon.single")}
        </button>
        <button onClick={() => onModeChange("outfit")} className={`flex items-center gap-2 text-xs uppercase tracking-widest px-4 sm:px-5 py-2.5 border transition-colors ${mode === "outfit" ? "bg-stone-900 text-white border-stone-900" : "border-stone-300 text-stone-500 active:bg-stone-50"}`}>
          <Layers size={13} />
          {t("tryon.outfit")}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-0.5 sm:gap-1">
        <PhotoUploadArea uploadedImage={uploadedImage} dragOver={dragOver} onFileSelect={onFileSelect} onDrop={onDrop} onDragOver={onDragOver} onReset={onReset} />
        <TryOnResultArea processing={processing} result={result} message={message} mode={mode} selectedProductData={selectedProductData} selectedOutfitItems={selectedOutfitItems} />
      </div>

      <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button onClick={onTryOn} disabled={!canRun || processing} className="bg-stone-900 text-white text-xs uppercase tracking-widest px-6 sm:px-8 py-4 hover:bg-stone-700 transition-colors disabled:opacity-30 flex items-center justify-center gap-3 w-full sm:w-auto active:bg-stone-800">
          {processing ? t("tryon.processing") : t("tryon.run")}
          {!processing && <ChevronRight size={13} />}
        </button>
        {result && (
          <button onClick={onReset} className="border border-stone-900 text-stone-900 text-xs uppercase tracking-widest px-6 sm:px-8 py-4 hover:bg-stone-50 transition-colors w-full sm:w-auto">
            {t("tryon.reset")}
          </button>
        )}
      </div>

      {(error || (message && !result)) && (
        <div className="mt-4 sm:mt-6 border border-stone-200 p-3 sm:p-4">
          <p className="font-sans text-xs sm:text-sm text-stone-600">{error ?? message}</p>
        </div>
      )}

      <div className="mt-8 sm:mt-12 border-t border-stone-100 pt-6 sm:pt-8">
        <p className="uppercase tracking-widest text-xs text-stone-400 font-sans mb-4">{t("tryon.tips_title")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {[
            { step: "01", tip: t("tryon.tip1") },
            { step: "02", tip: t("tryon.tip2") },
            { step: "03", tip: t("tryon.tip3") },
          ].map((item) => (
            <div key={item.step} className="flex gap-3 sm:gap-4">
              <span className="font-serif text-stone-200 text-lg shrink-0">{item.step}</span>
              <p className="font-sans text-xs sm:text-sm text-stone-400 leading-relaxed">{item.tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
