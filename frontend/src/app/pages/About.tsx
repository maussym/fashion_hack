import { Link } from "react-router";
import { useT } from "../lib/i18n";
import { Sparkles } from "lucide-react";

export default function About() {
  const t = useT();
  return (
    <main className="min-h-screen bg-white">
      <section className="max-w-3xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
        <p className="uppercase tracking-widest text-xs text-stone-400 font-sans mb-2">AVISHU</p>
        <h1 className="font-serif text-stone-900 text-3xl sm:text-5xl mb-8" style={{ fontWeight: 300 }}>
          {t("about.title")}
        </h1>
        <p className="font-sans text-stone-500 leading-relaxed mb-6">
          AVISHU — {t("about.p1")}
        </p>
        <div className="border-l-2 border-stone-200 pl-6 my-8">
          <p className="font-serif italic text-stone-400 text-lg leading-relaxed">{t("about.quote")}</p>
        </div>
        <div className="space-y-5 font-sans text-sm text-stone-500 leading-relaxed">
          <p>{t("about.p2")}</p>
          <p>{t("about.p3")}</p>
          <p>{t("about.p4")}</p>
          <p>{t("about.p5")}</p>
          <p>{t("about.p6")}</p>
        </div>
        <div className="mt-12">
          <Link to="/" className="bg-stone-900 text-white text-xs uppercase tracking-widest px-8 py-4 hover:bg-stone-700 transition-colors inline-flex items-center gap-2">
            <Sparkles size={13} /> {t("about.cta")}
          </Link>
        </div>
      </section>
    </main>
  );
}
