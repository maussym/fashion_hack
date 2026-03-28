import { useEffect, useState } from "react";
import { ProductCard } from "../components/ProductCard";
import { HeroSection } from "../components/HeroSection";
import { OutfitsSection } from "../components/OutfitsSection";
import { TryOnBanner } from "../components/TryOnBanner";
import { Footer } from "../components/Footer";
import { fetchCatalog, generateOutfits } from "../lib/api";
import { uniqueItems } from "../lib/fashion";
import { CatalogItem, Outfit } from "../lib/types";

export default function Home() {
  const [activeScenario, setActiveScenario] = useState("work");
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [looks, setLooks] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadHome() {
      setLoading(true);
      setError(null);

      try {
        const [catalogData, outfitData] = await Promise.all([
          fetchCatalog(),
          generateOutfits({
            style: "casual",
            scenario: activeScenario,
            gender: "unisex",
            season: "spring",
          }),
        ]);

        if (cancelled) return;
        setProducts(uniqueItems(catalogData).slice(0, 8));
        setLooks(outfitData);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Не удалось загрузить данные");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHome();
    return () => { cancelled = true; };
  }, [activeScenario]);

  return (
    <main>
      <HeroSection />

      <OutfitsSection
        activeScenario={activeScenario}
        onScenarioChange={setActiveScenario}
        looks={looks}
        loading={loading}
        error={error}
      />

      <section className="border-y border-stone-200 py-5 sm:py-6 overflow-hidden">
        <div className="flex gap-8 sm:gap-12 items-center whitespace-nowrap animate-marquee">
          {Array(8).fill(null).map((_, i) => (
            <span key={i} className="font-serif italic text-stone-200 text-xl sm:text-2xl shrink-0">
              AVISHU · AI Styling · Virtual Try-On
            </span>
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-32 max-w-7xl mx-auto px-4 sm:px-8">
        <div className="mb-8 sm:mb-12">
          <p className="uppercase tracking-widest text-xs text-stone-400 font-sans mb-1">Каталог</p>
          <h2 className="font-serif text-stone-900 text-2xl sm:text-3xl" style={{ fontWeight: 400 }}>
            Товары для комплектов
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5 sm:gap-1">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <TryOnBanner />

      <Footer />
    </main>
  );
}
