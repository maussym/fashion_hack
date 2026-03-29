import { Link } from "react-router";
import { Minus, Plus, Trash2 } from "lucide-react";
import { resolveAssetUrl } from "../lib/api";
import { formatPrice } from "../lib/fashion";
import { CatalogItem } from "../lib/types";
import { CartEntry, removeFromCart, updateCartQty } from "../lib/store";
import { useT } from "../lib/i18n";
import { toast } from "sonner";

interface CartItemProps {
  entry: CartEntry;
  product: CatalogItem;
}

export default function CartItem({ entry, product }: CartItemProps) {
  const t = useT();
  return (
    <div className="flex gap-4 sm:gap-6 py-6 border-b border-stone-100">
      <Link
        to={`/product/${product.id}`}
        className="w-20 h-28 sm:w-24 sm:h-32 shrink-0 overflow-hidden bg-stone-50"
      >
        <img
          src={resolveAssetUrl(product.image_url)}
          alt={product.name_ru}
          className="w-full h-full object-cover"
        />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="uppercase tracking-widest text-[10px] sm:text-xs text-stone-400 font-sans">
              {product.brand}
            </p>
            <Link
              to={`/product/${product.id}`}
              className="font-serif text-sm sm:text-base text-stone-900 mt-0.5 block truncate hover:underline"
            >
              {product.name_ru}
            </Link>
            <p className="font-sans text-xs text-stone-400 mt-1">
              {t("size_label")} {entry.size}
            </p>
          </div>
          <p className="font-sans text-sm sm:text-base text-stone-900 shrink-0">
            {formatPrice(product.price * entry.qty)}
          </p>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center border border-stone-200">
            <button
              onClick={() => updateCartQty(entry.productId, entry.size, entry.qty - 1)}
              className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors"
            >
              <Minus size={13} />
            </button>
            <span className="w-8 text-center text-xs font-sans text-stone-900">
              {entry.qty}
            </span>
            <button
              onClick={() => updateCartQty(entry.productId, entry.size, entry.qty + 1)}
              className="w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-900 transition-colors"
            >
              <Plus size={13} />
            </button>
          </div>

          <button
            onClick={() => {
              removeFromCart(entry.productId, entry.size);
              toast(t("product.removed_cart"));
            }}
            className="text-stone-300 hover:text-stone-900 transition-colors p-1"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
