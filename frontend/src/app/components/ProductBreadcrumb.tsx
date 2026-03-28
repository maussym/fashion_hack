import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import { getCategoryLabel } from "../lib/fashion";
import { CatalogItem } from "../lib/types";

interface Props {
  product: CatalogItem;
}

export function ProductBreadcrumb({ product }: Props) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 sm:py-8">
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none">
        <Link
          to="/"
          className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-400 flex items-center gap-1 shrink-0"
        >
          <ArrowLeft size={10} />
          Home
        </Link>
        <span className="text-stone-200 text-xs">/</span>
        <span className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-400 shrink-0">
          {getCategoryLabel(product.category)}
        </span>
        <span className="text-stone-200 text-xs">/</span>
        <span className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-900 truncate">
          {product.brand}
        </span>
      </div>
    </div>
  );
}
