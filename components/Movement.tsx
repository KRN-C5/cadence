"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { SectionLabel } from "./Reveal";
import { smoothstep, useInView, useReducedMotion, useStickyProgress } from "@/lib/hooks";

const MovementScene = dynamic(
  () => import("./three/Scenes").then((m) => m.MovementScene),
  { ssr: false },
);

const STAGES = [
  { k: "Rotor", v: "Winding", at: 0 },
  { k: "Mainspring", v: "Storing", at: 1 },
  { k: "Governor", v: "Holding", at: 2 },
  { k: "Treat", v: "Delivered", at: 3 },
];

export function Movement() {
  const section = useRef<HTMLElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap, "250px");
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(0);
  const stageRef = useRef(0);

  const needle = useRef(0);
  const treat = useRef(0);

  const progress = useStickyProgress(section, (p) => {
    needle.current = smoothstep(0.58, 0.84, p);
    treat.current = smoothstep(0.3, 0.56, p) * (1 - smoothstep(0.9, 1, p));
    const s = p < 0.26 ? 0 : p < 0.52 ? 1 : p < 0.78 ? 2 : 3;
    if (s !== stageRef.current) {
      stageRef.current = s;
      setStage(s);
    }
  });

  return (
    <section
      id="movement"
      ref={section}
      className="relative bg-paper-2"
      style={{ height: "320vh" }}
    >
      <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden">
        <div className="container-x flex-1">
          <div className="grid h-full items-center gap-6 py-6 lg:grid-cols-12 lg:gap-10">
            <div className="order-2 lg:order-1 lg:col-span-5">
              <SectionLabel index="02">The movement</SectionLabel>

              <h2 className="display mt-6 text-[clamp(34px,4.4vw,64px)] leading-[0.98]">
                One roll.
                <br />
                <span className="text-muted">Then patience.</span>
              </h2>

              <p className="mt-6 max-w-[40ch] text-[14px] leading-[1.7] text-muted">
                The rotor swings as the barrel turns. The spring stores. The
                governor releases. A treat arrives — not all at once.
              </p>

              <div className="mt-8 divide-y divide-line border-y border-line">
                {STAGES.map((s, i) => (
                  <div
                    key={s.k}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
                          i <= stage ? "bg-orange" : "bg-line"
                        }`}
                      />
                      <span
                        className={`text-[11px] uppercase tracking-[0.2em] transition-colors duration-500 ${
                          i <= stage ? "text-ink" : "text-muted/50"
                        }`}
                      >
                        {s.k}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-[0.16em] transition-colors duration-500 ${
                        i === stage
                          ? "text-orange"
                          : i < stage
                            ? "text-muted"
                            : "text-muted/35"
                      }`}
                    >
                      {s.v}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-5 text-[11px] text-muted/75">
                Sequence is a visualisation. Release interval is a design
                target, not a tested number.
              </p>
            </div>

            <div
              ref={wrap}
              className="relative order-1 h-[42vh] min-h-[260px] lg:order-2 lg:col-span-7 lg:h-[78vh]"
            >
              <div className="absolute inset-0">
                <MovementScene
                  active={inView}
                  reduced={reduced}
                  progressRef={progress}
                  needleRef={needle}
                  treatRef={treat}
                />
              </div>
              <div className="pointer-events-none absolute bottom-2 right-0 hidden font-mono text-[9px] uppercase tracking-[0.2em] text-muted/60 lg:block">
                Rotor · Mainspring · Governor
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
