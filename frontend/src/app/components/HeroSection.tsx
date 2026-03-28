import { Link } from "react-router";
import { Sparkles, Shirt } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] sm:min-h-screen w-full bg-white flex flex-col items-center justify-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full">
        <div className="max-w-2xl mx-auto text-center">
          <p className="uppercase tracking-[0.35em] text-[10px] sm:text-xs text-stone-400 font-sans mb-6 sm:mb-10">
            Clothing Manufacturer · 2015
          </p>

          <h1
            className="font-serif text-stone-900 leading-[1.1] tracking-tight"
            style={{ fontSize: "clamp(2.4rem, 7vw, 6rem)", fontWeight: 300 }}
          >
            AI-стилист
            <span className="block font-serif italic text-stone-400" style={{ fontWeight: 300 }}>
              и виртуальная
            </span>
            примерка
          </h1>

          <p className="font-sans text-sm sm:text-base text-stone-400 leading-relaxed mt-6 sm:mt-10 max-w-md mx-auto">
            Собирайте готовые комплекты, примеряйте на себе
            и покупайте уверенно.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 sm:mt-12">
            <Link
              to="/stylist"
              className="w-full sm:w-auto bg-stone-900 text-white text-xs uppercase tracking-[0.2em] px-8 sm:px-10 py-4 hover:bg-stone-800 transition-colors text-center flex items-center justify-center gap-2.5"
            >
              <Sparkles size={13} />
              AI-стилист
            </Link>
            <Link
              to="/tryon"
              className="w-full sm:w-auto border border-stone-300 text-stone-600 text-xs uppercase tracking-[0.2em] px-8 sm:px-10 py-4 hover:border-stone-900 hover:text-stone-900 transition-colors text-center flex items-center justify-center gap-2.5"
            >
              <Shirt size={13} />
              Примерить
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
