import { useEffect, useRef, useState } from "react";

// The "AI" work-summary generation, shared by the Complete-job flow and the
// Work summary module's edit form so both behave identically (Daniel,
// 2026-08-06 — the behaviour was already built inside CompleteJobForm).
//
// There is no AI here: the button spins for a moment ("thinking"), then the
// fixed demo summary is TYPED into the field character by character.

export type GenPhase = "idle" | "thinking" | "typing";

/** How long the button spins before the text starts appearing. */
const THINKING_MS = 1100;
/** Typewriter speed: characters per tick, and the tick interval. */
const CHARS_PER_TICK = 3;
const TICK_MS = 18;

/**
 * The generated summary. Reads like a summary of the job's completed forms
 * (the walk-in cooler Service call + the air handler Hot Side - Repair).
 */
export const GENERATED_SUMMARY =
  "Diagnosed and repaired the Hoshizaki ice machine (Model KM-660). Found a clogged water inlet valve restricting flow to the reservoir; cleaned the valve, flushed the supply line, and replaced the inlet filter. Cycled the unit and confirmed normal ice production and drain flow. Recommended a follow-up descaling service in 6 months.";

/**
 * Drives the Generate animation for one text field.
 *
 * `onText` receives every intermediate value, so the caller keeps owning the
 * field's state. `reset` stops the animation and is called on unmount — a
 * dialog that closes mid-typing must not keep writing into a dead field.
 */
export default function useSummaryGenerator(onText: (text: string) => void, summary: string = GENERATED_SUMMARY) {
  const [phase, setPhase] = useState<GenPhase>("idle");

  // The thinking delay + every typewriter tick, so they can all be cancelled.
  const timers = useRef<number[]>([]);
  // `onText` is usually an inline arrow — keep the latest one without making
  // it a dependency that would restart the animation.
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  const reset = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
    setPhase("idle");
  };

  useEffect(() => () => reset(), []);

  const generate = () => {
    reset();
    onTextRef.current("");
    setPhase("thinking");
    timers.current.push(
      window.setTimeout(() => {
        setPhase("typing");
        let i = 0;
        const tick = () => {
          i = Math.min(summary.length, i + CHARS_PER_TICK);
          onTextRef.current(summary.slice(0, i));
          if (i < summary.length) timers.current.push(window.setTimeout(tick, TICK_MS));
          else setPhase("idle");
        };
        tick();
      }, THINKING_MS),
    );
  };

  return {
    phase,
    /** True while thinking OR typing — the button shows its spinner. */
    busy: phase !== "idle",
    generate,
    reset,
  };
}
