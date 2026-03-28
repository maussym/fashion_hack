import { useState } from "react";
import { Send, Sparkles } from "lucide-react";

interface Props {
  onSend: (query: string) => void;
  generating: boolean;
  suggestions: string[];
}

export function StylistChat({ onSend, generating, suggestions }: Props) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || generating) return;
    onSend(query.trim());
    setQuery("");
  };

  return (
    <div className="border-b border-stone-100 p-4 sm:p-8">
      <div className="max-w-2xl">
        <p className="uppercase tracking-widest text-xs text-stone-400 font-sans mb-1">AI Stylist</p>
        <h1 className="font-serif text-stone-900 text-2xl sm:text-3xl mb-4" style={{ fontWeight: 400 }}>
          Опишите желаемый образ
        </h1>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Например: повседневный образ для девушки на весну"
            disabled={generating}
            className="flex-1 border border-stone-200 px-4 py-3 text-sm font-sans text-stone-900 placeholder:text-stone-300 focus:outline-none focus:border-stone-900 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!query.trim() || generating}
            className="bg-stone-900 text-white px-5 py-3 flex items-center gap-2 text-xs uppercase tracking-widest hover:bg-stone-700 transition-colors disabled:opacity-30"
          >
            {generating ? <Sparkles size={14} className="animate-pulse" /> : <Send size={14} />}
          </button>
        </form>
        <div className="flex flex-wrap gap-2 mt-3">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => { if (!generating) onSend(s); }}
              className="text-xs text-stone-400 border border-stone-200 px-3 py-1.5 hover:border-stone-400 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
