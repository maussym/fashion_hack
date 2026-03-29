import { Lang, useI18n } from "../lib/i18n";

const LANGS: { value: Lang; label: string }[] = [
  { value: "ru", label: "RU" },
  { value: "kz", label: "KZ" },
  { value: "en", label: "EN" },
];

export function LangSwitcher() {
  const { lang, setLang } = useI18n();
  return (
    <div className="flex border border-stone-200 text-[10px] uppercase tracking-widest">
      {LANGS.map((l) => (
        <button
          key={l.value}
          onClick={() => setLang(l.value)}
          className={`px-2 py-1 transition-colors ${lang === l.value ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-900"}`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
