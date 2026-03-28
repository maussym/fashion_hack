import { Link } from "react-router";
import { Bookmark } from "lucide-react";
import { resolveAssetUrl } from "../lib/api";
import { buildOutfitDescription, formatPrice, getRoleLabel } from "../lib/fashion";
import { Outfit } from "../lib/types";
import { useOutfitFavorites } from "../lib/store";

interface OutfitCardProps {
  outfit: Outfit;
  title?: string;
  description?: string;
  onTryOn?: (itemIds: string[]) => void;
}

function outfitKey(outfit: Outfit): string {
  return outfit.items.map(({ item }) => item.id).sort().join(":");
}

export function OutfitCard({ outfit, title = "AI-образ", description, onTryOn }: OutfitCardProps) {
  const scorePercent = Math.round(outfit.score * 100);
  const [favorites, toggleFavorite] = useOutfitFavorites();
  const key = outfitKey(outfit);
  const isFav = favorites.includes(key);

  return (
    <div className="group">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-0.5 sm:gap-1 relative">
        {outfit.items.map(({ item }) => (
          <Link key={item.id} to={`/product/${item.id}`} className="aspect-[3/4] overflow-hidden bg-stone-50 block">
            <img src={resolveAssetUrl(item.image_url)} alt={item.name_ru} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700" />
          </Link>
        ))}
        <button onClick={(e) => { e.preventDefault(); toggleFavorite(key); }}
          className={`absolute top-2 right-2 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-all ${isFav ? "bg-stone-900 text-white" : "bg-white/80 text-stone-400 sm:opacity-0 sm:group-hover:opacity-100"}`}>
          <Bookmark size={14} fill={isFav ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="mt-3 sm:mt-4">
        <div className="flex items-start justify-between gap-3">
          <p className="uppercase tracking-widest text-[10px] sm:text-xs text-stone-400 font-sans">{title}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="h-1.5 w-12 sm:w-16 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-stone-900 rounded-full transition-all duration-500" style={{ width: `${scorePercent}%` }} />
            </div>
            <span className="text-[10px] sm:text-xs text-stone-400 font-sans tabular-nums">{scorePercent}%</span>
          </div>
        </div>
        <p className="font-serif italic text-xs sm:text-sm text-stone-600 mt-1.5 sm:mt-2 leading-relaxed">{description ?? buildOutfitDescription(outfit)}</p>
        <div className="mt-3 sm:mt-4 flex flex-wrap gap-3 sm:gap-4">
          {outfit.items.map(({ item, role }) => (
            <div key={item.id} className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-stone-200 shrink-0" style={{ backgroundColor: item.color.hex }} />
              <div>
                <p className="uppercase tracking-widest text-[9px] sm:text-[10px] text-stone-400 font-sans">{getRoleLabel(role)}</p>
                <p className="font-serif text-[10px] sm:text-xs text-stone-700">{item.name_ru}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-2.5 sm:mt-3 pt-2.5 sm:pt-3 border-t border-stone-50 flex items-center justify-between">
          <p className="font-sans text-xs sm:text-sm text-stone-900 font-medium">{formatPrice(outfit.total_price)}</p>
          <div className="flex items-center gap-3">
            <p className="text-[10px] sm:text-xs text-stone-400 font-sans">{outfit.items.length} {outfit.items.length < 5 ? "вещи" : "вещей"}</p>
            {onTryOn && (
              <button onClick={() => { const t = outfit.items.filter(({ item }) => item.category === "top" || item.category === "bottom").map(({ item }) => item.id); if (t.length > 0) onTryOn(t); }}
                className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
                Примерить →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
