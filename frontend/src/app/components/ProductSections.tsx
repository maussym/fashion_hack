import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import { OutfitCard } from "./OutfitCard";
import { ProductCard } from "./ProductCard";
import { CatalogItem, Outfit } from "../lib/types";

interface Props {
  product: CatalogItem;
  complementaryItems: CatalogItem[];
  completeLook: CatalogItem[];
  looksWithCurrentItem: Outfit[];
  relatedProducts: CatalogItem[];
}

export function ProductSections({ product, complementaryItems, completeLook, looksWithCurrentItem, relatedProducts }: Props) {
  return (
    <>
      {complementaryItems.length > 0 && (
        <section className="border-t border-stone-100 py-10 sm:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="mb-8 sm:mb-12">
              <p className="uppercase tracking-widest text-xs text-stone-400 font-sans mb-1">Рекомендации</p>
              <h2 className="font-serif text-stone-900 text-xl sm:text-2xl lg:text-3xl" style={{ fontWeight: 400 }}>С этим носят</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5 sm:gap-1">
              {complementaryItems.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-stone-100 py-10 sm:py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="mb-8 sm:mb-12">
            <p className="uppercase tracking-widest text-xs text-stone-400 font-sans mb-1">AI Styling</p>
            <h2 className="font-serif text-stone-900 text-xl sm:text-2xl lg:text-3xl" style={{ fontWeight: 400 }}>Собери образ</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5 sm:gap-1">
            <div className="relative">
              <ProductCard product={product} />
              <div className="absolute top-2 left-2 bg-stone-900 text-white text-[10px] sm:text-xs uppercase tracking-widest px-2 py-0.5 sm:py-1">Эта вещь</div>
            </div>
            {completeLook.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="mt-8 sm:mt-12 flex justify-center">
            <Link to="/stylist" className="border border-stone-900 text-stone-900 text-xs uppercase tracking-widest px-6 sm:px-8 py-3.5 sm:py-4 flex items-center gap-2 active:bg-stone-50">
              AI-стилист <ChevronRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {looksWithCurrentItem.length > 0 && (
        <section className="py-10 sm:py-20 bg-stone-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="mb-8 sm:mb-12">
              <p className="uppercase tracking-widest text-xs text-stone-400 font-sans mb-1">Образы</p>
              <h2 className="font-serif text-stone-900 text-xl sm:text-2xl" style={{ fontWeight: 400 }}>Как это носить</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16">
              {looksWithCurrentItem.map((look, i) => (
                <OutfitCard key={`${look.items.map(({ item }) => item.id).join("-")}-${i}`} outfit={look} title={`Образ с ${product.name_ru}`} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-10 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="mb-8 sm:mb-12">
            <p className="uppercase tracking-widest text-xs text-stone-400 font-sans mb-1">Похожие</p>
            <h2 className="font-serif text-stone-900 text-xl sm:text-2xl" style={{ fontWeight: 400 }}>Вам может понравиться</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0.5 sm:gap-1">
            {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>
    </>
  );
}
