import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ShoppingBag } from "lucide-react";
import { fetchCatalog } from "../lib/api";
import { formatPrice } from "../lib/fashion";
import { CatalogItem } from "../lib/types";
import { useCart } from "../lib/store";
import { useT } from "../lib/i18n";
import CartItem from "../components/CartItem";
import CartSummary from "../components/CartSummary";

export default function Cart() {
  const t = useT();
  const cartEntries = useCart();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCatalog()
      .then(setCatalog)
      .finally(() => setLoading(false));
  }, []);

  const getProduct = (id: string) => catalog.find((p) => p.id === id);

  const totalPrice = cartEntries.reduce((sum, entry) => {
    const product = getProduct(entry.productId);
    return sum + (product ? product.price * entry.qty : 0);
  }, 0);

  const totalItems = cartEntries.reduce((sum, e) => sum + e.qty, 0);

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
          {t("cart.title")}
        </p>
        <h1 className="font-serif text-stone-900 text-2xl sm:text-4xl" style={{ fontWeight: 400 }}>
          {t("cart.subtitle")}
        </h1>

        {cartEntries.length === 0 ? (
          <div className="py-20 sm:py-32 text-center">
            <ShoppingBag size={28} className="text-stone-200 mx-auto mb-5" />
            <p className="font-serif italic text-stone-400 text-base sm:text-lg">
              {t("cart.empty")}
            </p>
            <p className="font-sans text-xs sm:text-sm text-stone-300 mt-2">
              {t("cart.add_items")}
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
              {totalItems} {totalItems === 1 ? "товар" : totalItems < 5 ? "товара" : "товаров"} · {formatPrice(totalPrice)}
            </p>

            <div className="mt-8 sm:mt-12 space-y-0">
              {cartEntries.map((entry) => {
                const product = getProduct(entry.productId);
                if (!product) return null;
                return (
                  <CartItem
                    key={`${entry.productId}-${entry.size}`}
                    entry={entry}
                    product={product}
                  />
                );
              })}
            </div>

            <CartSummary totalPrice={totalPrice} />
          </>
        )}
      </div>
    </main>
  );
}
