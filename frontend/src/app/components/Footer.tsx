import { Link } from "react-router";

const FOOTER_COLUMNS = [
  {
    title: "Каталог",
    links: [
      { label: "Товары", to: "/" },
      { label: "AI-образы", to: "/stylist" },
    ],
  },
  {
    title: "AI",
    links: [
      { label: "Стилист", to: "/stylist" },
      { label: "Примерка", to: "/tryon" },
    ],
  },
  {
    title: "Аккаунт",
    links: [
      { label: "Избранное", to: "/wishlist" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-stone-200 py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
          <div>
            <img src="/logo-avishu.png" alt="AVISHU" className="h-5 w-auto mb-4 sm:mb-6" />
            <p className="font-sans text-sm text-stone-400 leading-relaxed">
              Бренд комфортной женской одежды для жизни, дома и отдыха. С 2015 года.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="uppercase tracking-widest text-xs text-stone-900 font-sans mb-4 sm:mb-6">
                {col.title}
              </p>
              <div className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="text-sm text-stone-400 font-sans hover:text-stone-900 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-stone-100 mt-8 sm:mt-12 pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-stone-400 uppercase tracking-widest font-sans">
            AVISHU Clothing Manufacturer'2015
          </p>
          <p className="font-serif italic text-stone-300 text-sm">
            Powered by AI Styling Engine
          </p>
        </div>
      </div>
    </footer>
  );
}
