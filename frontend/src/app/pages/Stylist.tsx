import { useRef, useState } from "react";
import { askStylist } from "../lib/api";
import { StylistResponse } from "../lib/types";
import { StylistChat } from "../components/StylistChat";
import { StylistAIResults } from "../components/StylistAIResults";
import { StylistHistory } from "../components/StylistHistory";

const SUGGESTIONS = [
  "повседневный образ для девушки",
  "деловой стиль для мужчины",
  "спортивный лук на выходные",
  "вечерний образ на мероприятие",
];

export interface HistoryEntry {
  query: string;
  result: StylistResponse;
}

export default function Stylist() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSend = async (query: string) => {
    setGenerating(true);
    setError(null);
    setLastQuery(query);
    try {
      const response = await askStylist(query, sessionId);
      setSessionId(response.session_id);
      setHistory((prev) => [...prev, { query, result: response }]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось подобрать образ");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <StylistChat onSend={handleSend} generating={generating} suggestions={SUGGESTIONS} />
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {history.length > 0 && <StylistHistory entries={history} />}
        {generating && (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="font-serif italic text-stone-400">Подбираем образ…</p>
            {lastQuery && <p className="text-xs text-stone-300 mt-2">«{lastQuery}»</p>}
          </div>
        )}
        {error && !generating && (
          <div className="py-16 text-center border border-stone-200">
            <p className="font-serif text-stone-700">{error}</p>
            <p className="font-sans text-sm text-stone-400 mt-3">Убедитесь что AI Stylist сервис запущен.</p>
          </div>
        )}
        {history.length === 0 && !generating && !error && (
          <div className="py-20 text-center">
            <p className="font-serif italic text-stone-300 text-lg">Опишите желаемый образ или выберите подсказку</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
