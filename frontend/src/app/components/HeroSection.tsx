import { Link } from "react-router";
import { Sparkles, Shirt } from "lucide-react";
import { useT } from "../lib/i18n";

export function HeroSection() {
  const t = useT();
  return (
    <section className="relative min-h-[70svh] sm:min-h-screen w-full bg-white flex flex-col items-center justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full">
        <div className="max-w-2xl mx-auto text-center">
          <p className="uppercase tracking-[0.35em] text-[10px] sm:text-xs text-stone-400 font-sans mb-6 sm:mb-10">
            {t("hero.subtitle")}
          </p>

          <h1
            className="font-serif text-stone-900 leading-[1.1] tracking-tight"
            style={{ fontSize: "clamp(2.4rem, 7vw, 6rem)", fontWeight: 300 }}
          >
            {t("hero.title1")}
            <span className="block font-serif italic text-stone-400" style={{ fontWeight: 300 }}>
              {t("hero.title2")}
            </span>
            {t("hero.title3")}
          </h1>

          <p className="font-sans text-sm sm:text-base text-stone-400 leading-relaxed mt-6 sm:mt-10 max-w-md mx-auto">
            {t("hero.desc")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 sm:mt-12">
            <Link
              to="/stylist"
              className="w-full sm:w-auto bg-stone-900 text-white text-xs uppercase tracking-[0.2em] px-8 sm:px-10 py-4 hover:bg-stone-800 transition-colors text-center flex items-center justify-center gap-2.5"
            >
              <Sparkles size={13} />
              {t("hero.stylist_btn")}
            </Link>
            <Link
              to="/tryon"
              className="w-full sm:w-auto border border-stone-300 text-stone-600 text-xs uppercase tracking-[0.2em] px-8 sm:px-10 py-4 hover:border-stone-900 hover:text-stone-900 transition-colors text-center flex items-center justify-center gap-2.5"
            >
              <Shirt size={13} />
              {t("hero.tryon_btn")}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
