import { useRef, useState } from "react";
import { askStylist } from "../lib/api";
import { StylistResponse } from "../lib/types";
import { StylistChat } from "../components/StylistChat";
import { StylistAIResults } from "../components/StylistAIResults";
import { StylistHistory } from "../components/StylistHistory";
import { useT } from "../lib/i18n";

export interface HistoryEntry {
  query: string;
  result: StylistResponse;
}

export default function Stylist() {
  const t = useT();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const latestRef = useRef<HTMLDivElement>(null);
  const suggestions = [t("stylist.s1"), t("stylist.s2"), t("stylist.s3"), t("stylist.s4")];

  const handleSend = async (query: string) => {
    setGenerating(true);
    setError(null);
    setLastQuery(query);
    setTimeout(() => latestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    try {
      const response = await askStylist(query, sessionId);
      setSessionId(response.session_id);
      setHistory((prev) => [...prev, { query, result: response }]);
      setTimeout(() => latestRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("stylist.error"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <StylistChat onSend={handleSend} generating={generating} suggestions={suggestions} />
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {history.length > 0 && <StylistHistory entries={history} />}
        <div ref={latestRef} />
        {generating && (
          <div className="py-16 text-center">
            <div className="w-6 h-6 border border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="font-serif italic text-stone-400">{t("stylist.loading")}</p>
            {lastQuery && <p className="text-xs text-stone-300 mt-2">&laquo;{lastQuery}&raquo;</p>}
          </div>
        )}
        {error && !generating && (
          <div className="py-16 text-center border border-stone-200">
            <p className="font-serif text-stone-700">{error}</p>
            <p className="font-sans text-sm text-stone-400 mt-3">{t("stylist.service_error")}</p>
          </div>
        )}
        {history.length === 0 && !generating && !error && (
          <div className="py-20 text-center">
            <p className="font-serif italic text-stone-300 text-lg">{t("stylist.hint")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
