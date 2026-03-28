import { StylistResponse, StylistItem } from "../lib/types";
import { STYLIST_API_URL } from "../lib/api";

interface Props {
  result: StylistResponse;
}

function resolveItemImage(item: StylistItem): string {
  if (!item.image_url) return "";
  if (item.image_url.startsWith("http")) return item.image_url;
  return `${STYLIST_API_URL}${item.image_url}`;
}

const CAT_LABELS: Record<string, string> = {
  top: "Верх", bottom: "Низ", shoes: "Обувь", accessory: "Аксессуары",
};

function CategorySection({ category, items }: { category: string; items: StylistItem[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="uppercase tracking-widest text-xs text-stone-400 font-sans mb-3">
        {CAT_LABELS[category] ?? category}
      </p>
      <div className="grid grid-cols-3 gap-1">
        {items.map((item, i) => (
          <div key={`${item.image}-${i}`} className="group">
            <div className="aspect-[3/4] bg-stone-100 overflow-hidden relative">
              <img
                src={resolveItemImage(item)}
                alt={item.name}
                className="w-full h-full object-cover"
                onError={(e) => { const el = e.target as HTMLImageElement; el.style.display = "none"; el.parentElement!.classList.add("bg-stone-200"); }}
              />
              <div className="absolute top-1.5 right-1.5 bg-white/90 px-1.5 py-0.5 text-[10px] font-sans text-stone-500">
                {Math.round(item.score * 100)}%
              </div>
            </div>
            <p className="text-xs text-stone-600 mt-1.5 truncate">{item.name}</p>
            <p className="text-[10px] text-stone-400">{item.brand} · {item.color}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StylistAIResults({ result }: Props) {
  return (
    <div className="space-y-8">
      <div className="border border-stone-200 p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-stone-900 text-lg sm:text-xl">{result.outfit_name}</h2>
          <span className="text-xs bg-stone-100 px-2.5 py-1 font-sans">{result.fashion_score}%</span>
        </div>
        {result.occasion && <p className="text-xs text-stone-400 uppercase tracking-widest">{result.occasion}</p>}
        {result.explanation && <p className="text-sm text-stone-600 leading-relaxed">{result.explanation}</p>}
        {result.why_it_works && (
          <p className="text-xs text-stone-500 italic border-l-2 border-stone-200 pl-3">{result.why_it_works}</p>
        )}
        {result.style_tips.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {result.style_tips.map((tip, i) => (
              <span key={i} className="text-[11px] text-stone-500 bg-stone-50 px-2.5 py-1 border border-stone-100">{tip}</span>
            ))}
          </div>
        )}
      </div>
      {Object.entries(result.items).map(([cat, items]) => (
        <CategorySection key={cat} category={cat} items={items} />
      ))}
    </div>
  );
}
