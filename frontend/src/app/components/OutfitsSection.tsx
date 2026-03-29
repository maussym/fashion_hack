import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { OutfitCard } from "./OutfitCard";
import { getScenarioLabel } from "../lib/fashion";
import { Outfit } from "../lib/types";
import { useT } from "../lib/i18n";

const HOME_SCENARIOS = ["work", "rest", "travel", "event"];

interface OutfitsSectionProps {
  activeScenario: string;
  onScenarioChange: (scenario: string) => void;
  looks: Outfit[];
  loading: boolean;
  error: string | null;
}

export function OutfitsSection({ activeScenario, onScenarioChange, looks, loading, error }: OutfitsSectionProps) {
  const t = useT();
  return (
    <section className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
        <div>
          <p className="uppercase tracking-widest text-xs text-stone-400 font-sans mb-1">{t("outfits.title")}</p>
          <h2 className="font-serif text-stone-900 text-2xl sm:text-3xl" style={{ fontWeight: 400 }}>{t("outfits.subtitle")}</h2>
        </div>
        <Link to="/stylist" className="text-xs uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors flex items-center gap-1">
          {t("outfits.open")} <ArrowRight size={12} />
        </Link>
      </div>

      <div className="flex gap-2 sm:gap-3 mb-10 sm:mb-16 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-none">
        {HOME_SCENARIOS.map((scenario) => (
          <button key={scenario} onClick={() => onScenarioChange(scenario)}
            className={`text-xs uppercase tracking-widest px-4 sm:px-5 py-2.5 border transition-colors whitespace-nowrap shrink-0 ${
              activeScenario === scenario ? "bg-stone-900 text-white border-stone-900" : "border-stone-300 text-stone-500 hover:border-stone-900 hover:text-stone-900 active:bg-stone-50"
            }`}>
            {getScenarioLabel(scenario)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 sm:py-20 text-center">
          <div className="w-6 h-6 border border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="font-serif italic text-stone-400 text-base sm:text-lg">{t("outfits.loading")}</p>
        </div>
      ) : error ? (
        <div className="py-16 sm:py-20 text-center">
          <p className="font-serif italic text-stone-500 text-base sm:text-lg">{error}</p>
          <p className="text-xs uppercase tracking-widest text-stone-400 mt-3 font-sans">{t("outfits.error")}</p>
        </div>
      ) : looks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 sm:gap-16">
          {looks.map((look, index) => (
            <OutfitCard key={`${activeScenario}-${index}`} outfit={look} title={`${getScenarioLabel(activeScenario)} · образ ${index + 1}`} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="font-serif italic text-stone-400 text-base">{t("outfits.empty")}</p>
        </div>
      )}
    </section>
  );
}
