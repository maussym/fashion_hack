import { ChevronDown, ChevronRight } from "lucide-react";
import { Link } from "react-router";
import { resolveAssetUrl } from "../lib/api";
import { formatPrice, getCategoryLabel } from "../lib/fashion";
import { CatalogItem } from "../lib/types";

type TryOnMode = "single" | "outfit";

interface Props {
  mode: TryOnMode;
  catalog: CatalogItem[];
  selectedProduct: string | null;
  selectedOutfitItems: string[];
  categoryFilter: "all" | "top" | "bottom";
  productPanelOpen: boolean;
  onSelectProduct: (id: string) => void;
  onToggleOutfitItem: (id: string) => void;
  onCategoryFilter: (v: "all" | "top" | "bottom") => void;
  onTogglePanel: () => void;
}

export default function TryOnProductSelector({
  mode, catalog, selectedProduct, selectedOutfitItems, categoryFilter,
  productPanelOpen, onSelectProduct, onToggleOutfitItem, onCategoryFilter, onTogglePanel,
}: Props) {
  const filtered = categoryFilter === "all" ? catalog : catalog.filter((i) => i.category === categoryFilter);
  const selData = catalog.find((p) => p.id === selectedProduct);
  const btnCls = (active: boolean) => `text-xs uppercase tracking-widest px-3 py-1.5 border transition-colors flex-1 sm:flex-none ${active ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-400 active:bg-stone-50"}`;
  const filterCls = (active: boolean) => `text-xs uppercase tracking-widest px-3 sm:px-4 py-2 border transition-colors ${active ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-500 hover:border-stone-900 active:bg-stone-50"}`;

  return (
    <div>
      <button onClick={onTogglePanel} className="lg:hidden w-full flex items-center justify-between p-4 border border-stone-200 mb-4">
        <div className="flex items-center gap-3">
          {selData && <div className="w-8 h-10 overflow-hidden shrink-0 bg-stone-100"><img src={resolveAssetUrl(selData.image_url)} alt="" className="w-full h-full object-cover" /></div>}
          <p className="text-xs uppercase tracking-widest text-stone-400 font-sans">{mode === "outfit" ? `Выбрано: ${selectedOutfitItems.length}` : selData?.name_ru ?? "Выберите товар"}</p>
        </div>
        <ChevronDown size={16} className={`text-stone-400 transition-transform ${productPanelOpen ? "rotate-180" : ""}`} />
      </button>
      <div className={`${productPanelOpen ? "block" : "hidden"} lg:block`}>
        <p className="uppercase tracking-widest text-xs text-stone-400 font-sans mb-3 sm:mb-4 hidden lg:block">{mode === "outfit" ? "Выберите вещи" : "Выберите товар"}</p>
        <div className="flex gap-1 mb-3 sm:mb-4">
          {([ ["all", "Все"], ["top", "Верх"], ["bottom", "Низ"] ] as const).map(([val, label]) => (
            <button key={val} onClick={() => onCategoryFilter(val)} className={btnCls(categoryFilter === val)}>{label}</button>
          ))}
        </div>
        <div className="space-y-0.5 max-h-[40vh] sm:max-h-[60vh] overflow-y-auto">
          {filtered.map((product) => {
            const isSel = mode === "single" ? selectedProduct === product.id : selectedOutfitItems.includes(product.id);
            return (
              <button key={product.id} onClick={() => mode === "single" ? onSelectProduct(product.id) : onToggleOutfitItem(product.id)}
                className={`w-full flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 border transition-colors text-left ${isSel ? "border-stone-900 bg-stone-50" : "border-transparent active:bg-stone-50"}`}>
                <div className="w-10 h-13 sm:w-12 sm:h-16 overflow-hidden shrink-0 bg-stone-100">
                  <img src={resolveAssetUrl(product.image_url)} alt={product.name_ru} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="uppercase tracking-widest text-[10px] sm:text-xs text-stone-400 font-sans">{product.brand}</p>
                  <p className="font-serif text-xs sm:text-sm text-stone-900 truncate mt-0.5">{product.name_ru}</p>
                  <p className="font-sans text-[10px] sm:text-xs text-stone-400 mt-0.5">{getCategoryLabel(product.category)} · {formatPrice(product.price)}</p>
                </div>
                {isSel && <div className="w-2 h-2 bg-stone-900 rounded-full shrink-0" />}
              </button>
            );
          })}
        </div>
        {mode === "outfit" && selectedOutfitItems.length > 0 && (
          <div className="mt-3 p-3 bg-stone-50 border border-stone-200">
            <p className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-400 font-sans mb-2">Выбрано</p>
            <div className="flex flex-wrap gap-1">
              {selectedOutfitItems.map((id) => {
                const item = catalog.find((p) => p.id === id);
                if (!item) return null;
                return (
                  <span key={id} className="text-[10px] sm:text-xs bg-stone-900 text-white px-2 py-1 flex items-center gap-1">
                    {getCategoryLabel(item.category)}
                    <button onClick={() => onToggleOutfitItem(id)} className="text-white/60 hover:text-white ml-0.5">×</button>
                  </span>
                );
              })}
            </div>
          </div>
        )}
        {mode === "single" && selData && (
          <div className="mt-4 sm:mt-6 border-t border-stone-100 pt-4 sm:pt-6">
            <h2 className="font-serif text-stone-900 text-lg sm:text-xl">{selData.name_ru}</h2>
            <p className="font-sans text-xs sm:text-sm text-stone-500 mt-1 sm:mt-2">{selData.brand} · {formatPrice(selData.price)}</p>
            <Link to={`/product/${selData.id}`} className="text-xs uppercase tracking-widest text-stone-400 hover:text-stone-900 flex items-center gap-2 mt-3 sm:mt-4">
              Карточка товара <ChevronRight size={11} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
