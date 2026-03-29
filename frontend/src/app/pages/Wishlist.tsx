import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Heart } from "lucide-react";
import { fetchCatalog } from "../lib/api";
import { formatPrice } from "../lib/fashion";
import { CatalogItem } from "../lib/types";
import { useWishlist } from "../lib/store";
import { useT } from "../lib/i18n";
import { ProductCard } from "../components/ProductCard";

export default function Wishlist() {
  const t = useT();
  const [wishlist] = useWishlist();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCatalog()
      .then(setCatalog)
      .finally(() => setLoading(false));
  }, []);

  const wishlistItems = catalog.filter((item) => wishlist.includes(item.id));
  const totalPrice = wishlistItems.reduce((sum, item) => sum + item.price, 0);

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border border-stone-300 border-t-stone-900 rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-20">
        <p className="uppercase tracking-widest text-xs text-stone-400 font-sans mb-1">
          {t("wishlist.title")}
        </p>
        <h1 className="font-serif text-stone-900 text-2xl sm:text-4xl" style={{ fontWeight: 400 }}>
          {t("wishlist.subtitle")}
        </h1>

        {wishlistItems.length === 0 ? (
          <div className="py-20 sm:py-32 text-center">
            <Heart size={28} className="text-stone-200 mx-auto mb-5" />
            <p className="font-serif italic text-stone-400 text-base sm:text-lg">
              {t("wishlist.empty")}
            </p>
            <p className="font-sans text-xs sm:text-sm text-stone-300 mt-2">
              {t("wishlist.hint")}
            </p>
            <Link
              to="/"
              className="inline-block mt-8 text-xs uppercase tracking-widest text-stone-400 border border-stone-200 px-6 py-3 active:bg-stone-50"
            >
              {t("cart.to_catalog")}
            </Link>
          </div>
        ) : (
          <>
            <p className="font-sans text-xs sm:text-sm text-stone-400 mt-3 sm:mt-4">
              {wishlistItems.length} {wishlistItems.length === 1 ? "товар" : wishlistItems.length < 5 ? "товара" : "товаров"} · {formatPrice(totalPrice)}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5 sm:gap-4 mt-8 sm:mt-12">
              {wishlistItems.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
