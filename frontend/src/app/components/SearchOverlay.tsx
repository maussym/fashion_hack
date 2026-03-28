import { RefObject } from "react";
import { Link } from "react-router";
import { Search, X } from "lucide-react";
import { resolveAssetUrl } from "../lib/api";
import { formatPrice, getCategoryLabel } from "../lib/fashion";
import { CatalogItem } from "../lib/types";

interface SearchOverlayProps {
  searchRef: RefObject<HTMLInputElement | null>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: CatalogItem[];
  searching: boolean;
  onClose: () => void;
}

export function SearchOverlay({ searchRef, searchQuery, setSearchQuery, searchResults, searching, onClose }: SearchOverlayProps) {
  return (
    <div className="fixed inset-0 z-[60] bg-white/98 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="max-w-2xl mx-auto px-4 sm:px-8 pt-6 sm:pt-20">
        <div className="flex justify-end mb-4 sm:hidden">
          <button onClick={onClose} className="text-stone-400 p-2">
            <X size={24} />
          </button>
        </div>
        <div className="flex items-center gap-3 sm:gap-4 border-b border-stone-900 pb-3 sm:pb-4">
          <Search size={18} className="text-stone-400 shrink-0" />
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Найти товар, бренд, цвет…"
            className="flex-1 font-serif text-xl sm:text-2xl text-stone-900 bg-transparent outline-none placeholder:text-stone-300"
          />
          <button onClick={onClose} className="text-stone-400 hover:text-stone-900 transition-colors hidden sm:block">
            <X size={18} />
          </button>
        </div>
        <div className="mt-6 sm:mt-8 max-h-[70vh] overflow-y-auto">
          {searching ? (
            <p className="font-serif italic text-stone-400 text-center py-12">Ищем…</p>
          ) : searchResults.length > 0 ? (
            <div className="space-y-0.5">
              {searchResults.map((item) => (
                <Link key={item.id} to={`/product/${item.id}`} className="flex items-center gap-3 sm:gap-4 p-3 hover:bg-stone-50 transition-colors active:bg-stone-100">
                  <div className="w-11 h-14 sm:w-12 sm:h-16 overflow-hidden shrink-0 bg-stone-100">
                    <img src={resolveAssetUrl(item.image_url)} alt={item.name_ru} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="uppercase tracking-widest text-[10px] sm:text-xs text-stone-400 font-sans">{item.brand}</p>
                    <p className="font-serif text-sm text-stone-900 truncate">{item.name_ru}</p>
                    <p className="font-sans text-xs text-stone-400 mt-0.5">{getCategoryLabel(item.category)} · {formatPrice(item.price)}</p>
                  </div>
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full shrink-0 border border-stone-200" style={{ backgroundColor: item.color.hex }} />
                </Link>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <p className="font-serif italic text-stone-400 text-center py-12">Ничего не найдено по запросу «{searchQuery}»</p>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <p className="font-serif italic text-stone-300 text-base sm:text-lg">Начните вводить название товара, бренд или цвет</p>
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                {["casual", "office", "белый", "кроссовки", "платье"].map((hint) => (
                  <button key={hint} onClick={() => setSearchQuery(hint)} className="text-xs uppercase tracking-widest px-4 py-2 border border-stone-200 text-stone-400 hover:border-stone-900 hover:text-stone-900 transition-colors active:bg-stone-50">
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
