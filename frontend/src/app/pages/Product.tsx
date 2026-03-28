import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ProductBreadcrumb } from "../components/ProductBreadcrumb";
import { ProductGallery } from "../components/ProductGallery";
import { ProductInfo } from "../components/ProductInfo";
import { ProductSections } from "../components/ProductSections";
import { fetchCatalog, fetchCatalogItem, generateOutfits } from "../lib/api";
import { buildProductDetails, uniqueItems } from "../lib/fashion";
import { CatalogItem, Outfit } from "../lib/types";
import { addToCart, useWishlist } from "../lib/store";
import { toast } from "sonner";

export default function Product() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<CatalogItem | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [relatedLooks, setRelatedLooks] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [wishlist, toggleWishlist] = useWishlist();

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function load() {
      setLoading(true); setError(null); setActiveImage(0); setAddedToCart(false);
      try {
        const [item, allItems] = await Promise.all([fetchCatalogItem(id), fetchCatalog()]);
        if (cancelled) return;
        setProduct(item); setCatalog(allItems);
        const looks = await generateOutfits({ style: item.styles[0] ?? "casual", gender: item.gender, season: item.season[0] });
        if (!cancelled) setRelatedLooks(looks);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Не удалось загрузить товар");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  if (loading) return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-6 h-6 border border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto" />
        <p className="font-serif text-stone-400 text-base sm:text-lg mt-4">Загружаем…</p>
      </div>
    </main>
  );

  if (error || !product) return (
    <main className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center">
        <p className="font-serif text-stone-700 text-lg sm:text-xl">{error ?? "Товар не найден"}</p>
        <Link to="/" className="inline-block mt-6 text-xs uppercase tracking-widest text-stone-400 hover:text-stone-900">На главную</Link>
      </div>
    </main>
  );

  const isSaved = wishlist.includes(product.id);
  const canTryOn = product.category === "top" || product.category === "bottom";
  const complementaryItems = uniqueItems(catalog.filter(i => i.id !== product.id && i.category !== product.category && i.styles.some(s => product.styles.includes(s)))).slice(0, 4);
  const relatedProducts = uniqueItems(catalog.filter(i => i.id !== product.id && i.category === product.category && i.styles.some(s => product.styles.includes(s)))).slice(0, 4);
  const looksWithCurrentItem = relatedLooks.filter(look => look.items.some(({ item }) => item.id === product.id));
  const primaryLook = looksWithCurrentItem[0] ?? relatedLooks[0] ?? null;
  const completeLook = primaryLook ? primaryLook.items.map(({ item }) => item).filter(i => i.id !== product.id).slice(0, 3) : relatedProducts.slice(0, 3);
  const handleAddToCart = () => { if (!selectedSize) return; addToCart(product.id, selectedSize); setAddedToCart(true); toast.success("Добавлено в корзину"); setTimeout(() => setAddedToCart(false), 2000); };
  const handleWishlist = () => { const added = toggleWishlist(product.id); toast(added ? "Добавлено в избранное" : "Удалено из избранного"); };
  const infoProps = { product, details: buildProductDetails(product), selectedSize, setSelectedSize, addedToCart, handleAddToCart, isSaved, onToggleWishlist: handleWishlist, detailsOpen, setDetailsOpen, canTryOn };
  return (
    <main className="bg-white min-h-screen">
      <ProductBreadcrumb product={product} />
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-10 sm:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-0 sm:gap-1">
          <ProductGallery product={product} images={[product.image_url]} activeImage={activeImage} setActiveImage={setActiveImage} />
          <ProductInfo {...infoProps} />
        </div>
      </div>
      <ProductSections product={product} complementaryItems={complementaryItems} completeLook={completeLook} looksWithCurrentItem={looksWithCurrentItem} relatedProducts={relatedProducts} />
    </main>
  );
}
