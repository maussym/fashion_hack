import { Link } from "react-router";
import { Plus, Minus, Heart, ShoppingBag, Check } from "lucide-react";
import { CatalogItem } from "../lib/types";

interface Props {
  product: CatalogItem;
  details: string[];
  addedToCart: boolean;
  handleAddToCart: () => void;
  isSaved: boolean;
  onToggleWishlist: () => void;
  detailsOpen: boolean;
  setDetailsOpen: (v: boolean) => void;
  canTryOn: boolean;
  selectedSize: string | null;
}

export function ProductActions({
  product,
  details,
  addedToCart,
  handleAddToCart,
  isSaved,
  onToggleWishlist,
  detailsOpen,
  setDetailsOpen,
  canTryOn,
  selectedSize,
}: Props) {
  return (
    <>
      <div className="mt-5 sm:mt-6 flex flex-col gap-2.5 sm:gap-3">
        <button
          onClick={handleAddToCart}
          className={`w-full py-3.5 sm:py-4 text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            addedToCart
              ? "bg-green-800 text-white"
              : selectedSize
              ? "bg-stone-900 text-white hover:bg-stone-700 active:bg-stone-800"
              : "bg-stone-200 text-stone-400 cursor-not-allowed"
          }`}
          disabled={!selectedSize || addedToCart}
        >
          {addedToCart ? (
            <><Check size={14} /> Добавлено</>
          ) : (
            <><ShoppingBag size={14} /> {selectedSize ? "В корзину" : "Выберите размер"}</>
          )}
        </button>
        <button
          onClick={onToggleWishlist}
          className={`w-full py-3.5 sm:py-4 text-xs uppercase tracking-widest border transition-colors flex items-center justify-center gap-2 ${
            isSaved
              ? "bg-stone-900 text-white border-stone-900"
              : "border-stone-900 text-stone-900 active:bg-stone-50"
          }`}
        >
          <Heart size={14} fill={isSaved ? "currentColor" : "none"} />
          {isSaved ? "В избранном" : "В избранное"}
        </button>
        {canTryOn && (
          <Link
            to={`/tryon?item=${product.id}`}
            className="w-full py-3.5 sm:py-4 text-xs uppercase tracking-widest border border-stone-200 text-stone-400 hover:border-stone-900 hover:text-stone-900 transition-colors text-center block"
          >
            Примерить виртуально →
          </Link>
        )}
      </div>
      <div className="mt-6 sm:mt-10 border-t border-stone-100">
        <button
          onClick={() => setDetailsOpen(!detailsOpen)}
          className="w-full py-4 sm:py-5 flex items-center justify-between text-left border-b border-stone-100"
        >
          <p className="uppercase tracking-widest text-xs text-stone-900 font-sans">Детали</p>
          {detailsOpen ? <Minus size={13} className="text-stone-400" /> : <Plus size={13} className="text-stone-400" />}
        </button>
        {detailsOpen && (
          <div className="py-4 sm:py-5 border-b border-stone-100">
            <ul className="space-y-2">
              {details.map((detail, i) => (
                <li key={i} className="font-sans text-xs sm:text-sm text-stone-500 flex items-start gap-2 sm:gap-3">
                  <span className="text-stone-300 mt-0.5">—</span>
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
