import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

const DURATION = 1.4;
const DELAY = 0.3;
const TOTAL = (DELAY + DURATION) * 1000 + 350;

const sweep = {
  duration: DURATION,
  ease: [0.4, 0.0, 0.2, 1] as const,
  delay: DELAY,
};

export function SplashScreen({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<"splash" | "exiting" | "done">("splash");

  useEffect(() => {
    if (phase !== "splash") return;
    const t = setTimeout(() => setPhase("exiting"), TOTAL);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "done") return <>{children}</>;

  return (
    <>
      <div style={{ opacity: 0, pointerEvents: "none" }}>{children}</div>

      <AnimatePresence onExitComplete={() => setPhase("done")}>
        {phase === "splash" && (
          <motion.div
            key="splash"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: DELAY }}
              className="text-center"
            >
              <span
                className="font-serif text-stone-900 tracking-[0.25em] uppercase select-none"
                style={{ fontSize: "clamp(1.8rem, 6vw, 2.8rem)", fontWeight: 400 }}
              >
                AVISHU
              </span>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: DELAY + 0.4 }}
                className="text-[10px] sm:text-xs tracking-[0.3em] uppercase text-stone-400 mt-3 font-sans"
              >
                since 2015
              </motion.p>
            </motion.div>

            <div
              className="absolute overflow-hidden"
              style={{
                bottom: "38%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "min(180px, 45vw)",
                height: 1,
              }}
            >
              <motion.div
                className="h-full bg-stone-300"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={sweep}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
