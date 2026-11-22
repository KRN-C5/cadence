"use client";

import { useEffect, useRef, useState } from "react";
import { framesReady, loadFrames, subscribeFrames } from "@/lib/frames";

const MIN_FIRST = 2100;
const MIN_REPEAT = 950;
const HARD_CAP = 5200;

export function Preloader({ onDone }: { onDone: () => void }) {
  const overlay = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const target = useRef(0);
  const [leaving, setLeaving] = useState(false);
  const finished = useRef(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = sessionStorage.getItem("cadence-seen") === "1";
    const started = performance.now();

    if (reduced) {
      document.documentElement.dataset.ready = "true";
      onDone();
      return;
    }

    loadFrames(0, 40);

    const finish = () => {
      if (finished.current) return;
      finished.current = true;
      target.current = 100;
      sessionStorage.setItem("cadence-seen", "1");
      window.setTimeout(() => {
        document.documentElement.dataset.ready = "true";
        setLeaving(true);
        window.setTimeout(onDone, 1150);
      }, 520);
    };

    let raf = 0;
    let value = 0;
    let readyAt = 0;

    const loop = () => {
      const loaded = Math.min(framesReady(), 40);
      const pct = Math.min(97, (loaded / 40) * 100);
      const elapsed = performance.now() - started;
      const min = seen ? MIN_REPEAT : MIN_FIRST;
      const timeReady = elapsed >= min;

      if (loaded >= 40 && timeReady && !readyAt) readyAt = performance.now();
      if (elapsed >= HARD_CAP && !readyAt) readyAt = performance.now();

      if (readyAt) {
        target.current = Math.min(100, 97 + ((performance.now() - readyAt) / 420) * 3);
        if (performance.now() - readyAt > 460) {
          finish();
          return;
        }
      } else {
        target.current = pct;
      }

      value += (target.current - value) * 0.09;
      const shown = Math.min(100, Math.round(value));
      if (counter.current) counter.current.textContent = String(shown).padStart(2, "0");
      if (bar.current) bar.current.style.transform = `scaleX(${shown / 100})`;
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);

    const unsub = subscribeFrames(() => {});
    return () => {
      cancelAnimationFrame(raf);
      unsub();
    };
  }, [onDone]);

  return (
    <div
      ref={overlay}
      className={`fixed inset-0 z-[100] flex flex-col justify-between bg-paper px-[var(--gutter)] py-8 transition-transform duration-[1100ms] ease-[cubic-bezier(0.76,0,0.24,1)] ${
        leaving ? "-translate-y-full" : ""
      }`}
      aria-hidden={leaving}
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.24em] text-muted">
        <span>Cadence</span>
        <span className="hidden sm:block">Design concept — MMXXVI</span>
      </div>

      <div className="flex flex-col items-center">
        <img
          src="/assets/brand/logo.webp"
          alt="Cadence"
          width={1200}
          height={800}
          className="pop-in w-[clamp(190px,26vw,300px)]"
          draggable={false}
        />
        <div className="mt-10 h-px w-[clamp(160px,22vw,260px)] overflow-hidden bg-line">
          <div
            ref={bar}
            className="h-full w-full origin-left bg-orange"
            style={{ transform: "scaleX(0)" }}
          />
        </div>
        <p className="mt-5 text-[10px] uppercase tracking-[0.26em] text-muted">
          Self-winding treat roller
        </p>
      </div>

      <div className="flex items-end justify-between">
        <p className="max-w-[240px] text-[11px] leading-relaxed text-muted">
          A study in patience, built for a dog&apos;s afternoon.
        </p>
        <div className="flex items-baseline gap-1 font-mono text-ink">
          <span ref={counter} className="text-[34px] leading-none tabular-nums">
            00
          </span>
          <span className="text-[11px] text-muted">/ 100</span>
        </div>
      </div>
    </div>
  );
}
