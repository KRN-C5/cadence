"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { SectionLabel } from "./Reveal";
import { ROLLER_PARTS, type RollerPartId } from "./three/RollerModel";
import { clamp, useInView, useReducedMotion, useStickyProgress } from "@/lib/hooks";

const MechanismScene = dynamic(
  () => import("./three/Scenes").then((m) => m.MechanismScene),
  { ssr: false },
);

const SHORT: Record<RollerPartId, string> = {
  "cap-a": "Gauge cap",
  shell: "Shell",
  ring: "Rings",
  cart: "Cartridge",
  rotor: "Rotor",
  reg: "Regulator",
  mag: "Magnets",
  "cap-b": "Fill cap",
};

export function Mechanism() {
  const section = useRef<HTMLElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const inView = useInView(wrap, "250px");
  const reduced = useReducedMotion();
  const [focus, setFocus] = useState<string | null>(null);
  const focusRef = useRef<string | null>(null);
  const explode = useRef(0);

  useStickyProgress(section, (p) => {
    // raw, linear progress: the model staggers and eases each part itself
    explode.current = clamp((p - 0.06) / 0.8);
  });

  const setActive = (id: RollerPartId | null) => {
    focusRef.current = id;
    setFocus(id);
  };

  return (
    <section
      id="mechanism"
      ref={section}
      className="relative bg-ink text-paper"
      style={{ height: "340vh" }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse at 68% 48%, rgba(232,93,31,0.12), transparent 58%)",
          }}
        />

        <div className="container-x relative flex h-full flex-col justify-center pt-[76px] pb-4 lg:pt-[88px] lg:pb-6">
          <div className="grid min-h-0 w-full min-w-0 flex-1 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] items-stretch gap-3 lg:grid-cols-12 lg:grid-rows-none lg:items-center lg:gap-10">
            <div className="order-1 min-w-0 lg:col-span-4">
              <SectionLabel index="03" light>
                The mechanism
              </SectionLabel>

              <h2 className="display mt-3 text-[clamp(26px,3.5vw,50px)] leading-[1] text-paper lg:mt-5">
                A watchmaker&apos;s idea,
                <span className="text-paper/45"> built for a dog&apos;s day.</span>
              </h2>

              <p className="mt-4 hidden max-w-[38ch] text-[13px] leading-[1.65] text-paper/55 sm:block">
                Eight assemblies, one direction, one patient release. Hover a part
                to bring it forward.
              </p>

              <div className="mt-6 hidden flex-col divide-y divide-paper/10 border-y border-paper/15 lg:flex">
                {ROLLER_PARTS.map((part, i) => (
                  <button
                    key={part.id}
                    type="button"
                    onMouseEnter={() => setActive(part.id)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(part.id)}
                    onBlur={() => setActive(null)}
                    onClick={() => setActive(part.id)}
                    className="group flex items-start gap-4 py-[9px] text-left"
                    aria-pressed={focus === part.id}
                  >
                    <span
                      className={`mt-[3px] font-mono text-[9px] tracking-[0.12em] transition-colors ${
                        focus === part.id ? "text-orange" : "text-paper/35"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-[11px] uppercase tracking-[0.16em] transition-colors ${
                          focus === part.id ? "text-paper" : "text-paper/70"
                        }`}
                      >
                        {part.name}
                      </span>
                      <span
                        className={`grid overflow-hidden text-[11px] leading-snug text-paper/45 transition-all duration-500 ${
                          focus === part.id
                            ? "mt-1 grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <span className="min-h-0">{part.note}</span>
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-3 grid grid-cols-4 gap-1.5 sm:mt-5 sm:grid-cols-8 lg:hidden">
                {ROLLER_PARTS.map((part) => (
                  <button
                    key={part.id}
                    type="button"
                    onClick={() => setActive(focus === part.id ? null : part.id)}
                    aria-pressed={focus === part.id}
                    className={`flex h-9 items-center justify-center border px-1 text-center text-[9px] uppercase leading-none tracking-[0.1em] transition-colors ${
                      focus === part.id
                        ? "border-orange bg-orange/10 text-orange"
                        : "border-paper/20 text-paper/60"
                    }`}
                  >
                    {SHORT[part.id]}
                  </button>
                ))}
              </div>
              <p className="mt-2 min-h-[16px] text-[11px] leading-snug text-paper/55 lg:hidden">
                {focus
                  ? ROLLER_PARTS.find((x) => x.id === focus)?.note
                  : "Tap a part to open the toy."}
              </p>
            </div>

            <div
              ref={wrap}
              className="relative order-2 h-full min-h-[220px] min-w-0 lg:col-span-8 lg:h-[76vh]"
            >
              <div className="absolute inset-0">
                <MechanismScene
                  active={inView}
                  reduced={reduced}
                  explodeRef={explode}
                  focusRef={focusRef}
                />
              </div>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-paper/10 pt-3 pr-28 text-[10px] uppercase tracking-[0.18em] text-paper/35 sm:mt-4 sm:pr-0">
            <span>Engineering concept illustration</span>
            <span className="hidden sm:block sm:pr-36">
              Mechanism subject to prototype validation
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
