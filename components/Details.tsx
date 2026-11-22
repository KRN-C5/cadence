"use client";

import { Gauge, Hand, Lock, RotateCw, ShieldCheck, Timer } from "lucide-react";
import { Reveal, SectionLabel } from "./Reveal";

const FEATURES = [
  {
    icon: RotateCw,
    title: "Self-winding",
    body: "The rotor swings as the toy rolls, storing a little energy with every nudge.",
  },
  {
    icon: Timer,
    title: "Paced release",
    body: "A governor slows the carousel. One portion every 10–15 minutes is the design target.",
  },
  {
    icon: Gauge,
    title: "Power window",
    body: "A watch-style dial shows how wound the spring is, so you can see it working.",
  },
  {
    icon: Hand,
    title: "Soft-touch shell",
    body: "Ribbed TPE that is easy to roll, easy to grip, and kind to a wet nose.",
  },
  {
    icon: Lock,
    title: "Twist-lock fill",
    body: "One turn opens the pocket rings. Dry kibble or small treats only.",
  },
  {
    icon: ShieldCheck,
    title: "Sealed cartridge",
    body: "A magnetic coupling passes motion through the wall, so the mechanism stays clean.",
  },
];

const SAFETY = [
  "Dry kibble or small treats only.",
  "Supervise play. Not a chew toy.",
  "Retire the toy if it becomes damaged.",
  "Design concept — specifications are targets pending prototype validation.",
];

export function Details() {
  return (
    <section id="details" className="py-[clamp(72px,10vw,140px)]">
      <div className="container-x">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <Reveal>
            <SectionLabel index="06">The details</SectionLabel>
            <h2 className="display mt-5 max-w-[18ch] text-[clamp(34px,4.6vw,64px)] leading-[0.98]">
              Everything earns its place.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="max-w-[30ch] text-[11px] leading-relaxed text-muted/80 sm:text-right">
              Eight assemblies. No screen, no battery, no subscription.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid grid-cols-1 border-t border-line sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <Reveal key={f.title} delay={(i % 3) * 80}>
                <div className="flex h-full flex-col border-b border-line py-8 sm:px-7 sm:even:border-l lg:even:border-l-0 lg:[&:nth-child(3n+2)]:border-l lg:[&:nth-child(3n+3)]:border-l sm:[&:first-child]:pl-0">
                  <div className="flex items-center justify-between">
                    <Icon size={20} strokeWidth={1.2} className="text-orange" />
                    <span className="font-mono text-[9px] tracking-[0.14em] text-muted/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="mt-6 text-[13px] uppercase tracking-[0.16em]">
                    {f.title}
                  </h3>
                  <p className="mt-2.5 max-w-[34ch] text-[13px] leading-[1.65] text-muted">
                    {f.body}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal>
          <div className="mt-14 grid gap-8 border-y border-line py-8 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-orange">
                Safety and honesty
              </p>
            </div>
            <div className="grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:col-span-9">
              {SAFETY.map((s) => (
                <p key={s} className="flex gap-3 text-[12px] leading-relaxed text-muted">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-line" />
                  {s}
                </p>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
