import { Link } from "react-router";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { resolveAssetUrl } from "../lib/api";
import { formatPrice, getCategoryLabel } from "../lib/fashion";
import { CatalogItem } from "../lib/types";
import { useWishlist } from "../lib/store";

interface ProductCardProps {
  product: CatalogItem;
  className?: string;
}

export function ProductCard({ product, className = "" }: ProductCardProps) {
  const [wishlist, toggleWishlist] = useWishlist();
  const isSaved = wishlist.includes(product.id);

  return (
    <div className={`group relative ${className}`}>
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-[3/4] w-full overflow-hidden bg-stone-50">
          <img
            src={resolveAssetUrl(product.image_url)}
            alt={product.name_ru}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
          />
        </div>
        <div className="mt-2 sm:mt-3 px-0.5">
          <p className="uppercase tracking-widest text-[10px] sm:text-xs text-stone-400 font-sans">
            {product.brand}
          </p>
          <p className="font-serif text-sm sm:text-base text-stone-900 mt-0.5 leading-tight line-clamp-2">
            {product.name_ru}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
            <p className="font-sans text-xs sm:text-sm text-stone-500">{formatPrice(product.price)}</p>
            <div
              className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border border-stone-200 shrink-0"
              style={{ backgroundColor: product.color.hex }}
              title={product.color.name_ru}
            />
          </div>
          <p className="font-sans text-[10px] sm:text-xs text-stone-400 mt-0.5">
            {getCategoryLabel(product.category)}
          </p>
        </div>
      </Link>

      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          const added = toggleWishlist(product.id);
          toast(added ? "Добавлено в избранное" : "Удалено из избранного");
        }}
        className={`absolute top-2 right-2 w-8 h-8 flex items-center justify-center transition-all active:scale-90 ${
          isSaved
            ? "bg-stone-900 text-white opacity-100"
            : "bg-white/80 text-stone-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
        }`}
        title={isSaved ? "Убрать" : "В избранное"}
      >
        <Heart size={14} fill={isSaved ? "currentColor" : "none"} />
      </button>
    </div>
  );
}
