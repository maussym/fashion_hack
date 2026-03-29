import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { fetchCatalog, runTryOnAI } from "../lib/api";
import { isTryOnCompatible } from "../lib/fashion";
import TryOnCanvas from "../components/TryOnCanvas";
import TryOnProductSelector from "../components/TryOnProductSelector";
import { useT } from "../lib/i18n";

type TryOnMode = "single" | "outfit";

export default function TryOn() {
  const t = useT();
  const [searchParams] = useSearchParams();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(searchParams.get("item"));
  const [selectedOutfitItems, setSelectedOutfitItems] = useState<string[]>([]);
  const [mode, setMode] = useState<TryOnMode>("single");
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<"all" | "top" | "bottom">("all");
  const [productPanelOpen, setProductPanelOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCatalog().then((items) => {
      if (cancelled) return;
      const tryable = items.filter(isTryOnCompatible);
      setCatalog(tryable);
      if (!selectedProduct && tryable.length > 0) setSelectedProduct(tryable[0].id);
    }).catch((err) => {
      if (!cancelled) setError(err instanceof Error ? err.message : t("tryon.catalog_error"));
    });
    return () => { cancelled = true; };
  }, []);

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => { setUploadedImage(e.target?.result as string); setResult(null); setMessage(null); };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0]; if (file) handleFileSelect(file);
  };

  const handleTryOn = async () => {
    if (!uploadedImage) return;
    setProcessing(true); setError(null); setMessage(null);
    try {
      if (mode === "outfit" && selectedOutfitItems.length > 0) {
        const objectUrl = await runTryOnAI(uploadedImage, selectedOutfitItems[0], selectedOutfitItems);
        setResult(objectUrl); setMessage(null);
      } else if (selectedProduct) {
        const objectUrl = await runTryOnAI(uploadedImage, selectedProduct);
        setResult(objectUrl); setMessage(null);
      } else return;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("tryon.error"));
    } finally { setProcessing(false); }
  };

  const reset = () => { setUploadedImage(null); setResult(null); setMessage(null); setSelectedOutfitItems([]); };
  const toggleOutfitItem = (id: string) => setSelectedOutfitItems((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const selectedProductData = catalog.find((p) => p.id === selectedProduct);
  const canRun = !!uploadedImage && (mode === "single" ? !!selectedProduct : selectedOutfitItems.length > 0);

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-10 sm:py-20">
        <p className="uppercase tracking-widest text-xs text-stone-400 font-sans mb-1">{t("tryon.subtitle")}</p>
        <h1 className="font-serif text-stone-900 text-2xl sm:text-4xl" style={{ fontWeight: 400 }}>{t("tryon.title")}</h1>
        <p className="font-sans text-xs sm:text-sm text-stone-400 leading-relaxed mt-3 sm:mt-4 max-w-xl">
          {t("tryon.desc")}
        </p>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-8 pb-20 sm:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 sm:gap-16">
          <TryOnCanvas
            mode={mode} onModeChange={setMode} uploadedImage={uploadedImage} result={result}
            processing={processing} message={message} error={error} dragOver={dragOver} canRun={canRun}
            selectedProductData={selectedProductData} selectedOutfitItems={selectedOutfitItems}
            onFileSelect={handleFileSelect} onDrop={handleDrop} onDragOver={setDragOver}
            onTryOn={handleTryOn} onReset={reset}
          />
          <TryOnProductSelector
            mode={mode} catalog={catalog} selectedProduct={selectedProduct}
            selectedOutfitItems={selectedOutfitItems} categoryFilter={categoryFilter}
            productPanelOpen={productPanelOpen} onSelectProduct={setSelectedProduct}
            onToggleOutfitItem={toggleOutfitItem} onCategoryFilter={setCategoryFilter}
            onTogglePanel={() => setProductPanelOpen(!productPanelOpen)}
          />
        </div>
      </div>
    </main>
  );
}
