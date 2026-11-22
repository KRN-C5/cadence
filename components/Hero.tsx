"use client";

import { useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { useInView, useReducedMotion } from "@/lib/hooks";

const HeroScene = dynamic(
  () => import("./three/Scenes").then((m) => m.HeroScene),
  { ssr: false },
);

const SPECS = [
  { k: "Self-winding", v: "Rotor and mainspring" },
  { k: "Paced release", v: "10–15 min design target" },
  { k: "Power window", v: "Watch-style reserve gauge" },
];

export function Hero() {
  const canvasWrap = useRef<HTMLDivElement>(null);
  const inView = useInView(canvasWrap, "300px");
  const reduced = useReducedMotion();

  return (
    <section className="relative flex min-h-[100svh] flex-col pt-[72px]">
      <div className="container-x grid flex-1 items-center gap-6 py-10 lg:grid-cols-12 lg:gap-8 lg:py-0">
        <div className="relative z-10 min-w-0 lg:col-span-6 lg:pb-10">
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.22em] text-muted">
            <span className="h-1 w-1 rounded-full bg-orange" />
            <span>Self-winding treat roller</span>
            <span className="hidden text-line sm:inline">/</span>
            <span className="hidden sm:inline">Concept study</span>
          </div>

          <h1 className="display mt-7 text-[clamp(48px,7vw,120px)]">
            <span className="line-mask">
              <span>Boredom?</span>
            </span>
            <span className="line-mask">
              <span className="delay-1">Not anymore.</span>
            </span>
          </h1>

          <p className="mt-8 max-w-[42ch] text-[16px] leading-[1.65] text-muted">
            A little roll. A little play. A rewarding surprise. Cadence turns a
            dog&apos;s everyday play into a slow, patient ritual — no batteries,
            no app, no rush.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/checkout" className="btn btn-primary group">
              Reserve the first run
              <ArrowUpRight
                size={15}
                strokeWidth={1.6}
                className="transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
            <a href="#film" className="btn btn-ghost group">
              See the film
              <ArrowDown
                size={14}
                strokeWidth={1.6}
                className="transition-transform duration-500 group-hover:translate-y-0.5"
              />
            </a>
          </div>

          <p className="mt-6 text-[11px] text-muted/80">
            No payment today. Sizes and timings are design targets, not tested
            numbers.
          </p>
        </div>

        <div
          ref={canvasWrap}
          className="relative h-[46vh] min-h-[320px] w-full min-w-0 lg:col-span-6 lg:h-[78vh] lg:min-h-0"
        >
          <div
            className="pointer-events-none absolute inset-0 -z-0"
            aria-hidden
            style={{
              background:
                "radial-gradient(closest-side, rgba(232,93,31,0.07), transparent 72%)",
            }}
          />
          <div className="absolute inset-0">
            <HeroScene active={inView} reduced={reduced} />
          </div>

          <div className="pointer-events-none absolute bottom-2 left-0 hidden items-center gap-3 text-[9px] uppercase tracking-[0.22em] text-muted/70 lg:flex">
            <span className="h-px w-6 bg-line" />
            Drag to turn
          </div>
          <div className="pointer-events-none absolute right-0 top-1/2 hidden -translate-y-1/2 rotate-90 text-[9px] uppercase tracking-[0.3em] text-muted/60 lg:block">
            Cadence — MMXXVI
          </div>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-x grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {SPECS.map((s) => (
            <div key={s.k} className="flex items-baseline justify-between gap-4 py-4 sm:block sm:py-5 sm:pr-6 sm:first:pl-0 sm:last:pr-0">
              <p className="text-[10px] uppercase tracking-[0.2em] text-ink">{s.k}</p>
              <p className="text-[12px] text-muted sm:mt-1.5">{s.v}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
