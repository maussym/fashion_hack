import { Link } from "react-router";
import { useT } from "../lib/i18n";

export function Footer() {
  const t = useT();
  const columns = [
    {
      title: "AVISHU",
      links: [
        { label: t("nav.about"), to: "/about" },
        { label: t("nav.sizes"), to: "/sizes" },
      ],
    },
    {
      title: t("footer.catalog"),
      links: [
        { label: t("footer.products"), to: "/" },
        { label: t("footer.ai_outfits"), to: "/stylist" },
      ],
    },
    {
      title: "AI",
      links: [
        { label: t("footer.stylist"), to: "/stylist" },
        { label: t("footer.tryon"), to: "/tryon" },
      ],
    },
    {
      title: t("footer.account"),
      links: [
        { label: t("footer.favorites"), to: "/wishlist" },
        { label: t("nav.cart"), to: "/cart" },
      ],
    },
  ];

  return (
    <footer className="border-t border-stone-200 py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 sm:gap-12">
          <div className="col-span-2 md:col-span-1">
            <img src="/logo-avishu.png" alt="AVISHU" className="h-5 w-auto mb-4 sm:mb-6" />
            <p className="font-sans text-sm text-stone-400 leading-relaxed">{t("footer.desc")}</p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="uppercase tracking-widest text-xs text-stone-900 font-sans mb-4 sm:mb-6">{col.title}</p>
              <div className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <Link key={link.to + link.label} to={link.to} className="text-sm text-stone-400 font-sans hover:text-stone-900 transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-stone-100 mt-8 sm:mt-12 pt-6 sm:pt-8">
          <div className="flex flex-wrap gap-4 sm:gap-6 mb-4">
            <Link to="/privacy" className="text-xs text-stone-400 hover:text-stone-900 transition-colors uppercase tracking-widest">Политика конфиденциальности</Link>
            <Link to="/offer" className="text-xs text-stone-400 hover:text-stone-900 transition-colors uppercase tracking-widest">Договор-оферта</Link>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-xs text-stone-400 uppercase tracking-widest font-sans">AVISHU Clothing Manufacturer'2015</p>
            <p className="font-serif italic text-stone-300 text-sm">Powered by AI Styling Engine</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
