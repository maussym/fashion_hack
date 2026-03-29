import { RefObject } from "react";
import { StylistAIResults } from "./StylistAIResults";
import type { HistoryEntry } from "../pages/Stylist";

interface Props {
  entries: HistoryEntry[];
  latestRef: RefObject<HTMLDivElement | null>;
}

export function StylistHistory({ entries, latestRef }: Props) {
  return (
    <div className="space-y-12">
      {entries.map((entry, i) => (
        <div key={i} ref={i === entries.length - 1 ? latestRef : undefined}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 bg-stone-900 text-white text-[10px] flex items-center justify-center shrink-0">
              {i + 1}
            </div>
            <p className="text-sm text-stone-500 font-sans">«{entry.query}»</p>
          </div>
          <StylistAIResults result={entry.result} />
          {i < entries.length - 1 && <div className="border-b border-stone-100 mt-12" />}
        </div>
      ))}
    </div>
  );
}
