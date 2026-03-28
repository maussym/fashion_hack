import { formatPrice, getStyleLabel } from "../lib/fashion";
import { CatalogItem } from "../lib/types";
import { ProductActions } from "./ProductActions";

const SIZES = ["XS", "S", "M", "L", "XL"];

interface Props {
  product: CatalogItem;
  details: string[];
  selectedSize: string | null;
  setSelectedSize: (s: string) => void;
  addedToCart: boolean;
  handleAddToCart: () => void;
  isSaved: boolean;
  onToggleWishlist: () => void;
  detailsOpen: boolean;
  setDetailsOpen: (v: boolean) => void;
  canTryOn: boolean;
}

export function ProductInfo({
  product,
  details,
  selectedSize,
  setSelectedSize,
  addedToCart,
  handleAddToCart,
  isSaved,
  onToggleWishlist,
  detailsOpen,
  setDetailsOpen,
  canTryOn,
}: Props) {
  return (
    <div className="pt-6 sm:pt-0 lg:pl-8 xl:pl-12 lg:py-8">
      <p className="uppercase tracking-widest text-xs text-stone-400 font-sans">{product.brand}</p>
      <h1
        className="font-serif text-stone-900 mt-1 sm:mt-2 text-xl sm:text-2xl lg:text-3xl"
        style={{ fontWeight: 400, lineHeight: 1.2 }}
      >
        {product.name_ru}
      </h1>
      <p className="font-sans text-base sm:text-lg text-stone-500 mt-2 sm:mt-4">
        {formatPrice(product.price)}
      </p>
      <div className="mt-3 sm:mt-4 flex flex-wrap gap-2">
        {product.styles.map((itemStyle) => (
          <span
            key={itemStyle}
            className="text-[10px] sm:text-xs uppercase tracking-widest px-2.5 py-1 border border-stone-200 text-stone-500"
          >
            {getStyleLabel(itemStyle)}
          </span>
        ))}
      </div>
      <p className="font-sans text-xs sm:text-sm text-stone-500 leading-relaxed mt-5 sm:mt-8 max-w-sm">
        Товар из каталога AVISHU. {canTryOn ? "Доступен" : "Пока не доступен"} для виртуальной примерки.
      </p>
      <div className="mt-6 sm:mt-10">
        <p className="uppercase tracking-widest text-xs text-stone-900 font-sans mb-3 sm:mb-4">Размер</p>
        <div className="flex gap-1">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`flex-1 py-2.5 sm:py-3 text-xs uppercase tracking-widest border transition-colors ${
                selectedSize === size
                  ? "bg-stone-900 text-white border-stone-900"
                  : "border-stone-200 text-stone-500 active:bg-stone-50"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>
      <ProductActions
        product={product}
        details={details}
        addedToCart={addedToCart}
        handleAddToCart={handleAddToCart}
        isSaved={isSaved}
        onToggleWishlist={onToggleWishlist}
        detailsOpen={detailsOpen}
        setDetailsOpen={setDetailsOpen}
        canTryOn={canTryOn}
        selectedSize={selectedSize}
      />
    </div>
  );
}
