import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { toast } from "sonner";
import { Lang, useI18n } from "../lib/i18n";

const LANGS: { value: Lang; label: string; flag: string }[] = [
  { value: "ru", label: "Русский", flag: "RU" },
  { value: "kz", label: "Қазақша", flag: "KZ" },
  { value: "en", label: "English", flag: "EN" },
];

export function LangSwitcher() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = LANGS.find((l) => l.value === lang)!;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-stone-400 hover:text-stone-900 transition-colors p-1"
      >
        <Globe size={16} />
        <span className="text-[10px] uppercase tracking-widest">{current.flag}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 bg-white border border-stone-200 shadow-lg min-w-[140px] z-50">
          {LANGS.map((l) => (
            <button
              key={l.value}
              onClick={() => {
                setLang(l.value);
                setOpen(false);
                const msgs: Record<Lang, string> = { ru: "Язык: Русский", kz: "Тіл: Қазақша", en: "Language: English" };
                toast(msgs[l.value]);
              }}
              className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between transition-colors ${lang === l.value ? "bg-stone-50 text-stone-900" : "text-stone-500 hover:bg-stone-50"}`}
            >
              <span>{l.label}</span>
              <span className="text-[10px] text-stone-300 uppercase">{l.flag}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
