import { CatalogItem } from "../lib/types";

interface Props {
  processing: boolean;
  result: string | null;
  message: string | null;
  mode: "single" | "outfit";
  selectedProductData: CatalogItem | undefined;
  selectedOutfitItems: string[];
}

export default function TryOnResultArea({
  processing, result, message, mode, selectedProductData, selectedOutfitItems,
}: Props) {
  return (
    <div>
      <p className="uppercase tracking-widest text-[10px] sm:text-xs text-stone-400 font-sans mb-2 sm:mb-3">Результат AI</p>
      <div className="aspect-[3/4] border border-dashed border-stone-200 flex flex-col items-center justify-center relative overflow-hidden bg-stone-50">
        {processing ? (
          <div className="flex flex-col items-center gap-3 p-4">
            <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
            <p className="uppercase tracking-widest text-[10px] sm:text-xs text-stone-400 font-sans text-center">Примеряем…</p>
          </div>
        ) : result ? (
          <>
            <img src={result} alt="Результат" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm p-3 sm:p-4">
              <p className="font-serif text-stone-900 text-xs sm:text-sm truncate">
                {mode === "outfit" ? `${selectedOutfitItems.length} вещей` : selectedProductData?.name_ru}
              </p>
              {message && <p className="font-sans text-[10px] sm:text-xs text-stone-500 mt-1 truncate">{message}</p>}
            </div>
          </>
        ) : (
          <div className="text-center p-4">
            <p className="uppercase tracking-widest text-[10px] sm:text-xs text-stone-300 font-sans">Результат</p>
            <p className="font-serif italic text-stone-300 text-xs sm:text-sm mt-2">появится здесь</p>
          </div>
        )}
      </div>
    </div>
  );
}
