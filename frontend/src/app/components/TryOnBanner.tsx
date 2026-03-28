import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

export function TryOnBanner() {
  return (
    <section className="relative h-[60vh] sm:h-[70vh] overflow-hidden">
      <img
        src="https://avishu.kz/wp-content/uploads/2025/12/SKIN-ice_1-866x1299.webp"
        alt="Editorial banner"
        className="absolute inset-0 w-full h-full object-cover object-top"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-stone-900/70 via-stone-900/40 to-transparent" />
      <div className="absolute inset-0 flex items-end sm:items-center pb-12 sm:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full">
          <div className="max-w-lg">
            <p className="uppercase tracking-widest text-xs text-white/60 font-sans mb-3 sm:mb-4">
              Virtual Try-On
            </p>
            <h2
              className="font-serif text-white leading-tight"
              style={{ fontSize: "clamp(1.5rem, 4vw, 3.5rem)", fontWeight: 400 }}
            >
              Посмотрите,
              <br />
              как вещь сидит
              <br />
              именно на вас.
            </h2>
            <p className="font-sans text-xs sm:text-sm text-white/70 leading-relaxed mt-4 sm:mt-5 max-w-xs">
              Загрузите фото и получите 2D-примерку прямо в браузере.
            </p>
            <Link
              to="/tryon"
              className="inline-flex items-center gap-2 mt-6 sm:mt-8 border border-white text-white text-xs uppercase tracking-widest px-6 sm:px-8 py-3.5 hover:bg-white hover:text-stone-900 transition-colors"
            >
              Запустить примерку
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
