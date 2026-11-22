"use client";

import { Reveal, SectionLabel } from "./Reveal";

const FACTS = [
  { n: "0", label: "batteries", note: "Wound by play alone." },
  { n: "24", label: "pockets", note: "On the medium size." },
  { n: "1", label: "at a time", note: "The governor sets the pace." },
];

export function Statement() {
  return (
    <section className="relative py-[clamp(72px,11vw,150px)]">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Reveal>
              <SectionLabel index="—" light={false}>
                The premise
              </SectionLabel>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="display mt-8 text-[clamp(34px,5.2vw,72px)] leading-[1.02]">
                A dog&apos;s day is mostly waiting.
                <span className="text-muted"> Cadence gives the wait something to do.</span>
              </h2>
            </Reveal>
          </div>

          <div className="flex flex-col justify-end gap-6 lg:col-span-4 lg:pb-2">
            <Reveal delay={160}>
              <p className="max-w-[46ch] text-[15px] leading-[1.7] text-muted">
                Inside a ribbed, soft-touch shell sits a watchmaker&apos;s answer
                to boredom: a weighted rotor, a mainspring, and a governor that
                lets one treat fall at a time. No batteries. No app. Just play,
                wound by play.
              </p>
            </Reveal>
            <Reveal delay={220}>
              <p className="text-[11px] leading-relaxed text-muted/80">
                Engineering concept. Mechanism and performance subject to
                prototype validation.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-px border-t border-line bg-line sm:grid-cols-3">
          {FACTS.map((f, i) => (
            <Reveal key={f.label} delay={i * 90}>
              <div className="h-full bg-paper py-8 sm:px-8 sm:first:pl-0">
                <div className="flex items-baseline gap-3">
                  <span className="display text-[clamp(44px,5vw,68px)] leading-none">
                    {f.n}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
                    {f.label}
                  </span>
                </div>
                <p className="mt-3 text-[12px] text-muted">{f.note}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
