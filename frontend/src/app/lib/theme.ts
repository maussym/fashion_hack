import { useSyncExternalStore } from "react";

let isDark = localStorage.getItem("avishu_theme") === "dark";
const listeners = new Set<() => void>();

function apply() {
  document.documentElement.classList.toggle("dark", isDark);
}
apply();

function subscribe(cb: () => void) { listeners.add(cb); return () => listeners.delete(cb); }
function getSnapshot() { return isDark; }

export function useTheme() {
  const dark = useSyncExternalStore(subscribe, getSnapshot);
  return {
    dark,
    toggle: () => {
      isDark = !isDark;
      localStorage.setItem("avishu_theme", isDark ? "dark" : "light");
      apply();
      listeners.forEach((l) => l());
    },
  };
}
